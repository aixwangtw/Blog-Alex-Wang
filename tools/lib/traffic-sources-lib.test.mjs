import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTodaySources, buildTrafficSourceRows, classifySource, parseGa4TodaySourceRows } from './traffic-sources-lib.mjs';
test('classifySource 辨識搜尋、Threads 與帶 UTM 的入口位置', () => {
  assert.equal(classifySource('google', 'organic'), 'Google 搜尋');
  assert.equal(classifySource('l.threads.com', 'referral'), 'Threads');
  assert.equal(classifySource('ig', 'comment'), 'Instagram 留言');
  assert.equal(classifySource('youtube', 'description'), 'YouTube 資訊欄');
  assert.equal(classifySource('chatgpt.com', 'referral'), 'ChatGPT');
  assert.equal(classifySource('lm.facebook.com', 'referral'), 'Facebook');
  assert.equal(classifySource('line.me', 'referral'), 'LINE');
  assert.equal(classifySource('(direct)', '(none)'), '不明來源');
});
test('buildTrafficSourceRows 合併同入口並排除舊站 landing page', () => {
  const rows = buildTrafficSourceRows({ gaRows: [
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 2, views: 3 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/?x=1', sessions: 1, views: 2 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/old/', sessions: 99, views: 99 },
  ], syncedAt: '2026-08-16T00:00:00Z' });
  assert.equal(rows.length, 1); assert.equal(rows[0].sessions, 3); assert.equal(rows[0].views, 5); assert.equal(rows[0].landing_page, '/about/');
});
test('buildTodaySources 依入口分類合併、排序並略過 0 人', () => {
  const result = buildTodaySources([
    { source: 'google', medium: 'organic', users: 7 },
    { source: 'l.threads.com', medium: 'referral', users: 3 },
    { source: 'threads.net', medium: 'social', users: 1 },
    { source: '(direct)', medium: '(none)', users: 5 },
    { source: 'bing', medium: 'organic', users: 0 },
  ]);
  assert.deepEqual(result, [
    { channel: 'Google 搜尋', users: 7 }, { channel: '不明來源', users: 5 }, { channel: 'Threads', users: 4 },
  ]);
  assert.deepEqual(buildTodaySources([], 3), []);
  assert.equal(buildTodaySources(Array.from({ length: 30 }, (_, i) => ({ source: `s${i}`, medium: 'x', users: i + 1 })), 5).length, 5);
});
test('parseGa4TodaySourceRows 解析維度與人數', () => {
  const rows = parseGa4TodaySourceRows({ rows: [{ dimensionValues: [{ value: 'google' }, { value: 'organic' }], metricValues: [{ value: '12' }] }] });
  assert.deepEqual(rows, [{ source: 'google', medium: 'organic', users: 12 }]);
  assert.deepEqual(parseGa4TodaySourceRows(undefined), []);
});
