import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

// 全站預設 og 圖。版型比照 generate-page-banners.mjs（2026-07 定案，2026-08 拿掉裝飾底圖）：
// 無卡片；主標一句話大字（依長度自動縮放）、副標小字酒紅條；
// 徽章、主標、副標、講師臉部、講師卡集中於中央 4:3 安全區（x=180–1020）；
// 人物固定 x=585 y=-65 w=700、講師卡固定 x=800 y=296。
// 純 --color-paper 底，字型 satori 內嵌 Noto Sans TC（不依賴系統字型）。
// 輸出走 Astro 資產雜湊網址，內容變更即自動失效社群快取，不需版本號。
const WIDTH = 1200;
const HEIGHT = 630;
const FONT_PATH = path.resolve('tools/fonts/NotoSansTC-Bold.otf');
const FONT_URL =
  'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf';

const PAPER = '#f7f5f1';
const ACCENT = '#7a2e3b';
const TITLE_ACCENT = '#5c1f2a';

async function exists(p) {
  return stat(p).then(() => true).catch(() => false);
}

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

const page = {
  badge: '官方網站',
  title: 'AI 新手教學',
  subtitle: '把複雜工作流程，簡化成對話',
};

function units(text) {
  return [...text].reduce((w, ch) => {
    if (ch === ' ') return w + 0.3;
    return w + (/[⺀-鿿豈-﫿＀-￯]/.test(ch) ? 1 : 0.55);
  }, 0);
}

const TITLE_MAX_WIDTH = 525;
const badgeText = `新手學 AI｜${page.badge}`;
const titleSize = Math.min(84, Math.floor(TITLE_MAX_WIDTH / units(page.title)));

function buildLayer() {
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
              height: HEIGHT,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              gap: 26,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', alignItems: 'center', gap: 20 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          backgroundColor: '#ffffff',
                          border: `3px solid ${ACCENT}`,
                          borderRadius: 3,
                          padding: '12px 26px',
                          fontSize: 28,
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
                          width: 68,
                          height: 68,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#ffffff',
                          border: `3px solid ${ACCENT}`,
                          borderRadius: 3,
                          fontSize: 36,
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
                    padding: '13px 24px',
                    fontSize: 24,
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

const fontData = await loadFont();

const background = await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 3, background: PAPER },
}).png().toBuffer();

const instructor = await sharp(
  fileURLToPath(new URL('../src/assets/blog-banner/instructor-transparent.png', import.meta.url)),
)
  .resize({ height: 700 })
  .extract({ left: 0, top: 65, width: 615, height: 630 })
  .toBuffer();

const svg = await satori(buildLayer(), {
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
  .toFile(fileURLToPath(new URL('../src/assets/banner-v2.png', import.meta.url)));

console.log('Generated src/assets/banner-v2.png (1200×630)');
