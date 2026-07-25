import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// 只抓 published：草稿一律不建成頁面（草稿請放本地 .md，不進文章集合）
const directusResponse = await fetch(
  'https://cms.aixwang.dev/items/articles?filter[status][_eq]=published&limit=-1&fields=slug,updated_date,pub_date',
);
if (!directusResponse.ok) throw new Error(`Directus Sitemap 日期抓取失敗：HTTP ${directusResponse.status}`);
const { data: directusArticles } = await directusResponse.json();
const blogLastModified = new Map(
  directusArticles.map((article) => [
    `/blog/${article.slug}/`,
    article.updated_date ?? article.pub_date,
  ]),
);

export default defineConfig({
  site: 'https://aixwang.dev',
  redirects: {
    '/blog/meta-api-application/': '/blog/threads-api-tutorial/',
  },
  // 預設全站仍是靜態預渲染；adapter 讓之後的 API 路由（如 /api/chat）能跑在 Cloudflare Workers
  adapter: cloudflare(),
  integrations: [
    sitemap({
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = blogLastModified.get(pathname);

        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
