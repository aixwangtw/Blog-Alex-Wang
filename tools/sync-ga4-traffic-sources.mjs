import { BetaAnalyticsDataClient } from '@google-analytics/data'; import { sortChannelsForDisplay } from './lib/traffic-sources-lib.mjs'; import { DIRECT_VISIT_DIMENSIONS, DIRECT_VISIT_METRICS, MEDIUM_NONE_FILTER, NON_DIRECT_FILTER, REFERRER_DIMENSIONS, REFERRER_METRICS, SESSION_START_FILTER, TRAFFIC_SOURCE_DIMENSIONS, TRAFFIC_SOURCE_METRICS, attachSessionStartReferrers, buildTrafficSourceRows, parseGa4DirectVisitRows, parseGa4ReferrerRows, parseGa4SourceRows } from './lib/traffic-sources-lib.mjs';
const CMS = 'https://cms.aixwang.dev'; const apply = process.argv.slice(2).includes('--apply'); const token = process.env.DIRECTUS_TOKEN; const propertyId = process.env.GA4_PROPERTY_ID;
if (!propertyId) throw new Error('缺少 GA4_PROPERTY_ID。'); if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');
async function directus(path, init = {}) { const r = await fetch(`${CMS}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } }); const t = await r.text(); if (!r.ok) throw new Error(`Directus HTTP ${r.status}：${t.slice(0, 300)}`); return t ? JSON.parse(t).data : null; }
const client = new BetaAnalyticsDataClient();
const HOST_FILTER = { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } };
// GA4 單次最多 9 個維度（篩選欄位也算）：一般造訪、直接造訪（多帶 browser 等判斷去處的維度）、直接造訪的進站 referrer 分三次查，再合併（原因見 traffic-sources-lib.mjs）。
async function fetchAll(dimensions, metrics, extraFilters, parse) {
  const out = []; let offset = 0; let rowCount = Infinity;
  while (offset < rowCount) {
    const [report] = await client.runReport({ property: `properties/${propertyId}`, dateRanges: [{ startDate: '2026-07-22', endDate: 'today' }], dimensions: dimensions.map((name) => ({ name })), metrics: metrics.map((name) => ({ name })), dimensionFilter: { andGroup: { expressions: [HOST_FILTER, ...extraFilters] } }, limit: 10000, offset });
    out.push(...parse(report)); rowCount = report.rowCount ?? 0; offset += 10000;
  }
  return out;
}
const [normal, direct, referrers] = [await fetchAll(TRAFFIC_SOURCE_DIMENSIONS, TRAFFIC_SOURCE_METRICS, [NON_DIRECT_FILTER], parseGa4SourceRows), await fetchAll(DIRECT_VISIT_DIMENSIONS, DIRECT_VISIT_METRICS, [MEDIUM_NONE_FILTER], parseGa4DirectVisitRows), await fetchAll(REFERRER_DIMENSIONS, REFERRER_METRICS, [MEDIUM_NONE_FILTER, SESSION_START_FILTER], parseGa4ReferrerRows)];
const gaRows = [...normal, ...attachSessionStartReferrers(direct, referrers)];
const articles = await directus('/items/articles?fields=slug,title&limit=-1'); const syncedAt = new Date().toISOString(); const rows = buildTrafficSourceRows({ gaRows, articleTitles: new Map(articles.map((a) => [a.slug, a.title])), syncedAt });
console.log(`流量入口 ${rows.length} 組；合計 ${rows.reduce((s, r) => s + r.sessions, 0)} 次造訪。`);
console.log(`分類：${sortChannelsForDisplay([...rows.reduce((m, r) => m.set(r.channel, (m.get(r.channel) ?? 0) + r.sessions), new Map())].map(([channel, sessions]) => ({ channel, sessions }))).map((x) => `${x.channel} ${x.sessions}`).join('、')}`); if (!apply) process.exit(0);
const existing = await directus('/items/traffic_sources?fields=id,source_key&limit=-1'); const ids = new Map(existing.map((x) => [x.source_key, x.id]));
for (const row of rows) { const id = ids.get(row.source_key); await directus(id ? `/items/traffic_sources/${id}` : '/items/traffic_sources', { method: id ? 'PATCH' : 'POST', body: JSON.stringify(row) }); }
const keep = new Set(rows.map((r) => r.source_key)); for (const item of existing) if (!keep.has(item.source_key)) await directus(`/items/traffic_sources/${item.id}`, { method: 'DELETE' });
console.log(`完成：已同步 ${rows.length} 組流量入口。`);
