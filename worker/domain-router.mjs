import astroWorker from '../dist/_worker.js/index.js';

const SERVICE_ORIGIN = 'https://service.aixwang.dev';
const MAIN_HOSTS = new Set(['aixwang.dev', 'www.aixwang.dev']);
const serviceRedirects = new Map([
  ['/course', `${SERVICE_ORIGIN}/course/`],
  ['/course/', `${SERVICE_ORIGIN}/course/`],
  ['/services', `${SERVICE_ORIGIN}/`],
  ['/services/', `${SERVICE_ORIGIN}/`],
  ['/services/speaking', `${SERVICE_ORIGIN}/services/speaking/`],
  ['/services/speaking/', `${SERVICE_ORIGIN}/services/speaking/`],
  ['/services/development', `${SERVICE_ORIGIN}/services/development/`],
  ['/services/development/', `${SERVICE_ORIGIN}/services/development/`],
]);

// 工具測驗已於 2026-10 下架：舊網址一律 301 回服務總覽（兩個網域、有無尾斜線都接）。
const removedQuizPaths = new Set(['/quiz', '/quiz/', '/services/tool-quiz', '/services/tool-quiz/']);

// 給 AI 的 Markdown 版：請求帶 Accept: text/markdown 或 ?mode=agent 時，主要頁面改回傳 .md 檔。
// .md 檔由 src/pages/*.md.ts 預渲染（對照表在 src/lib/agent-docs.ts），這裡只做網址對照。
const MARKDOWN_PAGES = {
  main: new Map([
    ['/', '/index.md'],
    ['/resources', '/resources.md'],
    ['/resources/', '/resources.md'],
  ]),
  service: new Map([
    ['/', '/services.md'],
    ['/course', '/course.md'],
    ['/course/', '/course.md'],
    ['/services/speaking', '/services/speaking.md'],
    ['/services/speaking/', '/services/speaking.md'],
    ['/services/development', '/services/development.md'],
    ['/services/development/', '/services/development.md'],
  ]),
};

function wantsMarkdown(request, url) {
  return url.searchParams.get('mode') === 'agent' || (request.headers.get('Accept') ?? '').includes('text/markdown');
}

async function markdownResponse(request, env, url) {
  const pages = url.hostname === 'service.aixwang.dev' ? MARKDOWN_PAGES.service : MAIN_HOSTS.has(url.hostname) ? MARKDOWN_PAGES.main : null;
  const markdownPath = pages?.get(url.pathname);
  if (!markdownPath) return null;
  const assetUrl = new URL(request.url);
  assetUrl.pathname = markdownPath;
  assetUrl.search = '';
  const asset = await env.ASSETS.fetch(new Request(assetUrl, { headers: request.headers }));
  if (!asset.ok) return null;
  const response = new Response(asset.body, asset);
  response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('Vary', 'Accept');
  return response;
}

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (removedQuizPaths.has(url.pathname) || url.pathname.startsWith('/quiz/') || url.pathname.startsWith('/services/tool-quiz/')) {
      return Response.redirect(`${SERVICE_ORIGIN}/`, 301);
    }

    // sitemap-index.xml／sitemap-0.xml 是主站 Astro 產生的檔案；服務子網域不該回傳主站的網址清單，
    // 一律 301 到服務站自己的 /sitemap.xml。主站則直接取靜態檔。
    if (wantsMarkdown(request, url)) {
      const markdown = await markdownResponse(request, env, url);
      if (markdown) return markdown;
    }

    if (url.pathname === '/sitemap-index.xml' || url.pathname === '/sitemap-0.xml') {
      if (url.hostname === 'service.aixwang.dev') {
        return Response.redirect(`${SERVICE_ORIGIN}/sitemap.xml`, 301);
      }
      return env.ASSETS.fetch(request);
    }

    if (url.hostname === 'service.aixwang.dev') {
      if (url.pathname === '/robots.txt' || url.pathname === '/sitemap.xml') {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = url.pathname === '/robots.txt' ? '/service-robots.txt' : '/service-sitemap.xml';
        return env.ASSETS.fetch(new Request(assetUrl, request));
      }

      // 子網域首頁沿用 build 內的 /services/ 靜態檔，但瀏覽器網址保留在 /。
      if (url.pathname === '/') {
        const assetUrl = new URL(request.url);
        assetUrl.pathname = '/services/';
        return env.ASSETS.fetch(new Request(assetUrl, request));
      }

      // /services/ 只是同一份 build 的內部路徑，正式子網域不暴露它。
      if (url.pathname === '/services' || url.pathname === '/services/') {
        url.pathname = '/';
        return Response.redirect(url.toString(), 308);
      }

      // 課程、演講與系統開發皆已預渲染，直接取得靜態資產，不重複 SSR。
      if (url.pathname.startsWith('/course') || url.pathname.startsWith('/services/speaking') || url.pathname.startsWith('/services/development')) {
        return env.ASSETS.fetch(request);
      }
    }

    if (MAIN_HOSTS.has(url.hostname) && serviceRedirects.has(url.pathname)) {
      const target = new URL(serviceRedirects.get(url.pathname));
      target.search = url.search;
      return Response.redirect(target.toString(), 308);
    }

    return astroWorker.fetch(request, env, context);
  },
};
