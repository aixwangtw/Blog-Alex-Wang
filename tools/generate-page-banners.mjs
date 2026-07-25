import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const background = (
  await readFile(new URL('../src/assets/blog-banner/background.png', import.meta.url))
).toString('base64');
const instructor = (
  await readFile(new URL('../src/assets/blog-banner/instructor-transparent.png', import.meta.url))
).toString('base64');

// 版型（2026-07 定案，v5 起左半文字等比放大 1.25 倍——脆等平台縮圖上原尺寸太小）：
// 無卡片；主標一句話大字（依長度自動縮放）、副標小字藍條；
// 徽章、主標、副標、講師臉部、講師卡集中於中央 4:3 安全區（x=180–1020）；
// 人物固定 x=585 y=-65 w=700、講師卡固定 x=800 y=296，不再調整。
const pages = [
  {
    file: 'home',
    badge: '官方網站',
    title: 'AI 新手教學',
    subtitle: '把複雜工作流程，簡化成對話',
  },
  {
    file: 'about',
    badge: '講師介紹',
    title: '關於 AI 講師',
    subtitle: 'Alex Wang｜從 AI 自學到全職接案',
  },
  {
    file: 'blog',
    badge: '文章總覽',
    title: 'AI 新手部落格',
    subtitle: '每篇文章，解決一個真實問題',
  },
  {
    file: 'one-on-one',
    badge: '教學服務',
    title: 'AI 一對一私人教學',
    subtitle: '在你的電腦上，手把手做成功',
  },
  {
    file: 'faq',
    badge: '問題總整理',
    title: '常見問題總整理',
    subtitle: '從真實社群提問找到答案',
  },
];

// 文字寬度估算：CJK／全形 1、空白 0.3、拉丁字 0.55
function units(text) {
  return [...text].reduce((w, ch) => {
    if (ch === ' ') return w + 0.3;
    return w + (/[⺀-鿿豈-﫿＀-￯]/.test(ch) ? 1 : 0.55);
  }, 0);
}

// 主標可用寬度：x=180 起到人物可見左緣（約 x=705）
const TITLE_MAX_WIDTH = 525;

function renderBanner(page) {
  const badgeText = `新手學 AI｜${page.badge}`;
  const badgeWidth = Math.round(60 + units(badgeText) * 35);
  // 字級上限 84→105（×1.25）；過長的主標仍以 TITLE_MAX_WIDTH 自動縮小，不會撞到人物
  const titleSize = Math.min(105, Math.floor(TITLE_MAX_WIDTH / units(page.title)));
  const subtitleWidth = Math.round(60 + units(page.subtitle) * 30);
  return `
  <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <image href="data:image/png;base64,${background}" width="1200" height="630"/>
    <g font-family="'WenQuanYi Zen Hei', sans-serif" font-weight="700">
      <rect x="180" y="140" width="${badgeWidth}" height="78" rx="20" fill="#fff" fill-opacity=".94" stroke="#1657c8" stroke-width="3"/>
      <text x="210" y="193" fill="#1657c8" font-size="35">${badgeText}</text>
      <rect x="${180 + badgeWidth + 24}" y="136" width="85" height="85" rx="20" fill="#fff" fill-opacity=".95" stroke="#1657c8" stroke-width="3"/>
      <text x="${180 + badgeWidth + 24 + 43}" y="196" fill="#1657c8" font-size="45" text-anchor="middle">AI</text>
      <text x="180" y="345" fill="#1657c8" font-size="${titleSize}">${page.title}</text>
      <rect x="180" y="386" width="${subtitleWidth}" height="62" rx="17" fill="#1657c8"/>
      <text x="210" y="428" fill="#fff" font-size="30">${page.subtitle}</text>
    </g>
    <image href="data:image/png;base64,${instructor}" x="585" y="-65" width="700" height="700"/>
    <g font-family="'WenQuanYi Zen Hei', sans-serif" font-weight="700">
      <rect x="800" y="296" width="150" height="52" rx="16" fill="#fff" fill-opacity=".95" stroke="#1657c8" stroke-width="3"/>
      <text x="875" y="330" fill="#1657c8" font-size="21" text-anchor="middle">講師：Alex</text>
    </g>
  </svg>`;
}

const { pages: VERSION } = JSON.parse(
  await readFile(new URL('../src/data/banner-version.json', import.meta.url), 'utf8'),
);
const outputDir = fileURLToPath(new URL('../public/images/pages/', import.meta.url));
await mkdir(outputDir, { recursive: true });

// 檔名帶版本（-v<N>，N 讀自 src/data/banner-version.json）：改版時把版本號 +1 再重跑，
// 不需要去各平台的偵錯工具手動重新抓取；舊檔保留給已分享的連結。
for (const page of pages) {
  await sharp(Buffer.from(renderBanner(page)))
    .png()
    .toFile(`${outputDir}/${page.file}-v${VERSION}.png`);
  console.log(`Generated public/images/pages/${page.file}-v${VERSION}.png (1200×630)`);
}
