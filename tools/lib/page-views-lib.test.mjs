import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateEngagementByPath, aggregateViewsByPath, buildPageViewRows, classifyPath } from './page-views-lib.mjs';

test('aggregateViewsByPath 合併 query、大小寫與尾斜線變形', () => {
  const result = aggregateViewsByPath([
    { path: '/About', views: 2 },
    { path: '/about/?utm=x', views: 3 },
  ]);
  assert.deepEqual([...result], [['/about/', 5]]);
});

test('aggregateEngagementByPath 依正規化路徑加總 duration 與 users', () => {
  const result = aggregateEngagementByPath([
    { path: '/About', duration: 40, users: 5 },
    { path: '/about/?utm=x', duration: 29, users: 4 },
  ]);
  assert.deepEqual([...result], [['/about/', { duration: 69, users: 9 }]]);
});

test('classifyPath 區分現行頁面、文章與舊站頁面', () => {
  const titles = new Map([['hello', '哈囉']]);
  assert.deepEqual(classifyPath('/', titles), { name: '首頁', content_type: '頁面', is_current: true });
  assert.deepEqual(classifyPath('/blog/hello/', titles), { name: '哈囉', content_type: '文章', is_current: true });
  assert.equal(classifyPath('/old-page/', titles).content_type, '舊站頁面');
});

test('buildPageViewRows 只保留現行一般頁面，排除舊站與單篇文章', () => {
  const rows = buildPageViewRows({
    totalRows: [{ path: '/', views: 10 }, { path: '/old/', views: 5 }, { path: '/blog/hello/', views: 4 }],
    last30dRows: [{ path: '/', views: 3 }, { path: '/blog/hello/', views: 4 }],
    articleTitles: new Map([['hello', '哈囉']]),
    syncedAt: '2026-08-16T00:00:00.000Z',
  });
  assert.equal(rows[0].path, '/');
  assert.equal(rows[0].views_30d, 3);
  assert.equal(rows.length, 1);
  assert.equal(rows.some((row) => row.path === '/old/'), false);
  assert.equal(rows.some((row) => row.path === '/blog/hello/'), false);
});

test('buildPageViewRows 帶入 last30dRows 的 duration/users 時算出 avg_engagement_seconds_30d', () => {
  const rows = buildPageViewRows({
    totalRows: [{ path: '/', views: 10 }],
    last30dRows: [{ path: '/', views: 3, duration: 189, users: 2 }],
    syncedAt: '2026-08-16T00:00:00.000Z',
  });
  assert.equal(rows[0].avg_engagement_seconds_30d, 95); // 189/2 = 94.5 → 四捨五入 95
});

test('buildPageViewRows 沒有互動資料時 avg_engagement_seconds_30d 是 null，不是 0', () => {
  const rows = buildPageViewRows({
    totalRows: [{ path: '/', views: 10 }],
    last30dRows: [{ path: '/', views: 3 }], // 沒有 duration/users
    syncedAt: '2026-08-16T00:00:00.000Z',
  });
  assert.equal(rows[0].avg_engagement_seconds_30d, null);
});
