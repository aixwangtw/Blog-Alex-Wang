// 把 2026-07-28 稽核修正後的文章內文推回 Directus CMS
// 用法：DIRECTUS_TOKEN=xxx node tools/push-article-fixes.mjs <修正檔目錄>
// 修正檔命名：body_<文章id>_<slug>.md（例：body_5_from-part-time-to-freelance.md）
import fs from 'node:fs';
import path from 'node:path';

const CMS = 'https://cms.aixwang.dev';
const token = process.env.DIRECTUS_TOKEN;
const dir = process.argv[2];
if (!token || !dir) {
  console.error('用法：DIRECTUS_TOKEN=xxx node tools/push-article-fixes.mjs <修正檔目錄>');
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => /^body_\d+_.+\.md$/.test(f));
for (const f of files) {
  const id = f.match(/^body_(\d+)_/)[1];
  const body = fs.readFileSync(path.join(dir, f), 'utf8');
  const res = await fetch(`${CMS}/items/articles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ body }),
  });
  console.log(`${f} → HTTP ${res.status}${res.ok ? '' : '：' + (await res.text()).slice(0, 200)}`);
}
console.log('完成。記得觸發網站重新建置（Cloudflare 部署）內容才會更新。');
