import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import satori from 'satori';
import sharp from 'sharp';

// 自動生成文章橫幅「草稿」：遵循 docs/blog-banner-workflow.md 的鎖定版型（無卡片、安全區集中），
// 底圖 + 程式排版文字 + 人物去背原圖合成，輸出 public/images/blog/<slug>.png，
// 之後由人工修圖定稿（可直接覆蓋同名檔案）。
//
// 用法：
//   npm run generate:banners                # 為所有缺圖的 published 文章生成草稿
//   npm run generate:banners -- --slug xxx  # 指定單篇（已存在時需加 --force）
//   npm run generate:banners -- --out-dir /tmp/preview  # 輸出到別處預覽
//   npm run generate:banners -- --draft-file path/to/draft.md --force
//     # 從本地 Markdown frontmatter 生成尚未進 Directus 的文章橫幅
//
// 文案來源：tools/banner-copy.json 有指定就用指定的（badge/title/subtitle/steps），
// 沒有就從 Directus 欄位推導（badge=第一個 tag、title=文章標題、subtitle=描述句首）。

const DIRECTUS_URL = 'https://cms.aixwang.dev';
const WIDTH = 1200;
const HEIGHT = 630;
const BANNER_DIR = path.resolve('public/images/blog');
const ASSET_DIR = path.resolve('src/assets/blog-banner');
const FONT_PATH = path.resolve('tools/fonts/NotoSansTC-Bold.otf');
const FONT_URL =
  'https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/SubsetOTF/TC/NotoSansTC-Bold.otf';

const PAPER = '#f7f5f1';
const ACCENT = '#7a2e3b';
const TITLE_ACCENT = '#5c1f2a';
const ACCENT_LINE = '#e0c8c6';
const DARK = '#16161a';

const args = process.argv.slice(2);
const getFlag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : (args[i + 1] ?? true);
};
const onlySlug = getFlag('--slug');
const draftFile = getFlag('--draft-file');
const force = args.includes('--force');
const outDir = getFlag('--out-dir') ? path.resolve(getFlag('--out-dir')) : BANNER_DIR;

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

// 沒有 banner-copy.json 指定時，從描述取一句當副標；
// 以排版寬度截斷（約 14 個全形字寬），保證藍底副標只佔一行
function deriveSubtitle(description) {
  if (!description) return '';
  let cut = description.split(/[。！？!?：:，,]/)[0].trim();
  if (measureUnits(cut) <= 14.5) return cut;
  while (cut.length > 0 && measureUnits(cut) > 13.5) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

// 估算文字寬（CJK／全形 1、拉丁字約 0.55），優先排兩行；標題太長就退而求三行大字。
// 標題含 \n（人工指定斷行）時，改成讓最寬的那行單行放得下。
function measureUnits(text) {
  return [...text].reduce(
    (w, ch) => w + (/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(ch) ? 1 : 0.55),
    0,
  );
}

function titleFontSize(title, maxWidth = 660) {
  const manualLines = title.split('\n');
  if (manualLines.length > 1) {
    const widest = Math.max(...manualLines.map(measureUnits));
    for (const size of [84, 76, 68, 60, 54, 48]) {
      if (widest * size <= maxWidth * 0.96) return size;
    }
    return 44;
  }
  const units = measureUnits(title);
  const fits = (size, lines) => units * size <= maxWidth * lines * 0.96;
  for (const size of [84, 76, 68, 60, 54]) if (fits(size, 2)) return size;
  for (const size of [54, 50, 46]) if (fits(size, 3)) return size;
  return 42;
}

function buildLayer(copy, fontData, logos) {
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
        // 左欄（垂直置中）：徽章列 → 主標（2~3 行自動縮放）→ 小副標；
        // 全部集中於中央 4:3 安全區（x=180 起，寬 510，止於人物可見左緣前）
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 180,
              top: 0,
              width: 510,
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
                  style: { display: 'flex', alignItems: 'center', gap: 18 },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          backgroundColor: '#ffffff',
                          border: `3px solid ${ACCENT}`,
                          borderRadius: 3,
                          padding: '10px 28px',
                          fontSize: 28,
                          color: ACCENT,
                        },
                        children: `新手學 AI｜${copy.badge}`,
                      },
                    },
                    copy.platform
                      ? {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              backgroundColor: '#ffffff',
                              border: `2px solid ${ACCENT_LINE}`,
                              borderRadius: 3,
                              padding: '8px 18px',
                              fontSize: 30,
                              color: TITLE_ACCENT,
                            },
                            children: copy.platform,
                          },
                        }
                      : null,
                  ].filter(Boolean),
                },
              },
              copy.logos?.length
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      },
                      children: copy.logos.map((logo) => ({
                        type: 'div',
                        props: {
                          style: {
                            width: 54,
                            height: 54,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#ffffff',
                            border: `2px solid ${ACCENT_LINE}`,
                            borderRadius: 3,
                          },
                          children:
                            logo === 'windows'
                              ? {
                                  type: 'div',
                                  props: {
                                    style: {
                                      width: 34,
                                      height: 34,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 3,
                                    },
                                    children: [0, 1].map(() => ({
                                      type: 'div',
                                      props: {
                                        style: { display: 'flex', gap: 3, flex: 1 },
                                        children: [0, 1].map(() => ({
                                          type: 'div',
                                          props: {
                                            style: {
                                              display: 'flex',
                                              flex: 1,
                                              backgroundColor: '#0078d4',
                                            },
                                          },
                                        })),
                                      },
                                    })),
                                  },
                                }
                              : {
                                  type: 'img',
                                  props: {
                                    src: logos[logo],
                                    width: 38,
                                    height: 38,
                                    style: { objectFit: 'contain' },
                                  },
                                },
                        },
                      })),
                    },
                  }
                : null,
              // 主標題：spec 可用 \n 指定斷行；字級自動縮放（優先兩行、最長三行）
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                    width: 510,
                    fontSize: titleFontSize(copy.title, 510),
                    lineHeight: 1.22,
                    color: TITLE_ACCENT,
                  },
                  children: copy.title.split('\n').map((line) => ({
                    type: 'div',
                    props: { style: { display: 'flex' }, children: line },
                  })),
                },
              },
              copy.subtitle
                ? {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        backgroundColor: ACCENT,
                        borderRadius: 3,
                        padding: '10px 24px',
                        fontSize: 26,
                        color: '#ffffff',
                      },
                      children: copy.subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // 講師卡（位置與頁面圖一致；在人物圖層之下）
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              left: 800,
              top: 296,
              display: 'flex',
              backgroundColor: '#ffffff',
              border: `2px solid ${ACCENT_LINE}`,
              borderRadius: 3,
              padding: '12px 26px',
              fontSize: 22,
              color: TITLE_ACCENT,
            },
            children: '講師：Alex',
          },
        },
      ].filter(Boolean),
    },
  };
}

async function generate(article, fontData, background, instructor) {
  const copySpec = specs[article.slug] ?? {};
  const copy = {
    badge: copySpec.badge ?? article.tags?.[0] ?? 'AI 新手',
    title: copySpec.title ?? article.title,
    subtitle: copySpec.subtitle ?? deriveSubtitle(article.description),
    logos: copySpec.logos ?? [],
    platform: copySpec.platform ?? 'AI',
  };

  const svg = await satori(buildLayer(copy, fontData, logoData), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'Noto Sans TC', data: fontData, weight: 700, style: 'normal' }],
  });

  const textLayer = await sharp(Buffer.from(svg)).png().toBuffer();
  const output = path.join(outDir, `${article.slug}.png`);

  await sharp(background)
    .composite([
      { input: instructor, left: 585, top: 0 },
      // 文字層疊在人物之上：講師卡與頁面圖一致浮於胸前，左欄文字區不與人物可見範圍重疊
      { input: textLayer, left: 0, top: 0 },
    ])
    .png()
    .toFile(output);

  console.log(`✓ ${path.relative(process.cwd(), output)}（badge=${copy.badge}）`);
}

// ---- 主流程 ----
const [fontData, specs, vscodeLogo, codexLogo] = await Promise.all([
  loadFont(),
  readFile(path.resolve('tools/banner-copy.json'), 'utf8')
    .then(JSON.parse)
    .catch(() => ({})),
  readFile(path.resolve('src/assets/vscode-logo.png')),
  readFile(path.resolve('src/assets/codex.png')),
]);
const logoData = {
  vscode: `data:image/png;base64,${vscodeLogo.toString('base64')}`,
  codex: `data:image/png;base64,${codexLogo.toString('base64')}`,
};

for (const asset of ['instructor-transparent.png']) {
  if (!(await exists(path.join(ASSET_DIR, asset)))) {
    throw new Error(`缺少素材 src/assets/blog-banner/${asset}（只留本機，見 .gitignore）`);
  }
}

// 2026-08 拿掉裝飾底圖（暖色漸層弧形＋電路板點線紋），改純 --color-paper 底
const background = await sharp({
  create: { width: WIDTH, height: HEIGHT, channels: 3, background: PAPER },
}).png().toBuffer();
// 人物只能等比縮放後直接貼上（防失真），不得重繪
const instructor = await sharp(path.join(ASSET_DIR, 'instructor-transparent.png'))
  .resize({ height: 700 })
  .extract({ left: 0, top: 65, width: 615, height: 630 })
  .toBuffer();

let articles;
if (draftFile) {
  const raw = await readFile(path.resolve(draftFile), 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`本地草稿缺少 YAML frontmatter：${draftFile}`);
  const frontmatter = yaml.load(match[1]);
  if (!frontmatter?.slug || !frontmatter?.title) {
    throw new Error(`本地草稿 frontmatter 必須包含 slug 與 title：${draftFile}`);
  }
  articles = [{
    slug: frontmatter.slug,
    title: frontmatter.title,
    description: frontmatter.description ?? '',
    tags: frontmatter.tags ?? [],
  }];
} else {
  const res = await fetch(
    `${DIRECTUS_URL}/items/articles?filter[status][_eq]=published&limit=-1&fields=slug,title,description,tags`,
  );
  if (!res.ok) throw new Error(`Directus 文章抓取失敗：HTTP ${res.status}`);
  ({ data: articles } = await res.json());
}

if (onlySlug) {
  articles = articles.filter((a) => a.slug === onlySlug);
  if (articles.length === 0) throw new Error(`找不到 published 文章：${onlySlug}`);
}

await mkdir(outDir, { recursive: true });
let generated = 0;
for (const article of articles) {
  const target = path.join(outDir, `${article.slug}.png`);
  if (!force && (await exists(target))) continue;
  await generate(article, fontData, background, instructor);
  generated += 1;
}

console.log(
  generated > 0
    ? `完成：生成 ${generated} 張草稿。請人工檢查／修圖後再 commit，並執行 npm run check:banners。`
    : '所有 published 文章都已有橫幅，未生成任何草稿（指定單篇請用 --slug <slug> --force）。',
);
