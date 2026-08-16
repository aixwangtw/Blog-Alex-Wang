// 查詢 GA4 全站 pagePath，依路徑彙總後 upsert 到 Directus page_views。
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { parseGa4ApiRows } from './lib/ga4-views-lib.mjs';
import { buildPageViewRows } from './lib/page-views-lib.mjs';

const CMS = 'https://cms.aixwang.dev';
const SITE_LAUNCH_DATE = '2026-07-22';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;
const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) throw new Error('缺少 GA4_PROPERTY_ID。');
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

async function fetchRows(startDate) {
  const client = new BetaAnalyticsDataClient();
  const all = [];
  let offset = 0;
  let rowCount = Infinity;
  while (offset < rowCount) {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } },
      limit: 10000,
      offset,
    });
    all.push(...parseGa4ApiRows(response));
    rowCount = response.rowCount ?? 0;
    offset += 10000;
  }
  return all;
}

function getRecentStartDate() {
  const launch = new Date(`${SITE_LAUNCH_DATE}T00:00:00Z`);
  const thirtyDaysAfterLaunch = new Date(launch);
  thirtyDaysAfterLaunch.setUTCDate(thirtyDaysAfterLaunch.getUTCDate() + 30);
  return new Date() < thirtyDaysAfterLaunch ? SITE_LAUNCH_DATE : '30daysAgo';
}

async function directus(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Directus HTTP ${res.status}：${text.slice(0, 300)}`);
  return text ? JSON.parse(text).data : null;
}

const [totalRows, recentRows, articles] = await Promise.all([
  fetchRows(SITE_LAUNCH_DATE),
  fetchRows(getRecentStartDate()),
  directus('/items/articles?fields=slug,title&limit=-1'),
]);
const articleTitles = new Map(articles.map((article) => [article.slug, article.title]));
const rows = buildPageViewRows({ totalRows, last30dRows: recentRows, articleTitles, syncedAt: new Date().toISOString() });

console.log(`新站路徑 ${rows.length} 筆；上線後累積 ${rows.reduce((sum, row) => sum + row.views, 0)}；近 30 天 ${rows.reduce((sum, row) => sum + row.views_30d, 0)}。`);
for (const row of rows) console.log(`${String(row.views).padStart(5)} / ${String(row.views_30d).padStart(4)}　${row.content_type}　${row.path}　${row.name}`);
if (!apply) {
  console.log('dry-run：沒有寫入 CMS。');
  process.exit(0);
}

const existing = await directus('/items/page_views?fields=id,path&limit=-1');
const idsByPath = new Map(existing.map((item) => [item.path, item.id]));
for (const row of rows) {
  const id = idsByPath.get(row.path);
  await directus(id ? `/items/page_views/${id}` : '/items/page_views', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(row),
  });
}
const retainedPaths = new Set(rows.map((row) => row.path));
const obsolete = existing.filter((item) => !retainedPaths.has(item.path));
for (const item of obsolete) await directus(`/items/page_views/${item.id}`, { method: 'DELETE' });
console.log(`完成：已同步 ${rows.length} 個新站頁面路徑，移除 ${obsolete.length} 個舊站／非現行路徑。`);
