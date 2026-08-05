// 掃描 Directus CMS 文章正文裡「標記不清楚」的 code fence（```text``` 或無標記）與
// blockquote，套用啟發式規則提出分類建議，輸出成 docs/code-fence-audit.md 供人工逐一確認，
// 並另外產出 docs/code-fence-patch-proposal.md（可人工逐條確認後複製套用的修改提案）。
//
// 背景：```text``` 目前被拿來裝很多不同的東西（提示詞、錯誤輸出、版本號、URL、指令），
// 應該拆成四類語言標記：
//   bash / powershell → 終端機指令（現有標記已準確，不在本次掃描範圍內）
//   prompt            → 要貼進 AI 對話框的自然語言指示
//   output            → 執行結果、錯誤訊息、版本號字串、純網址
//   toolcmd           → 打在 AI 工具「互動介面」裡的指令（例如 Codex CLI／Claude Code 的
//                        斜線指令），語言標記直接用工具名（codex、claude-code……），不是系統
//                        終端機指令、也不是自然語言提示詞，三個既有分類都套不上
// 另外 threads-api-tutorial 用 markdown blockquote（`>`）放類似提示詞的內容，其他文章用
// ```text```——同一種東西兩種標法，也一併列出可疑的 blockquote。
//
// 只讀 CMS（公開端點，不需要 token，不送 Authorization header），不寫入 CMS、不改本地任何
// 檔案（除了輸出的報告與提案本身）。修改提案只產出文件，不會自動把任何內容送回 CMS——
// 誤判會讓提示詞失去複製按鈕，最後一關一定要人看過再手動套用。
//
// 用法：node tools/scan-code-fences.mjs

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CMS = 'https://cms.aixwang.dev';
const OUT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'docs',
  'code-fence-audit.md',
);
const PATCH_PROPOSAL_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'docs',
  'code-fence-patch-proposal.md',
);

// ────────────────────────── 讀取 CMS ──────────────────────────

export async function fetchArticles() {
  const url = `${CMS}/items/articles?filter[status][_eq]=published&limit=-1&fields=id,slug,title,body`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Directus 文章抓取失敗：HTTP ${res.status}（${url}）`);
  }
  const json = await res.json();
  if (!Array.isArray(json.data)) {
    throw new Error('Directus 回傳格式不是預期的 { data: [...] }，無法繼續解析。');
  }
  return json.data;
}

// ────────────────────────── 從 body 抓出 fence code block ──────────────────────────
//
// 逐行掃描，只認 ``` 開頭的 fence（本站目前沒有文章用 ~~~ fence，grep 過全部 published
// 文章證實過；如果之後有人用 ~~~，這支腳本會直接漏掉那些區塊而不是誤判——之後要支援的話
// 在這裡加規則即可）。開合不成對時直接丟錯，不要默默略過或用猜的配對。
function extractFences(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let open = null; // { lang, startLine, contentLines: [] }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fenceMatch = line.match(/^```([^\n`]*)$/);
    if (!open) {
      if (fenceMatch) {
        open = { lang: fenceMatch[1].trim(), startLine: i + 1, contentLines: [] };
      }
      continue;
    }
    // 已經在 fence 裡：遇到獨立一行的 ``` 才算收尾（不管收尾那行是否又帶語言標記，
    // markdown 規範收尾 fence 不該帶內容，這裡只要求整行去空白後等於 ```）
    if (line.trim() === '```') {
      blocks.push({
        lang: open.lang,
        content: open.contentLines.join('\n'),
        startLine: open.startLine,
      });
      open = null;
    } else {
      open.contentLines.push(line);
    }
  }

  if (open) {
    throw new Error(
      `第 ${open.startLine} 行開啟的 fence code block（語言標記：「${open.lang || '(無)'}」）沒有對應的收尾 \`\`\`，無法解析，請先確認 CMS 原文完整性。`,
    );
  }
  return blocks;
}

// ────────────────────────── 從 body 抓出 markdown blockquote ──────────────────────────
//
// 只認 markdown `>` 語法（連續、不間斷空行的 `>` 開頭行合成一個 blockquote），不處理
// 直接貼在正文裡的 HTML <blockquote> 標籤（例如 Threads 貼文嵌入卡）——那些不會經過
// src/content.config.ts 裡 marked 的 blockquote renderer（該 renderer 只攔截 markdown
// 語法轉出來的 blockquote token，原始 HTML block 會被當成 raw HTML 直接透傳），
// 跟本次要處理的「複製按鈕 vs 無複製按鈕」規則無關。
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

// 排除說明性引用：src/content.config.ts 的 blockquote renderer 只認開頭是
// [!note] / [!備註] / [!說明]（大小寫不拘）的第一段，符合的會標成 data-no-copy、
// 不會出現複製按鈕，代表這篇文章的作者本來就把它當「說明」而非「拿去貼的內容」。
const NOTE_MARKER = /^\s*\[!(?:note|備註|說明)\]/i;

// ────────────────────────── 區塊正上方的文字（給 R5 判斷工具用） ──────────────────────────
//
// R5（AI 工具介面斜線指令）要判斷「這是哪個工具的指令」，唯一站得住腳的依據是原文自己寫了
// 什麼——不用猜。這裡抓的是區塊正上方、還沒被空行隔成新段落的文字（例如「在 Codex CLI
// 輸入：」），只往上爬到遇到第二個空行、遇到上一個 fence/blockquote 的收尾、或抓滿
// maxLines 為止，避免抓到不相關的上一段內容。
function getLocalContext(lines, startLine1Based, maxLines = 8) {
  const collected = [];
  let blanksInRow = 0;
  for (let i = startLine1Based - 2; i >= 0 && collected.length < maxLines; i--) {
    const line = lines[i];
    if (line === undefined) break;
    if (line.trim() === '') {
      blanksInRow++;
      if (blanksInRow >= 2) break;
      continue;
    }
    blanksInRow = 0;
    if (line.trim().startsWith('```') || /^ {0,3}>\s?/.test(line)) break;
    collected.unshift(line);
  }
  return collected.join('\n');
}

// ────────────────────────── 分類啟發式規則 ──────────────────────────
//
// 規則依序判斷、命中第一條就採用（順序即優先權）。每條規則的依據寫在該條規則旁。
// 任何一條都不確定命中時，一律回傳 UNSURE，不用較弱的規則去湊一個答案
// （專案紀律：判斷不明確就說不知道，不要用「通常」「一般來說」蓋過去）。

const KNOWN_CLI_NAMES = new Set([
  // 任務描述明列的：codex、npm、npx、git、cd、ls、curl、wsl
  'codex', 'npm', 'npx', 'git', 'cd', 'ls', 'curl', 'wsl',
  // 本站現有 bash/powershell 區塊實際出現過的指令（codex-cli-wsl2-windows.md 驗證過）：
  // mkdir、code
  'mkdir', 'code',
  // 常見到誤判風險很低、且與上述指令同一類（基礎 shell／版本控制／套件管理）的指令，
  // 沒有在站內出現過的生僻指令刻意不加，避免規則沒有實證支持就擴大範圍
  'sudo', 'cat', 'echo', 'export', 'source', 'bash', 'sh', 'pwsh', 'powershell',
  'node', 'python', 'python3', 'pip', 'pip3', 'docker', 'ssh', 'chmod', 'mv', 'cp', 'rm',
  'tar', 'unzip', 'apt', 'apt-get', 'brew', 'yarn', 'pnpm', 'wget', 'systemctl',
]);

function chineseRatio(text) {
  const nonWs = text.replace(/\s/g, '');
  if (!nonWs.length) return 0;
  const han = nonWs.match(/[一-鿿]/g) || [];
  return han.length / nonWs.length;
}

// 純版本字串：任務範例是 openai.chatgpt@26.721.30844（pkg@x.y.z…）或裸的 x.y.z / x.y.z.w
const RE_VERSION_AT = /^[\w.\-]+@\d+(\.\d+){1,4}[\w.\-]*$/;
const RE_VERSION_BARE = /^v?\d+\.\d+\.\d+(\.\d+)?$/;
const RE_URL_ONLY = /^https?:\/\/\S+$/;
// WARNING / ERROR 全大写是實測 CLI 輸出的常見樣式；error: / warning: / fatal: 這種
// 小寫＋冒號的字首也是常見 log 慣例（任務描述明確舉了 error: 這個例子）；
// Exception / Traceback 是常見的堆疊追蹤關鍵字，本次語料沒出現，但先寫進規則以防之後遇到
const RE_ERROR_KEYWORD = /\b(WARNING|ERROR|Exception|Traceback)\b|\b(error|warning|fatal)\s*:/i;
// AI 工具互動介面裡的斜線指令（/model、/new、/compact、/usage……）：這是打進 Codex CLI、
// Claude Code 這類工具「對話框」裡的內部指令，既不是系統終端機指令（不該標 bash/
// powershell，貼進系統終端機會 command not found），也不是要讀給 AI 聽的自然語言提示詞
// （不該標 prompt），獨立成第四類 toolcmd，語言標記直接用工具名。
//
// 這條正則只認「整行只有一個 /單字」（可含連字號，例如 /new-session），刻意不允許斜線後面
// 出現空格或第二個 /：
//   - 跟網址／路徑的斜線區分：`https://…`、`curl -fsSL https://…`、`/home/user/config`
//     都因為不是「整行只有一個 /word」而不會命中（網址不是以 / 開頭；多層路徑因為含第二個
//     /，`[\w-]*` 吃不到、整行匹配不到結尾 $；帶其他文字或空格的整行也一樣匹配不到）。
//   - 沒辦法排除的唯一情況是「整行只有一個單層路徑」（例如單獨一行的 /tmp、/etc）：目前掃過
//     的語料庫裡沒有這種區塊（已用全部已知候選區塊核對過），如果之後出現，靠下面的
//     TOOL_CONTEXT_MARKERS 兜底——找不到已知工具名稱時一律 UNSURE，不會被錯標成某個工具
//     指令。
const RE_SLASH_COMMAND = /^\/[a-zA-Z][\w-]*$/;

// 已知工具名稱關鍵字，用來判斷斜線指令「是哪個工具的」。只收錄站內文章原文裡實際出現過、
// 拿來指稱該工具的具體字串，不臆測命令清單本身（不假設 /model、/compact 這類指令只屬於
// 單一工具，因為不同工具可能剛好用同一個指令名稱）。之後如果站內出現 Gemini CLI、Cursor
// 的斜線指令，在這裡加一筆 { tool, pattern } 就能延伸，不用改判斷邏輯。
//   - codex：本站 codex-* 系列文章原文明確寫「在 Codex CLI 輸入」「Codex CLI 也能直接
//     輸入」（見 codex-usage-limit-reset 第 23、35、141 行）
//   - claude-code：本站 threads-api-tutorial 原文明確寫「請 Claude Code 用 API 換成…」
//     （第 81 行），保留這條 marker 供之後站內出現 Claude Code 斜線指令時沿用同一套判斷
const TOOL_CONTEXT_MARKERS = [
  { tool: 'codex', pattern: /Codex(?:\s*CLI)?/i },
  { tool: 'claude-code', pattern: /Claude\s*Code/i },
];

function classifyText(raw, context = { localContext: '', articleTitle: '', articleSlug: '' }) {
  const content = raw.trim();

  // R1：空區塊，沒有內容可判斷
  if (!content) {
    return { suggestion: 'UNSURE', confidence: 'LOW', rule: 'R1_EMPTY', reason: '區塊內容是空的，沒有依據可以判斷。' };
  }

  const lines = content.split('\n');
  const singleLine = lines.length === 1;

  // R2：整個區塊只有一個 URL → output（任務範例：純網址）
  if (singleLine && RE_URL_ONLY.test(content)) {
    return { suggestion: 'output', category: 'output', confidence: 'HIGH', rule: 'R2_URL_ONLY', reason: '整個區塊只有一行，且該行是完整的 http(s) URL。' };
  }

  // R3：純版本字串 → output（任務範例：openai.chatgpt@26.721.30844）
  if (singleLine && (RE_VERSION_AT.test(content) || RE_VERSION_BARE.test(content))) {
    return { suggestion: 'output', category: 'output', confidence: 'HIGH', rule: 'R3_VERSION_STRING', reason: '整個區塊只有一行，且符合「套件名@版本號」或「x.y.z」版本字串格式。' };
  }

  // R4：含 WARNING/ERROR/error: 等關鍵字 → output（任務範例：錯誤輸出）
  if (RE_ERROR_KEYWORD.test(content)) {
    return { suggestion: 'output', category: 'output', confidence: 'HIGH', rule: 'R4_ERROR_KEYWORD', reason: '內容含 WARNING / ERROR / error: / warning: / fatal: 等錯誤輸出常見關鍵字。' };
  }

  // R5：AI 工具互動介面斜線指令 → toolcmd（語言標記用工具名，如 codex／claude-code）
  // 判斷依據分兩層，兩層都要有原文明確寫出的工具名稱才會下判斷，不用猜：
  //   1) 區塊正上方的段落（getLocalContext）明確提到某個工具名稱 → 用該工具，HIGH
  //      （例：「在 Codex CLI 輸入：」緊接在 /model 正上方）
  //   2) 正上方沒提到，退而看整篇文章標題／slug 有沒有明確、且唯一地指向某個工具 → 用該
  //      工具，MEDIUM（例：codex-usage-limit-reset 第 53 行的 /compact 正上方只寫「這時
  //      輸入：」沒提到工具名，但全文標題與 slug 都是 codex-usage-limit-reset）
  //   兩層都對不到唯一一個工具（完全沒提到、或同時提到兩個不同工具），維持 UNSURE 並說明原
  //   因，不用猜的湊一個工具名——這正是最初 8 個 UNSURE 裡 5 個屬於這條規則的問題，加了
  //   toolcmd 分類後才有地方可以歸類。
  if (singleLine && RE_SLASH_COMMAND.test(content)) {
    const localHits = TOOL_CONTEXT_MARKERS.filter((m) => m.pattern.test(context.localContext || ''));
    if (localHits.length === 1) {
      const tool = localHits[0].tool;
      return {
        suggestion: tool,
        category: 'toolcmd',
        confidence: 'HIGH',
        rule: 'R5_TOOLCMD_LOCAL_CONTEXT',
        reason: `「${content}」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「${tool}」，判斷為打在該工具互動介面裡的指令。`,
      };
    }
    if (localHits.length > 1) {
      return {
        suggestion: 'UNSURE',
        confidence: 'LOW',
        rule: 'R5_TOOLCMD_AMBIGUOUS_CONTEXT',
        reason: `「${content}」是斜線指令，但區塊正上方文字同時提到多個工具名稱（${localHits.map((h) => h.tool).join('、')}），無法判斷是哪個工具的指令，需要人工確認。`,
      };
    }
    const articleContext = `${context.articleTitle || ''} ${context.articleSlug || ''}`;
    const articleHits = TOOL_CONTEXT_MARKERS.filter((m) => m.pattern.test(articleContext));
    if (articleHits.length === 1) {
      const tool = articleHits[0].tool;
      return {
        suggestion: tool,
        category: 'toolcmd',
        confidence: 'MEDIUM',
        rule: 'R5_TOOLCMD_ARTICLE_CONTEXT',
        reason: `「${content}」是斜線開頭的工具介面指令；區塊正上方沒有明確提到工具名稱，但整篇文章標題／slug 明確只指向「${tool}」（標題：${context.articleTitle}，slug：${context.articleSlug}），信心度中等。`,
      };
    }
    return {
      suggestion: 'UNSURE',
      confidence: 'LOW',
      rule: 'R5_TOOLCMD_UNKNOWN_TOOL',
      reason: `「${content}」是斜線開頭、整行只有一個指令詞，格式符合工具介面指令，但區塊正上方與全文標題／slug 都沒有明確提到已知工具名稱（目前已收錄：${TOOL_CONTEXT_MARKERS.map((m) => m.tool).join('、')}），無法判斷是哪個工具，也可能根本不是工具指令（例如單層路徑），需要人工確認。`,
    };
  }

  // R6：短的英文命令列樣式，第一個詞是已知 CLI 名稱 → bash
  const firstToken = lines[0].trim().replace(/^[$#>]\s*/, '').split(/\s+/)[0];
  if (firstToken && KNOWN_CLI_NAMES.has(firstToken) && chineseRatio(content) < 0.1 && lines.length <= 6) {
    return {
      suggestion: 'bash',
      category: 'bash',
      confidence: lines.length <= 2 ? 'HIGH' : 'MEDIUM',
      rule: 'R6_KNOWN_CLI',
      reason: `第一個詞「${firstToken}」是已知 CLI 名稱清單裡的指令，內容幾乎沒有中文，符合「短的英文命令列樣式」。`,
    };
  }

  // R7：以「請」開頭 → prompt（任務範例：以「請」開頭的提示詞）
  if (content.startsWith('請')) {
    return {
      suggestion: 'prompt',
      category: 'prompt',
      confidence: content.length > 15 ? 'HIGH' : 'MEDIUM',
      rule: 'R7_PROMPT_LEADING_QING',
      reason: '內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。',
    };
  }

  const ratio = chineseRatio(content);

  // R8：中文比例高、夠長，且內文其他地方也出現「請」→ prompt（語氣詞不在句首，但仍是指令句）
  if (ratio >= 0.3 && content.length >= 20 && content.includes('請')) {
    return {
      suggestion: 'prompt',
      category: 'prompt',
      confidence: 'MEDIUM',
      rule: 'R8_PROMPT_CHINESE_WITH_QING',
      reason: '中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。',
    };
  }

  // R9：中文比例高、夠長，但完全沒有「請」→ 無法確定是提示詞還是純說明文字，UNSURE
  // （已知限制：像「只看 X，不要掃描 Y」這種沒用「請」字的祈使句，這條規則會判成 UNSURE
  //  而不是 prompt——刻意不用更多關鍵字去湊，避免規則變得脆弱、只是為了迎合這批語料）
  if (ratio >= 0.3 && content.length >= 20) {
    return {
      suggestion: 'UNSURE',
      confidence: 'LOW',
      rule: 'R9_CHINESE_NO_QING',
      reason: '中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。',
    };
  }

  // R10：以上都不命中
  return {
    suggestion: 'UNSURE',
    confidence: 'LOW',
    rule: 'R10_FALLBACK',
    reason: '內容特徵不符合任何一條規則（不是純 URL／版本字串、沒有錯誤關鍵字、不是已知 CLI 指令、也不是中文比例夠高的自然語言），無法判斷。',
  };
}

// ────────────────────────── 掃描單篇文章 ──────────────────────────

export function scanArticle(article) {
  const body = article.body || '';
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const fenceCandidates = [];
  const blockquoteCandidates = [];

  for (const block of extractFences(body)) {
    // 只處理目前標記為 text 或無標記的區塊；已經是 bash/powershell/md/其他明確標記的
    // 不在本次掃描範圍內（任務指定「現有標記已經準確，不用動」）
    if (block.lang !== 'text' && block.lang !== '') continue;
    const context = {
      localContext: getLocalContext(lines, block.startLine),
      articleTitle: article.title || '',
      articleSlug: article.slug || '',
    };
    const classification = classifyText(block.content, context);
    fenceCandidates.push({
      type: 'fence',
      currentTag: block.lang || '（無標記）',
      startLine: block.startLine,
      content: block.content,
      ...classification,
    });
  }

  for (const bq of extractBlockquotes(body)) {
    if (NOTE_MARKER.test(bq.content)) continue; // 說明性引用，前端本來就標 data-no-copy，排除
    const context = {
      localContext: getLocalContext(lines, bq.startLine),
      articleTitle: article.title || '',
      articleSlug: article.slug || '',
    };
    const classification = classifyText(bq.content, context);
    blockquoteCandidates.push({
      type: 'blockquote',
      // 不要在這個字串裡放反引號：renderItem() 會把整個 currentTag 再包一層反引號
      // 顯示成 code span，字串裡如果自己也有反引號，巢狀反引號在 markdown 裡會顯示錯亂
      currentTag: 'blockquote（markdown 引用語法，開頭是 >）',
      startLine: bq.startLine,
      content: bq.content,
      ...classification,
    });
  }

  return { fenceCandidates, blockquoteCandidates };
}

// ────────────────────────── 產出 markdown 報告 ──────────────────────────

function preview(content, limit = 120) {
  const flat = content.replace(/\s+/g, ' ').trim();
  const cut = [...flat].slice(0, limit).join('');
  return cut.length < flat.length ? `${cut}…` : cut;
}

function renderItem(item, index) {
  const lines = [];
  lines.push(`#### ${index}. 第 ${item.startLine} 行附近（${item.type === 'fence' ? 'fence code block' : 'blockquote'}）`);
  lines.push('');
  lines.push(`- 目前標記：\`${item.currentTag}\``);
  lines.push(`- 建議標記：**${item.suggestion === 'UNSURE' ? 'UNSURE（不確定，需人工判斷）' : '`' + item.suggestion + '`'}**`);
  lines.push(`- 信心度：${item.confidence}`);
  lines.push(`- 判斷依據：\`${item.rule}\` — ${item.reason}`);
  lines.push(`- 內容前 120 字：`);
  lines.push(`  > ${preview(item.content).replace(/\n/g, ' ')}`);
  lines.push('');
  return lines.join('\n');
}

function renderReport(results, meta) {
  const lines = [];
  const push = (s = '') => lines.push(s);

  const allItems = results.flatMap((r) =>
    [...r.fenceCandidates, ...r.blockquoteCandidates].map((item) => ({ ...item, slug: r.slug, title: r.title })),
  );
  const decided = allItems.filter((i) => i.suggestion !== 'UNSURE');
  const unsure = allItems.filter((i) => i.suggestion === 'UNSURE');
  // 動態統計每個建議標記出現次數（不寫死鍵名，toolcmd 之後多幾種工具名稱也會自動列出）
  const bySuggestion = {};
  for (const i of decided) bySuggestion[i.suggestion] = (bySuggestion[i.suggestion] || 0) + 1;
  const byCategory = {};
  for (const i of decided) byCategory[i.category] = (byCategory[i.category] || 0) + 1;
  const toolcmdItems = decided.filter((i) => i.category === 'toolcmd');

  push('# Code Fence／Blockquote 分類待確認清單');
  push();
  push(`產生時間：${meta.generatedAt}`);
  push(`資料來源：${meta.source}`);
  push('本報告只讀 Directus CMS，不曾寫入任何資料；本檔案本身之外，沒有修改任何檔案。');
  push();
  push('## 統計摘要');
  push();
  push(`- 掃描文章數：${results.length} 篇`);
  push(`- 待改區塊總數（fence \`text\`/無標記 ＋ 非說明性 blockquote）：${allItems.length}`);
  push(`  - 建議 \`bash\`：${byCategory.bash || 0}`);
  push(`  - 建議 \`prompt\`：${byCategory.prompt || 0}`);
  push(`  - 建議 \`output\`：${byCategory.output || 0}`);
  push(`  - 建議 \`toolcmd\`（AI 工具介面指令）：${toolcmdItems.length}${toolcmdItems.length ? '，其中 ' + Object.entries(bySuggestion).filter(([k]) => TOOL_CONTEXT_MARKERS.some((m) => m.tool === k)).map(([k, v]) => `\`${k}\` ${v} 個`).join('、') : ''}`);
  push(`  - UNSURE（待人工判斷，不硬猜）：${unsure.length}`);
  push();
  push('| 文章 slug | fence 待改 | blockquote 待改 | 其中 UNSURE |');
  push('|---|---|---|---|');
  for (const r of results) {
    const total = r.fenceCandidates.length + r.blockquoteCandidates.length;
    if (total === 0) continue;
    const unsureCount = [...r.fenceCandidates, ...r.blockquoteCandidates].filter((i) => i.suggestion === 'UNSURE').length;
    push(`| ${r.slug} | ${r.fenceCandidates.length} | ${r.blockquoteCandidates.length} | ${unsureCount} |`);
  }
  push();
  const untouched = results.filter((r) => r.fenceCandidates.length + r.blockquoteCandidates.length === 0);
  if (untouched.length) {
    push(`沒有待改區塊的文章：${untouched.map((r) => r.slug).join('、')}`);
    push();
  }

  push('## 分類目標與規則對照');
  push();
  push('| 目標標記 | 內容 |');
  push('|---|---|');
  push('| `bash` / `powershell` | 終端機指令（現有標記已準確，不在本次掃描範圍） |');
  push('| `prompt` | 提示詞——要貼進 AI 對話框的自然語言指示 |');
  push('| `output` | 執行結果、錯誤訊息、版本號字串、純網址 |');
  push('| `toolcmd`（語言標記用工具名，如 `codex`／`claude-code`） | 打在 AI 工具互動介面裡的指令（例如 Codex CLI 的 `/model`），不是系統終端機指令、也不是自然語言提示詞 |');
  push();
  push('規則清單（依判斷順序）：R1 空區塊 → R2 純 URL → R3 純版本字串 → R4 含錯誤關鍵字 → ');
  push('R5 AI 工具介面斜線指令（判斷是哪個工具：區塊正上方文字明確提到工具名稱 → HIGH；退而看全文標題／');
  push('slug 是否唯一指向某工具 → MEDIUM；兩層都對不到唯一工具則 UNSURE，不用猜的湊一個工具名） → ');
  push('R6 已知 CLI 名稱開頭 → R7 以「請」開頭 → ');
  push('R8 中文比例高且含「請」→ R9 中文比例高但沒有「請」（UNSURE） → R10 都不命中（UNSURE）。');
  push('每條規則的完整依據寫在 `tools/scan-code-fences.mjs` 的 `classifyText()` 函式註解裡，');
  push('R5 用到的工具名稱關鍵字清單在同檔案的 `TOOL_CONTEXT_MARKERS`，之後要支援 Gemini CLI、Cursor');
  push('等新工具，在該清單加一筆 `{ tool, pattern }` 即可，不用改判斷邏輯本身。');
  push();

  push('## 依文章分組的待改清單（已排除 UNSURE，UNSURE 集中在最後一節）');
  push();
  for (const r of results) {
    const decidedItems = [...r.fenceCandidates, ...r.blockquoteCandidates].filter((i) => i.suggestion !== 'UNSURE');
    if (!decidedItems.length) continue;
    push(`### ${r.slug}（${r.title}）`);
    push();
    decidedItems.sort((a, b) => a.startLine - b.startLine);
    decidedItems.forEach((item, idx) => push(renderItem(item, idx + 1)));
  }

  push('## UNSURE 集中處理（優先看這裡）');
  push();
  if (!unsure.length) {
    push('沒有 UNSURE 項目。');
    push();
  } else {
    for (const r of results) {
      const unsureItems = [...r.fenceCandidates, ...r.blockquoteCandidates].filter((i) => i.suggestion === 'UNSURE');
      if (!unsureItems.length) continue;
      push(`### ${r.slug}（${r.title}）`);
      push();
      unsureItems.sort((a, b) => a.startLine - b.startLine);
      unsureItems.forEach((item, idx) => push(renderItem(item, idx + 1)));
    }
  }

  return lines.join('\n');
}

// ────────────────────────── 套用建議標記，產生修改後 body ──────────────────────────
//
// 只 replace 決定要套用的區塊（suggestion !== 'UNSURE'，也就是 HIGH/MEDIUM）：
//   - fence：只換開頭 ``` 那一行的語言標記，區塊內容一個字都不動
//   - blockquote：把整段「> ...」轉成對應語言的 fenced code block（拿掉每行開頭的
//     `> ` 前綴，內容文字本身不變）——這是把「同一種東西兩種標法」統一成 fence 的必要
//     轉換，不是額外改動
// UNSURE 的區塊呼叫端已經先篩掉，不會出現在這裡，所以不會被誤套用。
// 由後往前套用（依起始行號遞減排序），前面區塊的行號才不會被後面區塊的行數變化影響。
function applyDecidedPatches(body, fenceCandidates, blockquoteCandidates) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const patches = [];

  for (const item of fenceCandidates) {
    if (item.suggestion === 'UNSURE') continue;
    const startIdx = item.startLine - 1;
    patches.push({ startIdx, endIdx: startIdx, newLines: ['```' + item.suggestion] });
  }
  for (const item of blockquoteCandidates) {
    if (item.suggestion === 'UNSURE') continue;
    const startIdx = item.startLine - 1;
    const spanLines = item.content.split('\n').length;
    const endIdx = startIdx + spanLines - 1;
    patches.push({
      startIdx,
      endIdx,
      newLines: ['```' + item.suggestion, ...item.content.split('\n'), '```'],
    });
  }

  patches.sort((a, b) => b.startIdx - a.startIdx);
  for (const p of patches) {
    lines.splice(p.startIdx, p.endIdx - p.startIdx + 1, ...p.newLines);
  }
  return lines.join('\n');
}

// ────────────────────────── 產出修改提案（人工確認後才套用，本腳本不寫入 CMS） ──────────────────────────

function beforeTag(item) {
  if (item.type === 'fence') {
    return '```' + (item.currentTag === '（無標記）' ? '' : item.currentTag);
  }
  return 'blockquote（`>`）';
}

function afterTag(item) {
  return '```' + item.suggestion;
}

function renderPatchItem(item, index) {
  const lines = [];
  lines.push(`##### ${index}. 第 ${item.startLine} 行附近（${item.type === 'fence' ? 'fence code block' : 'blockquote'}）`);
  lines.push('');
  // 注意：beforeTag()／afterTag() 回傳的字串本身就含三個反引號的 fence 標記
  // （例如 ```text），不要再包一層單反引號 inline code——巢狀反引號長度不同，
  // CommonMark 配對不到會直接顯示成一串裸反引號，而不是漂亮的 code span。
  lines.push(`- 改動前：${beforeTag(item)}`);
  lines.push(
    `- 改動後：${afterTag(item)}${item.type === 'blockquote' ? '（blockquote 轉成 fence：拿掉每行開頭的 `> ` 前綴，內容文字不變）' : ''}`,
  );
  lines.push(`- 信心度：**${item.confidence}**`);
  lines.push(`- 判斷依據：\`${item.rule}\` — ${item.reason}`);
  lines.push(`- 內容前 120 字：`);
  lines.push(`  > ${preview(item.content).replace(/\n/g, ' ')}`);
  lines.push('');
  return lines.join('\n');
}

function renderUnsureItem(item, index) {
  const lines = [];
  lines.push(`##### ${index}. 第 ${item.startLine} 行附近（${item.type === 'fence' ? 'fence code block' : 'blockquote'}）—— 維持原樣不動`);
  lines.push('');
  lines.push(`- 目前標記：\`${item.currentTag}\`（不變）`);
  lines.push(`- 沒有改的原因：\`${item.rule}\` — ${item.reason}`);
  lines.push(`- 內容前 120 字：`);
  lines.push(`  > ${preview(item.content).replace(/\n/g, ' ')}`);
  lines.push('');
  return lines.join('\n');
}

function renderPatchProposal(results, meta) {
  const lines = [];
  const push = (s = '') => lines.push(s);

  const withCandidates = results.filter((r) => r.fenceCandidates.length + r.blockquoteCandidates.length > 0);
  const allItems = withCandidates.flatMap((r) => [...r.fenceCandidates, ...r.blockquoteCandidates]);
  const decided = allItems.filter((i) => i.suggestion !== 'UNSURE');
  const unsure = allItems.filter((i) => i.suggestion === 'UNSURE');
  const highCount = decided.filter((i) => i.confidence === 'HIGH').length;
  const mediumCount = decided.filter((i) => i.confidence === 'MEDIUM').length;

  push('# Code Fence／Blockquote 修改提案（人工確認後才套用）');
  push();
  push(`產生時間：${meta.generatedAt}`);
  push(`資料來源：${meta.source}`);
  push('本提案只讀 Directus CMS 產生，**沒有寫入或修改任何 CMS 內容，也沒有送出 Authorization header**。');
  push('每篇文章下方附上「修改後完整 body」，供人工逐條核對判斷依據後，自行整段複製貼回 Directus CMS 後台存檔——本腳本本身不會、也不能自動送出。');
  push();
  push('## 使用方式');
  push();
  push('1. 看下面「建議套用的區塊」，逐條核對判斷依據是否合理。');
  push('2. 核對通過後，把該篇「修改後完整 body」整段複製，貼回 Directus CMS 後台該篇文章的 body 欄位並存檔。');
  push('3. 「維持原樣不動」清單裡的區塊全部沒有改——這是分類規則判斷不出唯一結果，不是信心不足硬湊；如果人工看過想要另外處理，要自己決定新標記後手動修改，不在本提案範圍內。');
  push();
  push('## 全站統計');
  push();
  push(`- 掃描到候選區塊的文章：${withCandidates.length} 篇`);
  push(`- 建議套用（HIGH + MEDIUM）：${decided.length} 個`);
  push(`  - HIGH：${highCount}`);
  push(`  - MEDIUM：${mediumCount}`);
  push(`- 維持原樣（UNSURE，本提案沒有改）：${unsure.length} 個`);
  push();
  push('| 文章 slug | 建議套用 | 維持原樣（UNSURE） |');
  push('|---|---|---|');
  for (const r of withCandidates) {
    const items = [...r.fenceCandidates, ...r.blockquoteCandidates];
    const d = items.filter((i) => i.suggestion !== 'UNSURE').length;
    const u = items.filter((i) => i.suggestion === 'UNSURE').length;
    push(`| ${r.slug} | ${d} | ${u} |`);
  }
  push();

  push('## 依文章分組');
  push();
  for (const r of withCandidates) {
    const items = [...r.fenceCandidates, ...r.blockquoteCandidates];
    const decidedItems = items.filter((i) => i.suggestion !== 'UNSURE').sort((a, b) => a.startLine - b.startLine);
    const unsureItems = items.filter((i) => i.suggestion === 'UNSURE').sort((a, b) => a.startLine - b.startLine);
    const dHigh = decidedItems.filter((i) => i.confidence === 'HIGH').length;
    const dMed = decidedItems.filter((i) => i.confidence === 'MEDIUM').length;

    push(`### ${r.slug}（${r.title}）`);
    push();
    push(`建議套用 ${decidedItems.length} 個（HIGH ${dHigh}／MEDIUM ${dMed}）；維持原樣 ${unsureItems.length} 個。`);
    push();

    if (decidedItems.length) {
      push('#### 建議套用的區塊');
      push();
      decidedItems.forEach((item, idx) => push(renderPatchItem(item, idx + 1)));
    }

    if (unsureItems.length) {
      push('#### 維持原樣不動（這幾個沒有改，請你自己看）');
      push();
      unsureItems.forEach((item, idx) => push(renderUnsureItem(item, idx + 1)));
    }

    if (decidedItems.length) {
      const patchedBody = applyDecidedPatches(r.body, r.fenceCandidates, r.blockquoteCandidates);
      push('#### 修改後完整 body（可直接整段複製貼回 CMS；UNSURE 區塊維持原樣）');
      push();
      // 用四個反引號當外層 fence：patchedBody 內部本身含有三個反引號的 fence
      // （```prompt、```output……），CommonMark 的收尾 fence 至少要跟開頭一樣長，
      // 用三個反引號包會被內部的三反引號提早截斷，所以外層要多一個。
      push('````markdown');
      push(patchedBody);
      push('````');
      push();
    } else {
      push('本篇沒有建議套用的改動（候選區塊全部是 UNSURE），body 維持原樣，不附修改後版本。');
      push();
    }
  }

  push('## UNSURE 總覽（這幾個我沒有改，請你自己看）');
  push();
  if (!unsure.length) {
    push('沒有 UNSURE 項目。');
    push();
  } else {
    push(`共 ${unsure.length} 個區塊維持原標記不動：`);
    push();
    for (const r of withCandidates) {
      const unsureItems = [...r.fenceCandidates, ...r.blockquoteCandidates]
        .filter((i) => i.suggestion === 'UNSURE')
        .sort((a, b) => a.startLine - b.startLine);
      if (!unsureItems.length) continue;
      push(`- **${r.slug}**（${r.title}）：${unsureItems.map((i) => `第 ${i.startLine} 行（\`${i.rule}\`）`).join('、')}`);
    }
    push();
  }

  return lines.join('\n');
}

// ────────────────────────── 入口 ──────────────────────────

async function main() {
  const articles = await fetchArticles();
  if (!articles.length) {
    throw new Error('CMS 沒有回傳任何 published 文章，無法掃描。');
  }

  const results = articles
    .map((a) => {
      const { fenceCandidates, blockquoteCandidates } = scanArticle(a);
      // 保留原始 body（未修改，僅正規化換行）給修改提案用來套用 patch、產生「修改後完整
      // body」；審計報告本身不需要，但放在 results 裡不影響審計報告的輸出內容
      const body = (a.body || '').replace(/\r\n/g, '\n');
      return { slug: a.slug, title: a.title, id: a.id, body, fenceCandidates, blockquoteCandidates };
    })
    // slug 排序，讓報告每次重跑順序一致
    .sort((a, b) => a.slug.localeCompare(b.slug));

  const meta = {
    generatedAt: new Date().toISOString(),
    source: `Directus CMS（${CMS}），公開讀取，只含 status=published，共 ${articles.length} 篇`,
  };

  const report = renderReport(results, meta);
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, report, 'utf8');

  const proposal = renderPatchProposal(results, meta);
  fs.mkdirSync(path.dirname(PATCH_PROPOSAL_PATH), { recursive: true });
  fs.writeFileSync(PATCH_PROPOSAL_PATH, proposal, 'utf8');

  const allItems = results.flatMap((r) => [...r.fenceCandidates, ...r.blockquoteCandidates]);
  const unsureCount = allItems.filter((i) => i.suggestion === 'UNSURE').length;
  const decidedCount = allItems.length - unsureCount;
  console.log(`掃描完成：${articles.length} 篇文章，${allItems.length} 個待改區塊，其中 ${unsureCount} 個 UNSURE。`);
  console.log(`審計報告已寫入：${OUT_PATH}`);
  console.log(`修改提案已寫入：${PATCH_PROPOSAL_PATH}（建議套用 ${decidedCount} 個，全部待人工確認後手動套用，本腳本沒有寫入 CMS）`);
}

// 只有直接執行才跑；被其他腳本 import 時不自動掃描
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((err) => {
    console.error(`掃描失敗：${err.message}`);
    process.exit(1);
  });
}
