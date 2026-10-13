import { execFileSync } from 'node:child_process';
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

// 非文章頁的 lastmod：取該頁原始檔與共用資料（consts、faqs、instructor）最後一次 git 提交日期。
// 取不到 git（例如淺層複製沒有歷史）就退回建置當天。
const PAGE_SOURCES = {
  '/': ['src/pages/index.astro'],
  '/about/': ['src/pages/about.astro', 'src/data/instructor.ts'],
  '/blog/': ['src/pages/blog/index.astro'],
  '/faq/': ['src/pages/faq.astro', 'src/data/faqs.ts'],
  '/resources/': ['src/pages/resources.astro'],
  '/disclaimer/': ['src/pages/disclaimer.astro'],
  '/editorial-policy/': ['src/pages/editorial-policy.astro'],
  '/privacy/': ['src/pages/privacy.astro'],
};
const SHARED_SOURCES = ['src/consts.ts'];
const buildDate = new Date().toISOString().slice(0, 10);
function pageLastModified(pathname) {
  const sources = PAGE_SOURCES[pathname];
  if (!sources) return undefined;
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...sources, ...SHARED_SOURCES], {
      encoding: 'utf8',
    }).trim();
    return date || buildDate;
  } catch {
    return buildDate;
  }
}

export default defineConfig({
  site: 'https://aixwang.dev',
  // 舊網址轉址統一寫在 public/_redirects，不要用 Astro 的 redirects 設定：
  // Astro 產出 _redirects 時會把 key 的尾斜線去掉（有斜線、無斜線兩種都寫也只會產生重複的同一條），
  // 導致含尾斜線的網址打不到轉址、直接 404，而本站連結的正規形式就是含尾斜線。
  // 預設全站仍是靜態預渲染；adapter 讓之後的 API 路由（如 /api/chat）能跑在 Cloudflare Workers
  adapter: cloudflare(),
  integrations: [
    sitemap({
      // 課程、演講與系統開發改由 service.aixwang.dev 的獨立 sitemap 索引，
      // 主站 sitemap 不再列重複路徑（/services/development/ 在主站會 308 轉到服務站）。
      // /_preview/ 是設計原型，不列入。
      filter(page) {
        const pathname = new URL(page).pathname;
        return (
          !['/course/', '/services/', '/services/speaking/', '/services/development/'].includes(pathname) &&
          !pathname.startsWith('/_preview/')
        );
      },
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const lastmod = blogLastModified.get(pathname) ?? pageLastModified(pathname);

        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
