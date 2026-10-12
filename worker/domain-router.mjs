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

export default {
  async fetch(request, env, context) {
    const url = new URL(request.url);

    if (removedQuizPaths.has(url.pathname) || url.pathname.startsWith('/quiz/') || url.pathname.startsWith('/services/tool-quiz/')) {
      return Response.redirect(`${SERVICE_ORIGIN}/`, 301);
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
