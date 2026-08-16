import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { buildDailyViewRows, parseGa4DailyRows } from './lib/daily-views-lib.mjs';

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
    const [response] = await client.runReport({ property: `properties/${propertyId}`, dateRanges: [{ startDate: SITE_LAUNCH_DATE, endDate: 'today' }], dimensions: [{ name: 'date' }, { name: 'pagePath' }], metrics: [{ name: 'screenPageViews' }], dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } }, limit: 10000, offset });
    rows.push(...parseGa4DailyRows(response)); rowCount = response.rowCount ?? 0; offset += 10000;
  }
  return rows;
}

const [gaRows, articles] = await Promise.all([fetchGaRows(), directus('/items/articles?fields=slug,title&limit=-1')]);
const syncedAt = new Date().toISOString();
const rows = buildDailyViewRows({ gaRows, articleTitles: new Map(articles.map((a) => [a.slug, a.title])), startDate: SITE_LAUNCH_DATE, endDate: syncedAt.slice(0, 10), syncedAt });
console.log(`每日流量 ${rows.length} 天；合計 ${rows.reduce((sum, row) => sum + row.total_views, 0)} 次。`);
if (!apply) { console.log('dry-run：沒有寫入 CMS。'); process.exit(0); }
const existing = await directus('/items/daily_views?fields=id,date&limit=-1'); const idByDate = new Map(existing.map((item) => [item.date, item.id]));
for (const row of rows) { const id = idByDate.get(row.date); await directus(id ? `/items/daily_views/${id}` : '/items/daily_views', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(row) }); }
console.log(`完成：已同步 ${rows.length} 天的每日流量。`);
