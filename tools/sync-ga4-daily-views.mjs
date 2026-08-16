import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { buildDailyContentViewRows, buildDailyViewRows, parseGa4AudienceMetrics, parseGa4DailyRows, parseGa4DailyUserRows } from './lib/daily-views-lib.mjs';

const CMS = 'https://cms.aixwang.dev';
const SITE_LAUNCH_DATE = '2026-07-22';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;
const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) throw new Error('缺少 GA4_PROPERTY_ID。');
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

async function directus(path, init = {}) { const res = await fetch(`${CMS}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } }); const text = await res.text(); if (!res.ok) throw new Error(`Directus HTTP ${res.status}：${text.slice(0, 300)}`); return text ? JSON.parse(text).data : null; }
async function fetchGaRows() {
  const client = new BetaAnalyticsDataClient(); const rows = []; let offset = 0; let rowCount = Infinity;
  while (offset < rowCount) {
    const [response] = await client.runReport({ property: `properties/${propertyId}`, dateRanges: [{ startDate: SITE_LAUNCH_DATE, endDate: 'today' }], dimensions: [{ name: 'date' }, { name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'totalUsers' }], dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } }, returnPropertyQuota: true, limit: 10000, offset });
    rows.push(...parseGa4DailyRows(response)); rowCount = response.rowCount ?? 0; offset += 10000;
    const quota = response.propertyQuota?.tokensPerDay;
    if (quota) console.log(`GA4 每日配額：本次查詢消耗 ${quota.consumed}，剩餘 ${quota.remaining} tokens。`);
  }
  return rows;
}

async function fetchGaUserRows() {
  const client = new BetaAnalyticsDataClient();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate: SITE_LAUNCH_DATE, endDate: 'today' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'activeUsers' }, { name: 'totalUsers' }],
    dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } },
    returnPropertyQuota: true,
    limit: 10000,
  });
  const quota = response.propertyQuota?.tokensPerDay;
  if (quota) console.log(`GA4 每日配額：使用者查詢消耗 ${quota.consumed}，剩餘 ${quota.remaining} tokens。`);
  return parseGa4DailyUserRows(response);
}

async function fetchAudienceMetrics() {
  const client = new BetaAnalyticsDataClient();
  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [
      { startDate: SITE_LAUNCH_DATE, endDate: 'today', name: 'since_launch' },
      { startDate: '29daysAgo', endDate: 'today', name: 'last_30_days' },
      { startDate: 'today', endDate: 'today', name: 'today' },
    ],
    metrics: [{ name: 'totalUsers' }, { name: 'activeUsers' }],
    dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } },
    returnPropertyQuota: true,
  });
  const quota = response.propertyQuota?.tokensPerDay;
  if (quota) console.log(`GA4 每日配額：三個置頂數字查詢消耗 ${quota.consumed}，剩餘 ${quota.remaining} tokens。`);
  return parseGa4AudienceMetrics(response);
}

const [gaRows, dailyUserRows, audienceMetrics, articles] = await Promise.all([
  fetchGaRows(),
  fetchGaUserRows(),
  fetchAudienceMetrics(),
  directus('/items/articles?fields=slug,title&limit=-1'),
]);
const syncedAt = new Date().toISOString();
audienceMetrics.synced_at = syncedAt;
const articleTitles = new Map(articles.map((article) => [article.slug, article.title]));
const rows = buildDailyViewRows({ gaRows, dailyUserRows, articleTitles, startDate: SITE_LAUNCH_DATE, endDate: syncedAt.slice(0, 10), syncedAt });
const contentRows = buildDailyContentViewRows({ gaRows, articleTitles, syncedAt });
console.log(`每日流量 ${rows.length} 天；合計 ${rows.reduce((sum, row) => sum + row.total_views, 0)} 次。`);
console.log(`逐篇／逐頁每日流量 ${contentRows.length} 筆（只保存有觀看的日期）。`);
console.log(`置頂數字：總使用者 ${audienceMetrics.total_users}／近 30 天活躍 ${audienceMetrics.active_users_30d}／今日活躍 ${audienceMetrics.active_users_today}。`);
if (!apply) { console.log('dry-run：沒有寫入 CMS。'); process.exit(0); }
const existing = await directus('/items/daily_views?fields=id,date&limit=-1'); const idByDate = new Map(existing.map((item) => [item.date, item.id]));
for (const row of rows) { const id = idByDate.get(row.date); await directus(id ? `/items/daily_views/${id}` : '/items/daily_views', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(row) }); }

function chunks(items, size = 250) {
  const result = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

const existingContent = await directus('/items/daily_content_views?fields=id,record_key&limit=-1');
const contentIdByKey = new Map(existingContent.map((item) => [item.record_key, item.id]));
const creates = contentRows.filter((row) => !contentIdByKey.has(row.record_key));
const updates = contentRows
  .filter((row) => contentIdByKey.has(row.record_key))
  .map((row) => ({ id: contentIdByKey.get(row.record_key), ...row }));
const retainedKeys = new Set(contentRows.map((row) => row.record_key));
const deletes = existingContent.filter((item) => !retainedKeys.has(item.record_key)).map((item) => item.id);

for (const batch of chunks(creates)) await directus('/items/daily_content_views', { method: 'POST', body: JSON.stringify(batch) });
for (const batch of chunks(updates)) await directus('/items/daily_content_views', { method: 'PATCH', body: JSON.stringify(batch) });
for (const batch of chunks(deletes)) await directus('/items/daily_content_views', { method: 'DELETE', body: JSON.stringify(batch) });

const audienceExisting = await directus('/items/audience_metrics?fields=id,key&filter[key][_eq]=site&limit=1');
const audienceId = audienceExisting[0]?.id;
await directus(audienceId ? `/items/audience_metrics/${audienceId}` : '/items/audience_metrics', {
  method: audienceId ? 'PATCH' : 'POST',
  body: JSON.stringify(audienceMetrics),
});

console.log(`完成：已同步 ${rows.length} 天總流量、3 個置頂數字；每日內容明細新增 ${creates.length}、更新 ${updates.length}、移除 ${deletes.length} 筆。`);
