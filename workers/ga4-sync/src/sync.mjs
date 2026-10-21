// GA4 → Directus 同步的 Worker 版。查詢參數與計算邏輯對齊本機四支腳本：
//   tools/sync-ga4-views.mjs、sync-ga4-page-views.mjs、sync-ga4-daily-views.mjs、sync-ga4-traffic-sources.mjs
// 計算直接 import 同一份 tools/lib/*.mjs，確保兩邊算出的數字一致。
// 差異只在 I/O：GA4 改打 REST（https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/properties/runReport），
// Directus 寫入改用批次（PATCH／POST／DELETE 陣列 body），把 subrequest 壓在免費方案 50 次以內。

import aliasMap from '../../../tools/ga4-slug-aliases.json';
import {
  aggregateEngagementBySlug,
  aggregateViewsBySlug,
  buildAvgEngagementSecondsBySlug,
  buildSyncPlan,
  parseGa4ApiRows,
  parseGa4ApiRowsWithEngagement,
  remapSlugAliases,
} from '../../../tools/lib/ga4-views-lib.mjs';
import { buildPageViewRows } from '../../../tools/lib/page-views-lib.mjs';
import {
  buildDailyContentViewRows,
  buildDailyViewRows,
  parseGa4AudienceMetrics,
  parseGa4DailyRows,
  parseGa4DailyUserRows,
  parseGa4DeviceMetrics,
} from '../../../tools/lib/daily-views-lib.mjs';
import { buildTrafficSourceRows, parseGa4SourceRows } from '../../../tools/lib/traffic-sources-lib.mjs';
import { getGoogleAccessToken } from './google-auth.mjs';

const CMS = 'https://cms.aixwang.dev';
const SITE_LAUNCH_DATE = '2026-07-22';
const GA4_EARLIEST_POSSIBLE_DATE = '2015-08-14';
const PAGE_SIZE = 10000;
const BATCH_SIZE = 250;
const HOST_FILTER = {
  filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } },
};

function chunks(items, size = BATCH_SIZE) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

/** 與 tools/sync-ga4-page-views.mjs 的 getRecentStartDate() 相同。 */
function getRecentStartDate(now) {
  const thirtyDaysAfterLaunch = new Date(`${SITE_LAUNCH_DATE}T00:00:00Z`);
  thirtyDaysAfterLaunch.setUTCDate(thirtyDaysAfterLaunch.getUTCDate() + 30);
  return now < thirtyDaysAfterLaunch ? SITE_LAUNCH_DATE : '30daysAgo';
}

/** 包一層 fetch 計算本次 invocation 的 subrequest 數（Cloudflare 對每次執行有上限）。 */
function createCountingFetch() {
  const counter = { count: 0 };
  const countingFetch = (input, init) => {
    counter.count += 1;
    return fetch(input, init);
  };
  return { counter, countingFetch };
}

function createGa4Client({ propertyId, accessToken, fetchImpl, usage }) {
  async function runReport(body) {
    const res = await fetchImpl(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, dimensionFilter: HOST_FILTER, returnPropertyQuota: true }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`GA4 runReport HTTP ${res.status}：${text.slice(0, 300)}`);
    const response = JSON.parse(text);
    usage.ga4Queries += 1;
    const quota = response.propertyQuota?.tokensPerDay;
    if (quota) {
      usage.ga4TokensConsumed += Number(quota.consumed ?? 0);
      usage.ga4TokensRemaining = Number(quota.remaining ?? 0);
    }
    return response;
  }

  /** 與本機腳本相同的 offset 分頁：rowCount 內的資料抓完為止。 */
  async function runPagedReport(body, parse) {
    const rows = [];
    let offset = 0;
    let rowCount = Infinity;
    while (offset < rowCount) {
      // eslint-disable-next-line no-await-in-loop
      const response = await runReport({ ...body, limit: PAGE_SIZE, offset });
      rows.push(...parse(response));
      rowCount = Number(response.rowCount ?? 0);
      offset += PAGE_SIZE;
    }
    return rows;
  }

  return { runReport, runPagedReport };
}

function createDirectusClient({ token, fetchImpl }) {
  return async function directus(path, init = {}) {
    const res = await fetchImpl(`${CMS}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Directus ${init.method ?? 'GET'} ${path.split('?')[0]} HTTP ${res.status}：${text.slice(0, 300)}`);
    return text ? JSON.parse(text).data : null;
  };
}

/**
 * upsert＋清除：existing 依 keyField 對到的走批次 PATCH（帶 id），其餘批次 POST，
 * 不在 rows 裡的舊資料批次 DELETE。Directus 11 的 /items/:collection 接受陣列 body：
 * PATCH → updateBatch、POST → createMany、DELETE → deleteMany
 * （https://github.com/directus/directus/blob/main/api/src/controllers/items.ts）。
 */
async function upsertCollection({ directus, collection, rows, existing, keyField, apply, deleteObsolete = true }) {
  const idByKey = new Map(existing.map((item) => [item[keyField], item.id]));
  const creates = rows.filter((row) => !idByKey.has(row[keyField]));
  const updates = rows.filter((row) => idByKey.has(row[keyField])).map((row) => ({ id: idByKey.get(row[keyField]), ...row }));
  const retained = new Set(rows.map((row) => row[keyField]));
  const deletes = deleteObsolete ? existing.filter((item) => !retained.has(item[keyField])).map((item) => item.id) : [];

  if (apply) {
    for (const batch of chunks(creates)) await directus(`/items/${collection}`, { method: 'POST', body: JSON.stringify(batch) });
    for (const batch of chunks(updates)) await directus(`/items/${collection}`, { method: 'PATCH', body: JSON.stringify(batch) });
    for (const batch of chunks(deletes)) await directus(`/items/${collection}`, { method: 'DELETE', body: JSON.stringify(batch) });
  }
  return { created: creates.length, updated: updates.length, deleted: deletes.length };
}

/**
 * 跑一次完整同步。apply=false 時只查詢與計算、不寫 Directus，回傳算出的資料供比對。
 * 任一段失敗就丟出錯誤（後面幾段不跑），與 tools/daily-ga4-views-cron.sh 的行為一致。
 *
 * @param {{ env: Record<string, string>, apply: boolean, now?: Date }} options
 */
export const SECTION_NAMES = ['articles', 'pages', 'daily', 'traffic'];

export async function runGa4Sync({ env, apply, now = new Date(), sections = SECTION_NAMES }) {
  const wants = new Set(sections);
  for (const name of ['GA4_PROPERTY_ID', 'GA4_SERVICE_ACCOUNT_JSON', 'DIRECTUS_TOKEN']) {
    if (!env[name]) throw new Error(`缺少 Worker secret：${name}`);
  }

  const startedAt = Date.now();
  const usage = { ga4Queries: 0, ga4TokensConsumed: 0, ga4TokensRemaining: null };
  const { counter, countingFetch } = createCountingFetch();
  const accessToken = await getGoogleAccessToken(env.GA4_SERVICE_ACCOUNT_JSON, countingFetch);
  const ga4 = createGa4Client({ propertyId: env.GA4_PROPERTY_ID, accessToken, fetchImpl: countingFetch, usage });
  const directus = createDirectusClient({ token: env.DIRECTUS_TOKEN, fetchImpl: countingFetch });
  const result = { mode: apply ? 'apply' : 'dry-run', sections: {} };

  // ── 共用查詢：文章清單（帶 token 會含草稿，與四支腳本相同）；近 30 天 pagePath 查詢 ──
  const articles = await directus('/items/articles?fields=id,slug,title,status,views&limit=-1');
  const articleTitles = new Map(articles.map((article) => [article.slug, article.title]));
  const pathViews = { dimensions: [{ name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }] };
  const pathEngagement = {
    dimensions: [{ name: 'pagePath' }],
    // parseGa4ApiRowsWithEngagement 依陣列順序取值：[screenPageViews, userEngagementDuration, activeUsers]
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'activeUsers' }],
  };
  const fetchPathEngagement = (startDate) =>
    ga4.runPagedReport({ ...pathEngagement, dateRanges: [{ startDate, endDate: 'today' }] }, parseGa4ApiRowsWithEngagement);
  const needsLast30d = wants.has('articles') || (wants.has('pages') && getRecentStartDate(now) === '30daysAgo');
  const last30dRows = needsLast30d ? await fetchPathEngagement('30daysAgo') : null;

  // ── 1. 文章（tools/sync-ga4-views.mjs，API 模式、預設旗標） ──
  if (wants.has('articles')) {
    const totalRows = await ga4.runPagedReport(
      { ...pathViews, dateRanges: [{ startDate: GA4_EARLIEST_POSSIBLE_DATE, endDate: 'today' }] },
      parseGa4ApiRows,
    );
    const totalBySlug = remapSlugAliases(aggregateViewsBySlug(totalRows).bySlug, aliasMap).bySlug;
    const last30dBySlug = remapSlugAliases(aggregateViewsBySlug(last30dRows).bySlug, aliasMap).bySlug;
    const engagementAgg = aggregateEngagementBySlug(last30dRows);
    const avgEngagementBySlug = buildAvgEngagementSecondsBySlug(
      remapSlugAliases(engagementAgg.durationBySlug, aliasMap).bySlug,
      remapSlugAliases(engagementAgg.usersBySlug, aliasMap).bySlug,
    );
    const currentViewsBySlug = new Map(articles.map((article) => [article.slug, article.views]));
    const { updates, report } = buildSyncPlan({
      articles,
      totalBySlug,
      last30dBySlug,
      avgEngagementBySlug,
      currentViewsBySlug,
      zeroMissingTotal: undefined,
      zeroMissing30d: undefined,
      allowDecrease: false,
    });
    const syncedAt = new Date().toISOString();
    const payloads = updates.map((update) => {
      const payload = { id: update.id, views_synced_at: syncedAt };
      if ('views' in update) payload.views = update.views;
      if ('views_30d' in update) payload.views_30d = update.views_30d;
      if ('avg_engagement_seconds_30d' in update) payload.avg_engagement_seconds_30d = update.avg_engagement_seconds_30d;
      return payload;
    });
    if (apply) {
      for (const batch of chunks(payloads)) await directus('/items/articles', { method: 'PATCH', body: JSON.stringify(batch) });
    }
    result.sections.articles = {
      updated: payloads.length,
      decreaseSkipped: report.views.decreaseSkipped.map((row) => ({ slug: row.slug, current: row.currentValue, next: row.newValue })),
      ...(apply ? {} : { payloads: payloads.map(({ views_synced_at: _ignored, ...rest }) => ({ slug: updates.find((u) => u.id === rest.id)?.slug, ...rest })) }),
    };
  }

  // ── 2. 一般頁面（tools/sync-ga4-page-views.mjs） ──
  if (wants.has('pages')) {
    const recentStart = getRecentStartDate(now);
    const [totalRows, recentRows] = await Promise.all([
      ga4.runPagedReport({ ...pathViews, dateRanges: [{ startDate: SITE_LAUNCH_DATE, endDate: 'today' }] }, parseGa4ApiRows),
      // 近 30 天查詢與文章段完全相同時直接共用，省一次 GA4 查詢。
      recentStart === '30daysAgo' ? Promise.resolve(last30dRows) : fetchPathEngagement(recentStart),
    ]);
    const rows = buildPageViewRows({ totalRows, last30dRows: recentRows, articleTitles, syncedAt: new Date().toISOString() });
    const existing = await directus('/items/page_views?fields=id,path&limit=-1');
    const counts = await upsertCollection({ directus, collection: 'page_views', rows, existing, keyField: 'path', apply });
    result.sections.pages = { rows: rows.length, ...counts, ...(apply ? {} : { rowsData: rows }) };
  }

  // ── 3. 每日流量、逐篇每日明細、置頂數字（tools/sync-ga4-daily-views.mjs） ──
  if (wants.has('daily')) {
    const sinceLaunch = { startDate: SITE_LAUNCH_DATE, endDate: 'today' };
    const [gaRows, userResponse, audienceResponse, deviceResponse] = await Promise.all([
      ga4.runPagedReport(
        {
          dateRanges: [sinceLaunch],
          dimensions: [{ name: 'date' }, { name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'totalUsers' }],
        },
        parseGa4DailyRows,
      ),
      ga4.runReport({
        dateRanges: [sinceLaunch],
        dimensions: [{ name: 'date' }],
        metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }],
        limit: PAGE_SIZE,
      }),
      ga4.runReport({
        dateRanges: [
          { ...sinceLaunch, name: 'since_launch' },
          { startDate: '29daysAgo', endDate: 'today', name: 'last_30_days' },
          { startDate: 'today', endDate: 'today', name: 'today' },
        ],
        metrics: [{ name: 'totalUsers' }, { name: 'activeUsers' }],
      }),
      ga4.runReport({
        dateRanges: [
          { ...sinceLaunch, name: 'since_launch' },
          { startDate: '29daysAgo', endDate: 'today', name: 'last_30_days' },
        ],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'totalUsers' }, { name: 'activeUsers' }],
      }),
    ]);
    const syncedAt = new Date().toISOString();
    const audienceMetrics = { ...parseGa4AudienceMetrics(audienceResponse), ...parseGa4DeviceMetrics(deviceResponse), synced_at: syncedAt };
    const rows = buildDailyViewRows({
      gaRows,
      dailyUserRows: parseGa4DailyUserRows(userResponse),
      articleTitles,
      startDate: SITE_LAUNCH_DATE,
      endDate: syncedAt.slice(0, 10),
      syncedAt,
    });
    const contentRows = buildDailyContentViewRows({ gaRows, articleTitles, syncedAt });

    const [existingDaily, existingContent, audienceExisting] = await Promise.all([
      directus('/items/daily_views?fields=id,date&limit=-1'),
      directus('/items/daily_content_views?fields=id,record_key&limit=-1'),
      directus('/items/audience_metrics?fields=id,key&filter[key][_eq]=site&limit=1'),
    ]);
    // daily_views 本機腳本只 upsert 不刪除，這裡照做。
    const dailyCounts = await upsertCollection({
      directus, collection: 'daily_views', rows, existing: existingDaily, keyField: 'date', apply, deleteObsolete: false,
    });
    const contentCounts = await upsertCollection({
      directus, collection: 'daily_content_views', rows: contentRows, existing: existingContent, keyField: 'record_key', apply,
    });
    if (apply) {
      const audienceId = audienceExisting[0]?.id;
      await directus(audienceId ? `/items/audience_metrics/${audienceId}` : '/items/audience_metrics', {
        method: audienceId ? 'PATCH' : 'POST',
        body: JSON.stringify(audienceMetrics),
      });
    }
    result.sections.daily = {
      days: rows.length,
      totalViews: rows.reduce((sum, row) => sum + row.total_views, 0),
      dailyViews: dailyCounts,
      contentRows: contentRows.length,
      dailyContentViews: contentCounts,
      ...(apply ? {} : { audienceMetrics, rowsData: rows, contentRowsData: contentRows }),
    };
  }

  // ── 4. 流量入口（tools/sync-ga4-traffic-sources.mjs；本機腳本不分頁，這裡相同） ──
  if (wants.has('traffic')) {
    const report = await ga4.runReport({
      dateRanges: [{ startDate: SITE_LAUNCH_DATE, endDate: 'today' }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }, { name: 'sessionCampaignName' }, { name: 'landingPagePlusQueryString' }],
      metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
      limit: PAGE_SIZE,
    });
    if (Number(report.rowCount ?? 0) > PAGE_SIZE) {
      console.error(`流量入口 GA4 rowCount=${report.rowCount} 超過單頁 ${PAGE_SIZE}，超出部分未同步（本機腳本同樣限制）。`);
    }
    const rows = buildTrafficSourceRows({ gaRows: parseGa4SourceRows(report), articleTitles, syncedAt: new Date().toISOString() });
    const existing = await directus('/items/traffic_sources?fields=id,source_key&limit=-1');
    const counts = await upsertCollection({ directus, collection: 'traffic_sources', rows, existing, keyField: 'source_key', apply });
    result.sections.traffic = {
      rows: rows.length,
      sessions: rows.reduce((sum, row) => sum + row.sessions, 0),
      ...counts,
      ...(apply ? {} : { rowsData: rows }),
    };
  }

  result.usage = { subrequests: counter.count, ...usage, wallMs: Date.now() - startedAt };
  return result;
}

/**
 * 3 小時區塊閘門：cron 每小時觸發一次，只有「本區塊（UTC 00-02、03-05…）還沒成功同步過」才實際跑。
 * 成功與否以 traffic_sources 最新的 views_synced_at 判斷（流量入口是最後一段，寫入代表四段都成功）。
 * 這樣失敗時下一個整點就會重試，不用等 3 小時，也不需要另外的 KV 狀態。
 */
export async function hasSucceededInCurrentBlock({ env, now = new Date() }) {
  const directus = createDirectusClient({ token: env.DIRECTUS_TOKEN, fetchImpl: fetch });
  const latest = await directus('/items/traffic_sources?fields=views_synced_at&sort=-views_synced_at&limit=1');
  const lastSyncedAt = latest[0]?.views_synced_at;
  if (!lastSyncedAt) return { skip: false, lastSyncedAt: null };
  const blockOf = (date) => `${date.toISOString().slice(0, 10)}-${Math.floor(date.getUTCHours() / 3)}`;
  return { skip: blockOf(new Date(lastSyncedAt)) === blockOf(now), lastSyncedAt };
}
