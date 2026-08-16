import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyViewRows, parseGa4DailyRows } from './daily-views-lib.mjs';

test('parseGa4DailyRows 讀取 date、pagePath 與 views', () => {
  assert.deepEqual(parseGa4DailyRows({ rows: [{ dimensionValues: [{ value: '20260816' }, { value: '/' }], metricValues: [{ value: '3' }] }] }), [{ date: '20260816', path: '/', views: 3 }]);
});

test('buildDailyViewRows 分開文章與頁面、排除舊站並補零日期', () => {
  const rows = buildDailyViewRows({
    gaRows: [
      { date: '20260814', path: '/', views: 3 },
      { date: '20260814', path: '/blog/hello/', views: 2 },
      { date: '20260814', path: '/star-jobs-website/', views: 99 },
    ],
    articleTitles: new Map([['hello', '哈囉']]),
    startDate: '2026-08-14', endDate: '2026-08-15', syncedAt: '2026-08-16T00:00:00Z',
  });
  assert.deepEqual(rows.map(({ views_synced_at, ...row }) => row), [
    { date: '2026-08-14', total_views: 5, page_views: 3, article_views: 2 },
    { date: '2026-08-15', total_views: 0, page_views: 0, article_views: 0 },
  ]);
});
