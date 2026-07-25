import { access, readFile } from 'node:fs/promises';

// 確認目前版本號的頁面分享圖都已生成，避免升版後忘記重跑生成器就部署（og 圖會 404）
const { pages: VERSION } = JSON.parse(
  await readFile(new URL('../src/data/banner-version.json', import.meta.url), 'utf8'),
);
const names = ['home', 'about', 'blog', 'one-on-one', 'faq'];
const missing = [];

for (const name of names) {
  try {
    await access(new URL(`../public/images/pages/${name}-v${VERSION}.png`, import.meta.url));
  } catch {
    missing.push(`public/images/pages/${name}-v${VERSION}.png`);
  }
}

if (missing.length > 0) {
  console.error(`缺少 v${VERSION} 頁面分享圖（請先執行 node tools/generate-page-banners.mjs）：`);
  for (const file of missing) console.error(`- ${file}`);
  process.exitCode = 1;
} else {
  console.log(`頁面分享圖檢查通過：v${VERSION} 共 ${names.length} 張。`);
}
