// blog-ga4-sync：每小時由 Cron Trigger 喚醒，每 3 小時區塊最多實際同步一次 GA4 → Directus。
// 說明、看 log、手動觸發、換金鑰：docs/ga4-views-sync.md「Cloudflare Worker 排程」。

import { SECTION_NAMES, hasSucceededInCurrentBlock, runGa4Sync } from './sync.mjs';

function summarize(result) {
  const { articles, pages, daily, traffic } = result.sections;
  return {
    mode: result.mode,
    ...(articles ? { articles: { updated: articles.updated, decreaseSkipped: articles.decreaseSkipped.length } } : {}),
    ...(pages ? { pages: { rows: pages.rows, created: pages.created, updated: pages.updated, deleted: pages.deleted } } : {}),
    ...(daily ? { daily: { days: daily.days, totalViews: daily.totalViews, dailyViews: daily.dailyViews, content: daily.dailyContentViews } } : {}),
    ...(traffic ? { traffic: { rows: traffic.rows, sessions: traffic.sessions, created: traffic.created, updated: traffic.updated, deleted: traffic.deleted } } : {}),
    usage: result.usage,
  };
}

async function isAuthorized(request, env) {
  if (!env.MANUAL_TRIGGER_TOKEN) return false;
  const given = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const encoder = new TextEncoder();
  const [givenHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(given)),
    crypto.subtle.digest('SHA-256', encoder.encode(env.MANUAL_TRIGGER_TOKEN)),
  ]);
  return crypto.subtle.timingSafeEqual(givenHash, expectedHash);
}

export default {
  async scheduled(controller, env) {
    const now = new Date(controller.scheduledTime);
    try {
      const gate = await hasSucceededInCurrentBlock({ env, now });
      if (gate.skip) {
        console.log(JSON.stringify({ event: 'ga4-sync-skip', reason: '本 3 小時區塊已成功同步', lastSyncedAt: gate.lastSyncedAt }));
        return;
      }
      const result = await runGa4Sync({ env, apply: true, now });
      console.log(JSON.stringify({ event: 'ga4-sync-success', cron: controller.cron, ...summarize(result) }));
    } catch (error) {
      // 不吞錯：console.error 進 Workers Logs，再丟出讓 Cron Events 標成失敗；下一個整點自動重試。
      console.error(JSON.stringify({ event: 'ga4-sync-failure', cron: controller.cron, message: error.message, stack: error.stack }));
      throw error;
    }
  },

  // 手動觸發（需 MANUAL_TRIGGER_TOKEN）：
  //   POST /run            dry-run，不寫 Directus，回傳算出的完整資料供比對
  //   POST /run?apply=1    真的寫入（不受 3 小時閘門限制）
  //   ?only=articles,pages,daily,traffic  只跑指定段落
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/run' || request.method !== 'POST') return new Response('Not found', { status: 404 });
    if (!(await isAuthorized(request, env))) return new Response('Unauthorized', { status: 401 });

    const apply = url.searchParams.get('apply') === '1';
    const only = url.searchParams.get('only');
    const sections = only ? only.split(',').filter((name) => SECTION_NAMES.includes(name)) : SECTION_NAMES;
    try {
      const result = await runGa4Sync({ env, apply, sections });
      const summary = summarize(result);
      console.log(JSON.stringify({ event: apply ? 'ga4-sync-manual-success' : 'ga4-sync-manual-dry-run', ...summary }));
      return Response.json(apply ? summary : result);
    } catch (error) {
      console.error(JSON.stringify({ event: 'ga4-sync-manual-failure', apply, message: error.message, stack: error.stack }));
      return Response.json({ error: error.message }, { status: 500 });
    }
  },
};
