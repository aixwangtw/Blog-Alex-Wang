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
