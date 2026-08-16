import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateViewsByPath, buildPageViewRows, classifyPath } from './page-views-lib.mjs';

test('aggregateViewsByPath 合併 query、大小寫與尾斜線變形', () => {
  const result = aggregateViewsByPath([
    { path: '/About', views: 2 },
    { path: '/about/?utm=x', views: 3 },
  ]);
  assert.deepEqual([...result], [['/about/', 5]]);
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
