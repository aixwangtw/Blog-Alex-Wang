import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

// 2026-08 改版：拿掉裝飾底圖（暖色漸層弧形＋電路板點線紋），改純 --color-paper 底。
// 版面靠字級對比與留白撐，不靠裝飾元素；字型統一用 satori 內嵌 Noto Sans TC
// （不依賴系統字型，CI／無中文字型的機器也能正確產圖）。
const WIDTH = 1200;
const HEIGHT = 630;
const FONT_PATH = path.resolve('tools/fonts/NotoSansTC-Bold.otf');
const FONT_URL =
  'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf';

// 色票取自 src/styles/global.css 的 @theme（不得手動猜色碼）
const PAPER = '#f7f5f1';
const ACCENT = '#7a2e3b';
const TITLE_ACCENT = '#5c1f2a';

async function exists(p) {
  return stat(p).then(() => true).catch(() => false);
}

// 字型只在本機生成時需要，缺檔時自動下載（約 5.6MB，不進 git）
async function loadFont() {
  if (!(await exists(FONT_PATH))) {
    console.log('下載 Noto Sans TC Bold 字型…');
    const res = await fetch(FONT_URL);
    if (!res.ok) throw new Error(`字型下載失敗：HTTP ${res.status}`);
    await mkdir(path.dirname(FONT_PATH), { recursive: true });
    await writeFile(FONT_PATH, Buffer.from(await res.arrayBuffer()));
  }
  return readFile(FONT_PATH);
}

// 版型（2026-07 定案，v5 起左半文字等比放大 1.25 倍——脆等平台縮圖上原尺寸太小；
// 2026-08 拿掉裝飾底圖，改純紙底）：
// 無卡片；主標一句話大字（依長度自動縮放）、副標小字酒紅條；
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
  {
    file: 'resources',
    badge: '免費資源',
    title: '免費資源',
    subtitle: '免費的 AI 學習資源',
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

function buildLayer(page) {
  const badgeText = `新手學 AI｜${page.badge}`;
  const titleSize = Math.min(105, Math.floor(TITLE_MAX_WIDTH / units(page.title)));

  return {
    type: 'div',
    props: {
      style: {
        width: WIDTH,
        height: HEIGHT,
        display: 'flex',
        position: 'relative',
        fontFamily: 'Noto Sans TC',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 180,
              top: 0,
              // 不設寬度：交給各子元素自己的內容決定（badge／標題／副標長度不一，
              // 曾經設固定寬度 510 會讓 satori 把超寬的內容強制換行，見下方 TITLE_MAX_WIDTH
              // 與 units() 已經各自把最長文案控制在安全區內，不需要容器再夾一層）。
              height: HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 32,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 24 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          backgroundColor: '#ffffff',
                          border: `3px solid ${ACCENT}`,
                          borderRadius: 3,
                          padding: '16px 32px',
                          fontSize: 35,
                          color: ACCENT,
                        },
                        children: badgeText,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: 85,
                          height: 85,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffffff',
                          border: `3px solid ${ACCENT}`,
                          borderRadius: 3,
                          fontSize: 45,
                          color: ACCENT,
                        },
                        children: 'AI',
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: { display: 'flex', fontSize: titleSize, color: TITLE_ACCENT },
                  children: page.title,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    backgroundColor: ACCENT,
                    borderRadius: 3,
                    padding: '16px 28px',
                    fontSize: 30,
                    color: '#ffffff',
                  },
                  children: page.subtitle,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 800,
              top: 296,
              display: 'flex',
              backgroundColor: '#ffffff',
              border: `3px solid ${ACCENT}`,
              borderRadius: 3,
              padding: '14px 24px',
              fontSize: 21,
              color: ACCENT,
            },
            children: '講師：Alex',
          },
        },
      ],
    },
  };
}

const { pages: VERSION } = JSON.parse(
  await readFile(new URL('../src/data/banner-version.json', import.meta.url), 'utf8'),
);
const outputDir = fileURLToPath(new URL('../public/images/pages/', import.meta.url));
await mkdir(outputDir, { recursive: true });

const fontData = await loadFont();

const background = await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 3, background: PAPER },
}).png().toBuffer();

// 人物只能等比縮放後直接貼上（防失真），不得重繪；裁切等效於原本 SVG
// <image x=585 y=-65 w=700 h=700/> 被畫布邊界自動裁掉的可見範圍。
const instructor = await sharp(
  fileURLToPath(new URL('../src/assets/blog-banner/instructor-transparent.png', import.meta.url)),
)
  .resize({ height: 700 })
  .extract({ left: 0, top: 65, width: 615, height: 630 })
  .toBuffer();

// 檔名帶版本（-v<N>，N 讀自 src/data/banner-version.json）：改版時把版本號 +1 再重跑，
// 不需要去各平台的偵錯工具手動重新抓取；舊檔保留給已分享的連結。
for (const page of pages) {
  const svg = await satori(buildLayer(page), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'Noto Sans TC', data: fontData, weight: 700, style: 'normal' }],
  });
  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();

  await sharp(background)
    .composite([
      { input: instructor, left: 585, top: 0 },
      { input: textLayer, left: 0, top: 0 },
    ])
    .png()
    .toFile(`${outputDir}/${page.file}-v${VERSION}.png`);
  console.log(`Generated public/images/pages/${page.file}-v${VERSION}.png (1200×630)`);
}
