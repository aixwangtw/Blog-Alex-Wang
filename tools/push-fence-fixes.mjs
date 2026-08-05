// 把 scan-code-fences.mjs 判定的 fence 標記改動推回 Directus CMS。
//
// 只做一件事：把 code fence 的語言標記那一行換掉（例如 ```text → ```prompt）。
//
// 刻意不做的兩件事，理由寫在這裡免得以後有人「順手補上」：
//
// 1. 不處理 blockquote → fence 的轉換。那是結構性改寫（換元素類型、剝掉每行的 `> `
//    前綴），而實測分類器在這裡會誤判：規則 R8 比對的是「請」這個單字，
//    「沒接受邀請就去拿 Token」的「邀請」會命中，把編輯提醒誤判成提示詞。
//    本站的 Meta API 教學整篇都在講「申請」，誤判面很大。
// 2. 不套用 UNSURE。UNSURE 的定義就是分類器沒有結論，硬套等於編造。
//
// 用法：
//   node tools/push-fence-fixes.mjs --dry     只看會改什麼，不連 CMS 寫入
//   node tools/push-fence-fixes.mjs           實際推送（會先備份）
//
// Token 從專案根目錄 .env 的 DIRECTUS_TOKEN 讀（node 不會自動載入 .env）。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchArticles, scanArticle } from './scan-code-fences.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CMS = 'https://cms.aixwang.dev';
const BACKUP_DIR = path.join(ROOT, 'docs', 'code-fence-backup');
const DRY = process.argv.includes('--dry');

function readToken() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) throw new Error(`找不到 ${envPath}`);
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DIRECTUS_TOKEN='));
  const token = line?.slice('DIRECTUS_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
  if (!token) throw new Error('.env 裡的 DIRECTUS_TOKEN 是空的');
  return token;
}

// 只換 fence 的語言標記那一行，其餘一個字都不動
function applyFencePatches(body, fenceCandidates) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const changes = [];
  for (const item of fenceCandidates) {
    if (item.suggestion === 'UNSURE') continue;
    const idx = item.startLine - 1;
    const before = lines[idx];
    if (!/^\s*```/.test(before)) {
      throw new Error(`第 ${item.startLine} 行不是 fence 起始行，實際內容：${JSON.stringify(before)}`);
    }
    const after = '```' + item.suggestion;
    lines[idx] = after;
    changes.push({ line: item.startLine, before, after, rule: item.rule, confidence: item.confidence });
  }
  return { body: lines.join('\n'), changes };
}

async function main() {
  const articles = await fetchArticles();
  if (!articles.length) throw new Error('CMS 沒有回傳任何 published 文章');

  const plans = [];
  for (const a of articles) {
    const { fenceCandidates, blockquoteCandidates } = scanArticle(a);
    const original = (a.body || '').replace(/\r\n/g, '\n');
    const { body, changes } = applyFencePatches(original, fenceCandidates);
    const skippedBq = blockquoteCandidates.filter((i) => i.suggestion !== 'UNSURE').length;
    const skippedUnsure =
      fenceCandidates.filter((i) => i.suggestion === 'UNSURE').length +
      blockquoteCandidates.filter((i) => i.suggestion === 'UNSURE').length;
    if (changes.length) plans.push({ a, original, body, changes, skippedBq, skippedUnsure });
    else if (skippedBq || skippedUnsure)
      console.log(`- ${a.slug}：無 fence 改動（跳過 blockquote ${skippedBq}、UNSURE ${skippedUnsure}）`);
  }

  console.log(`\n預計改動 ${plans.length} 篇、共 ${plans.reduce((n, p) => n + p.changes.length, 0)} 個 fence 標記\n`);
  for (const p of plans) {
    console.log(`### ${p.a.slug}（id=${p.a.id}）跳過 blockquote ${p.skippedBq}、UNSURE ${p.skippedUnsure}`);
    for (const c of p.changes) {
      console.log(`   L${String(c.line).padStart(4)}  ${c.before.trim()}  →  ${c.after}   [${c.confidence} ${c.rule}]`);
    }
    // 保險：正文長度只能因為標記字數改變而變動，不能有整段增刪
    const delta = p.body.length - p.original.length;
    const expected = p.changes.reduce((n, c) => n + (c.after.length - c.before.length), 0);
    if (delta !== expected) throw new Error(`${p.a.slug} 長度變化 ${delta} 不等於預期 ${expected}，中止`);
    console.log(`   ✓ 長度變化 ${delta} 符合預期，正文其餘部分未動\n`);
  }

  if (DRY) {
    console.log('（--dry：沒有連線寫入 CMS）');
    return;
  }

  const token = readToken();
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const manifest = [];
  for (const p of plans) {
    const f = path.join(BACKUP_DIR, `${p.a.slug}.md`);
    fs.writeFileSync(f, p.original, 'utf8');
    const size = fs.statSync(f).size;
    if (!size) throw new Error(`備份 ${f} 是空的，中止推送`);
    manifest.push({ id: p.a.id, slug: p.a.slug, bytes: size, fetchedAt: new Date().toISOString() });
    console.log(`備份 ${p.a.slug} → ${f}（${size} bytes）`);
  }
  fs.writeFileSync(path.join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\n備份完成，共 ${manifest.length} 篇。開始推送。\n`);

  for (const p of plans) {
    const res = await fetch(`${CMS}/items/articles/${p.a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: p.body }),
    });
    if (!res.ok) throw new Error(`${p.a.slug} 推送失敗 HTTP ${res.status}：${await res.text()}`);

    // 立刻讀回來逐字比對；對不上就停，不繼續推剩下的
    const check = await fetch(`${CMS}/items/articles/${p.a.id}?fields=body`);
    if (!check.ok) throw new Error(`${p.a.slug} 讀回失敗 HTTP ${check.status}`);
    const got = ((await check.json()).data.body || '').replace(/\r\n/g, '\n');
    if (got !== p.body) throw new Error(`${p.a.slug} 讀回內容與送出內容不一致，已停止，不再推送剩餘文章`);
    console.log(`✓ ${p.a.slug}：${p.changes.length} 個標記，已寫入並讀回比對一致`);
  }
  console.log(`\n全部完成。還原方式：把 ${BACKUP_DIR}/<slug>.md 的內容推回對應 id 的 body 欄位。`);
}

main().catch((err) => {
  console.error(`\n失敗：${err.message}`);
  process.exit(1);
});
