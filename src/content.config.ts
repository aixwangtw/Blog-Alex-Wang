import { defineCollection, z } from 'astro:content';
import { marked } from 'marked';

// 標題加上錨點 id（保留中文），供文章目錄與搜尋結果「跳至某段」使用
function slugifyHeading(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

// 程式碼區塊四種樣式（見 src/styles/global.css 開頭的設計原則）：
// - 終端機（bash/powershell/sh/shell）：深色、等寬、複製鈕明顯
// - 提示詞（```prompt```）：淺色＋外框、一般字（中文提示詞用等寬字難讀）、複製鈕同樣明顯
// - 輸出（```output```）：無標籤、無框、灰字，不給複製鈕——噪音多，不值得複製
// - AI 工具介面指令（```agent```，別名 ```codex``` ```claude-code```…見 TOOLCMD_LANGS）：
//   跟終端機一樣深色、等寬、複製鈕明顯，但底色與左側色條刻意跟終端機區分。這不是系統終端機
//   指令，讀者（不寫程式、只會跟 AI 對話的人）要先知道「這是打進 AI 工具的對話框，不是系統
//   終端機」，貼錯地方會出錯——例如把 /compact 貼進 bash 只會得到 command not found。標籤
//   不報工具名（一律「對 AI Agent 輸入」）：讀者未必用同一款工具，具體是哪個工具文章上下文
//   本來就會講清楚。
// - 其他語言（md/json/text…）：沿用終端機底色，標籤顯示語言名稱
// 這裡只決定 data-code-kind／data-code-label；實際顏色與版面在 global.css。
const TERMINAL_LANGS = new Set(['bash', 'powershell', 'sh', 'shell']);
const LANG_LABELS: Record<string, string> = {
  json: 'JSON',
  jsonc: 'JSONC',
  md: 'Markdown',
  markdown: 'Markdown',
  text: '文字',
  txt: '文字',
  yaml: 'YAML',
  yml: 'YAML',
  js: 'JavaScript',
  javascript: 'JavaScript',
  ts: 'TypeScript',
  typescript: 'TypeScript',
  python: 'Python',
  py: 'Python',
  html: 'HTML',
  css: 'CSS',
  toml: 'TOML',
  diff: 'Diff',
  ini: 'INI',
};

// AI 工具介面指令（第四類，見上方類別說明）：所有別名共用同一顆標籤，不報工具名——
// 寫作者順手用了具體工具名當 fence 語言（```codex``` ```claude-code```）也不會壞掉，
// 但顯示出來一律是「對 AI Agent 輸入」。之後站主教新工具（例如 gemini-cli、cursor）
// 只要把 fence 語言加進這個 Set 就好，不用改標籤、也不用動下面 code() renderer 的邏輯。
const TOOLCMD_LANGS = new Set(['agent', 'codex', 'claude-code']);
const TOOLCMD_LABEL = '對 AI Agent 輸入';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${slugifyHeading(text)}">${text}</h${depth}>\n`;
    },
    // 引用區塊預設會有「複製」按鈕（提示詞用）；說明性質的引用在 markdown 開頭
    // 加 [!note] 標記，這裡會拿掉標記文字並標成 data-no-copy，前端就不加按鈕
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      const marker = body.match(/^<p>\s*\[!(?:note|備註|說明)\]\s*/i);
      if (marker) return `<blockquote data-no-copy>${body.replace(marker[0], '<p>')}</blockquote>\n`;
      return `<blockquote>${body}</blockquote>\n`;
    },
    code({ text, lang, escaped }) {
      const token = (lang ?? '').match(/\S*/)?.[0] ?? '';
      const key = token.toLowerCase();
      const body = text.replace(/\n$/, '') + '\n';
      const html = escaped ? body : escapeHtml(body);

      if (key === 'output') {
        return `<pre data-code-kind="output"><code>${html}</code></pre>\n`;
      }

      let kind = 'default';
      let label = '';
      if (TERMINAL_LANGS.has(key)) {
        kind = 'terminal';
        label = '終端機';
      } else if (key === 'prompt') {
        kind = 'prompt';
        label = '提示詞';
      } else if (TOOLCMD_LANGS.has(key)) {
        kind = 'toolcmd';
        label = TOOLCMD_LABEL;
      } else if (token) {
        label = LANG_LABELS[key] ?? token.toUpperCase();
      }

      const langClass = token ? ` class="language-${escapeHtml(token)}"` : '';
      const labelAttr = label ? ` data-code-label="${escapeHtml(label)}"` : '';
      return `<pre data-code-kind="${kind}"${labelAttr}><code${langClass}>${html}</code></pre>\n`;
    },
  },
});

// 文章來源：Directus CMS（cms.aixwang.dev）
// 在後台新增/修改文章後，觸發重新建置即可更新網站
const DIRECTUS_URL = 'https://cms.aixwang.dev';

const blog = defineCollection({
  loader: {
    name: 'directus-articles',
    load: async ({ store, parseData, generateDigest }) => {
      const fields = 'id,slug,title,description,body,pub_date,updated_date,tags,faqs,featured';
      // 只抓 published：草稿不收進文章集合、不建成頁面（草稿請放本地 .md 檔）
      const res = await fetch(
        `${DIRECTUS_URL}/items/articles?filter[status][_eq]=published&limit=-1&fields=${fields}`,
      );
      if (!res.ok) throw new Error(`Directus 文章抓取失敗：HTTP ${res.status}`);
      const { data } = (await res.json()) as { data: Record<string, any>[] };

      store.clear();

      for (const a of data) {
        const entry = await parseData({
          id: a.slug,
          data: {
            cmsId: a.id,
            title: a.title,
            description: a.description ?? '',
            pubDate: a.pub_date,
            updatedDate: a.updated_date ?? undefined,
            tags: a.tags ?? [],
            faqs: a.faqs ?? [],
            featured: !!a.featured,
          },
        });
        store.set({
          id: a.slug,
          data: entry,
          rendered: { html: marked.parse(a.body ?? '', { async: false }) },
          digest: generateDigest(a),
        });
      }

    },
  },
  schema: z.object({
    // CMS 流水號：同日文章用它當第二排序鍵（越大越新）
    cmsId: z.number().optional(),
    // 標題直接用「使用者會問 AI 的問題句」
    title: z.string(),
    // 40–80 字直接回答問題：這段就是 AI Overview 最可能抽取的答案
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // 文末 FAQ，會輸出成 FAQPage JSON-LD
    faqs: z
      .array(z.object({ question: z.string(), answer: z.string() }))
      .default([]),
    // 精選文章：部落格列表置頂顯示
    featured: z.boolean().default(false),
    // 不公開文章：僅網址可達，不出現在任何列表與索引
    unlisted: z.boolean().default(false),
  }),
});

export const collections = { blog };
