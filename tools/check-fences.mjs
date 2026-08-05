// 檢查 Directus CMS 已發布文章的 fence code block 是否「還沒決定類型」，有就讓建置失敗。
//
// 這支腳本不猜任何東西。tools/scan-code-fences.mjs 是搬家用的一次性啟發式分類工具，
// 已經用完；本腳本刻意不沿用它的猜測邏輯——猜一定會錯（實測「內文含請」判斷提示詞，
// 「沒接受邀請就去拿 Token」被誤判成提示詞，全站 57 個「請」有 28 個是「申請／邀請」
// 之類的詞，不是提示詞語氣詞）。正確做法是寫文章當下人工標記，本腳本只負責把「還沒
// 標記」的區塊攔下來，決定權交回給寫作者，不代為判斷應該標什麼。
//
// 判定規則（與 .claude/skills/blog-writing/SKILL.md「程式碼區塊標記」一節一致）：
//   - fence 語言標記是 text（不分大小寫）或完全沒寫 → 未決定類型，建置失敗
//   - 其他語言標記（json、md、yaml、js、diff……含 bash/powershell/sh/shell/prompt/
//     agent/codex/claude-code/output）一律視為已決定，通過檢查——這支腳本不驗證
//     標記本身是否正確，只抓「根本沒標」的狀態
//   - blockquote 沒有 [!note]／[!備註]／[!說明] 開頭 → 只警告，不讓建置失敗（這種
//     blockquote 會自動長出複製按鈕，但常常只是編輯提醒，站主還沒逐篇決定要不要改，
//     見 threads-api-tutorial 現有 5 個案例）
//
// 只讀 CMS 公開端點（不需要 token、不送 Authorization header），不寫入 CMS、不改任何
// 本地檔案。
//
// 用法：node tools/check-fences.mjs

const CMS = 'https://cms.aixwang.dev';
// filter[status][_eq] 的方括號編碼成 %5B %5D：不編碼在某些環境會報 URL malformed。
const ARTICLES_URL = `${CMS}/items/articles?filter%5Bstatus%5D%5B_eq%5D=published&limit=-1&fields=id,slug,title,body`;

const VALID_TYPES_HINT = 'bash / powershell / sh / shell / prompt / agent（別名 codex、claude-code）/ output';

// ────────────────────────── 讀取 CMS ──────────────────────────

async function fetchArticles() {
  const res = await fetch(ARTICLES_URL);
  if (!res.ok) {
    throw new Error(`Directus 文章抓取失敗：HTTP ${res.status}（${ARTICLES_URL}）`);
  }
  const json = await res.json();
  if (!Array.isArray(json.data)) {
    throw new Error('Directus 回傳格式不是預期的 { data: [...] }，無法繼續解析。');
  }
  return json.data;
}

// ────────────────────────── 從 body 抓出 fence code block ──────────────────────────
//
// 逐行掃描，只認 ``` 開頭的 fence（本站目前沒有文章用 ~~~ fence；如果之後有人用，這支
// 腳本會直接漏掉那些區塊而不是誤判，之後要支援的話在這裡加規則即可）。
//
// 開合判斷依 CommonMark 規則處理巢狀：開頭 fence 可以是 3 個以上的反引號（資訊字串本身
// 不能含反引號），收尾 fence 只要求「反引號數量 ≥ 開頭數量、該行去空白後沒有其他字元」。
// 這樣一來，外層用 4 個反引號開的 fence，內容裡出現的 3 個反引號（例如引用另一段程式碼
// 當範例）不會被誤判成收尾，只有真正配對的收尾才會關閉區塊。
//
// 開合不成對時直接丟錯，不默默略過或用猜的配對（專案明文紀律：錯誤明確拋出）。
function extractFences(body, slug) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let open = null; // { fenceLen, lang, startLine, contentLines: [] }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!open) {
      const openMatch = line.match(/^ {0,3}(`{3,})([^`]*)$/);
      if (openMatch) {
        open = { fenceLen: openMatch[1].length, lang: openMatch[2].trim(), startLine: i + 1, contentLines: [] };
      }
      continue;
    }
    const closeMatch = line.match(/^ {0,3}(`{3,})\s*$/);
    if (closeMatch && closeMatch[1].length >= open.fenceLen) {
      blocks.push({ lang: open.lang, content: open.contentLines.join('\n'), startLine: open.startLine });
      open = null;
    } else {
      open.contentLines.push(line);
    }
  }

  if (open) {
    throw new Error(
      `${slug} 第 ${open.startLine} 行開啟的 fence code block（語言標記：「${open.lang || '(無)'}」）沒有對應的收尾 \`\`\`，無法解析，請先確認 CMS 原文完整性。`,
    );
  }
  return blocks;
}

// ────────────────────────── 從 body 抓出 markdown blockquote ──────────────────────────
//
// 只認 markdown `>` 語法（連續、不間斷空行的 `>` 開頭行合成一個 blockquote），不處理直接
// 貼在正文裡的 HTML <blockquote> 標籤——那些不會經過 src/content.config.ts 的 marked
// blockquote renderer，跟「複製按鈕 vs 無複製按鈕」的規則無關。
function extractBlockquotes(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let open = null; // { startLine, rawLines: [] }

  const flush = () => {
    if (open) {
      blocks.push({ content: open.rawLines.join('\n'), startLine: open.startLine });
      open = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^ {0,3}>\s?(.*)$/);
    if (m) {
      if (!open) open = { startLine: i + 1, rawLines: [] };
      open.rawLines.push(m[1]);
    } else {
      flush();
    }
  }
  flush();
  return blocks;
}

// 與 src/content.config.ts 的 blockquote renderer 同一條規則：開頭是
// [!note] / [!備註] / [!說明]（大小寫不拘）才會標成 data-no-copy、不長複製按鈕。
const NOTE_MARKER = /^\s*\[!(?:note|備註|說明)\]/i;

// ────────────────────────── 內容預覽（給錯誤／警告訊息用） ──────────────────────────

function preview(content, limit = 80) {
  const flat = content.replace(/\s+/g, ' ').trim();
  const cut = [...flat].slice(0, limit).join('');
  return cut.length < flat.length ? `${cut}…` : cut;
}

// ────────────────────────── 檢查單篇文章 ──────────────────────────

function checkArticle(article) {
  const body = article.body || '';
  const undecidedFences = [];
  const unmarkedBlockquotes = [];

  const fences = extractFences(body, article.slug);
  for (const block of fences) {
    const token = block.lang.split(/\s+/)[0] || '';
    const isUndecided = !token || token.toLowerCase() === 'text';
    if (isUndecided) {
      undecidedFences.push({
        slug: article.slug,
        startLine: block.startLine,
        tag: token || '（無標記）',
        content: block.content,
      });
    }
  }

  for (const bq of extractBlockquotes(body)) {
    if (NOTE_MARKER.test(bq.content)) continue;
    unmarkedBlockquotes.push({ slug: article.slug, startLine: bq.startLine, content: bq.content });
  }

  return { fenceCount: fences.length, undecidedFences, unmarkedBlockquotes };
}

// ────────────────────────── 入口 ──────────────────────────

async function main() {
  const articles = await fetchArticles();
  if (!articles.length) {
    throw new Error('CMS 沒有回傳任何 published 文章，無法檢查。');
  }

  let fenceCount = 0;
  const undecidedFences = [];
  const unmarkedBlockquotes = [];

  for (const article of articles) {
    const { fenceCount: fc, undecidedFences: uf, unmarkedBlockquotes: ub } = checkArticle(article);
    fenceCount += fc;
    undecidedFences.push(...uf);
    unmarkedBlockquotes.push(...ub);
  }

  if (unmarkedBlockquotes.length) {
    console.warn(
      `⚠ ${unmarkedBlockquotes.length} 個 blockquote 沒有 [!note]／[!備註]／[!說明] 開頭（會自動長出複製按鈕，但不影響建置，是否要改標由站主決定）：`,
    );
    for (const w of unmarkedBlockquotes) {
      console.warn(`    ${w.slug} 第 ${w.startLine} 行：${preview(w.content)}`);
    }
    console.warn('');
  }

  if (undecidedFences.length) {
    console.error(`✗ 發現 ${undecidedFences.length} 個未決定類型的 fence code block：`);
    console.error('');
    for (const item of undecidedFences) {
      console.error(`✗ ${item.slug} 第 ${item.startLine} 行：語言標記是 \`\`\`${item.tag}（未決定類型）`);
      console.error(`    ${preview(item.content)}`);
      console.error(`    請在 CMS 把它改成下列其中一種：${VALID_TYPES_HINT}`);
      console.error('');
    }
    process.exitCode = 1;
    return;
  }

  console.log(`fence 標記檢查通過：${articles.length} 篇文章，${fenceCount} 個 fence code block 全部已標記類型。`);
}

main().catch((err) => {
  console.error(`fence 標記檢查失敗：${err.message}`);
  process.exitCode = 1;
});
