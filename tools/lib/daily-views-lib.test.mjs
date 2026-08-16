import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyContentViewRows, buildDailyViewRows, parseGa4DailyRows, parseGa4DailyUserRows } from './daily-views-lib.mjs';

test('parseGa4DailyRows 讀取日期、路徑、觀看與使用者指標', () => {
  assert.deepEqual(parseGa4DailyRows({ rows: [{ dimensionValues: [{ value: '20260816' }, { value: '/' }], metricValues: [{ value: '3' }, { value: '2' }, { value: '2' }] }] }), [{ date: '20260816', path: '/', views: 3, active_users: 2, total_users: 2 }]);
});

test('parseGa4DailyUserRows 讀取不重複加總的全站每日使用者', () => {
  assert.deepEqual(parseGa4DailyUserRows({ rows: [{ dimensionValues: [{ value: '20260816' }], metricValues: [{ value: '5' }, { value: '6' }] }] }), [{ date: '20260816', active_users: 5, total_users: 6 }]);
});

test('buildDailyViewRows 分開文章與頁面、排除舊站並補零日期', () => {
  const rows = buildDailyViewRows({
    gaRows: [
      { date: '20260814', path: '/', views: 3 },
      { date: '20260814', path: '/blog/hello/', views: 2 },
      { date: '20260814', path: '/star-jobs-website/', views: 99 },
    ],
    dailyUserRows: [{ date: '20260814', active_users: 4, total_users: 5 }],
    articleTitles: new Map([['hello', '哈囉']]),
    startDate: '2026-08-14', endDate: '2026-08-15', syncedAt: '2026-08-16T00:00:00Z',
  });
  assert.deepEqual(rows.map(({ views_synced_at, ...row }) => row), [
    { date: '2026-08-14', total_views: 5, page_views: 3, article_views: 2, active_users: 4, total_users: 5 },
    { date: '2026-08-15', total_views: 0, page_views: 0, article_views: 0, active_users: 0, total_users: 0 },
  ]);
});

test('buildDailyContentViewRows 為每篇文章與頁面建立每日明細並合併路徑變形', () => {
  const rows = buildDailyContentViewRows({
    gaRows: [
      { date: '20260816', path: '/blog/hello', views: 2, active_users: 1, total_users: 1 },
      { date: '20260816', path: '/blog/hello/?utm_source=threads', views: 3, active_users: 2, total_users: 2 },
      { date: '20260816', path: '/', views: 4, active_users: 3, total_users: 4 },
      { date: '20260815', path: '/about/', views: 1, active_users: 1, total_users: 1 },
      { date: '20260816', path: '/star-jobs-website/', views: 99 },
      { date: 'invalid', path: '/', views: 7 },
      { date: '20260816', path: '/faq/', views: 0 },
    ],
    articleTitles: new Map([['hello', '哈囉文章']]),
    syncedAt: '2026-08-16T12:00:00Z',
  });

  assert.deepEqual(rows, [
    {
      record_key: '2026-08-16:/blog/hello/', date: '2026-08-16', content_type: '文章',
      name: '哈囉文章', path: '/blog/hello/', views: 5, active_users: 3, total_users: 3, views_synced_at: '2026-08-16T12:00:00Z',
    },
    {
      record_key: '2026-08-16:/', date: '2026-08-16', content_type: '頁面',
      name: '首頁', path: '/', views: 4, active_users: 3, total_users: 4, views_synced_at: '2026-08-16T12:00:00Z',
    },
    {
      record_key: '2026-08-15:/about/', date: '2026-08-15', content_type: '頁面',
      name: '關於我', path: '/about/', views: 1, active_users: 1, total_users: 1, views_synced_at: '2026-08-16T12:00:00Z',
    },
  ]);
});
