import { classifyPath } from './page-views-lib.mjs';
import { normalizeGa4Path } from './ga4-views-lib.mjs';

export function parseGa4DailyRows(response) {
  return (response?.rows ?? []).map((row) => ({
    date: row?.dimensionValues?.[0]?.value ?? '',
    path: row?.dimensionValues?.[1]?.value ?? '',
    views: Number(row?.metricValues?.[0]?.value ?? 0),
  }));
}

function formatGaDate(raw) {
  if (!/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

export function buildDailyViewRows({ gaRows, articleTitles = new Map(), startDate, endDate, syncedAt }) {
  const byDate = new Map();
  for (const row of gaRows ?? []) {
    const date = formatGaDate(row.date);
    const path = normalizeGa4Path(row.path);
    if (!date || !path) continue;
    const classification = classifyPath(path, articleTitles);
    if (!classification.is_current || !['頁面', '文章'].includes(classification.content_type)) continue;
    const bucket = byDate.get(date) ?? { total_views: 0, page_views: 0, article_views: 0 };
    const views = Number(row.views ?? 0);
    bucket.total_views += views;
    if (classification.content_type === '文章') bucket.article_views += views;
    else bucket.page_views += views;
    byDate.set(date, bucket);
  }

  const rows = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    const date = cursor.toISOString().slice(0, 10);
    rows.push({ date, ...(byDate.get(date) ?? { total_views: 0, page_views: 0, article_views: 0 }), views_synced_at: syncedAt });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return rows;
}
