import test from 'node:test'; import assert from 'node:assert/strict';
import { CHANNELS, buildTodaySources, buildTrafficSourceRows, classifySource, parseGa4TodaySourceRows } from './traffic-sources-lib.mjs';
test('classifySource 收斂成 7 類', () => {
  const cases = [
    ['google', 'organic', 'Google 搜尋'], ['google', 'cpc', '其他'],
    ['l.threads.com', 'referral', 'Threads'], ['threads.net', 'social', 'Threads'],
    ['ig', 'comment', 'Instagram'], ['l.instagram.com', 'referral', 'Instagram'],
    ['lm.facebook.com', 'referral', 'Facebook'], ['fb', 'social', 'Facebook'],
    ['chatgpt.com', 'referral', 'AI 助理'], ['gemini.google.com', 'referral', 'AI 助理'], ['perplexity', 'referral', 'AI 助理'],
    ['claude.ai', 'referral', 'AI 助理'], ['copilot.microsoft.com', 'referral', 'AI 助理'], ['someai.example', 'ai-assistant', 'AI 助理'],
    ['(direct)', '(none)', '直接或不明來源'],
    ['bing', 'organic', '其他'], ['yahoo', 'organic', '其他'], ['example.com', 'referral', '其他'], ['line.me', 'referral', '其他'],
    ['youtube', 'description', '其他'], ['(not set)', '(not set)', '其他'], ['', '', '其他'],
  ];
  for (const [source, medium, expected] of cases) assert.equal(classifySource(source, medium), expected, `${source}/${medium}`);
  for (const [source, medium] of cases) assert.ok(CHANNELS.includes(classifySource(source, medium)));
});
test('buildTrafficSourceRows 合併同入口並排除舊站 landing page', () => {
  const rows = buildTrafficSourceRows({ gaRows: [
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 2, views: 3 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/?x=1', sessions: 1, views: 2 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/old/', sessions: 99, views: 99 },
  ], syncedAt: '2026-08-16T00:00:00Z' });
  assert.equal(rows.length, 1); assert.equal(rows[0].sessions, 3); assert.equal(rows[0].views, 5); assert.equal(rows[0].landing_page, '/about/');
});
test('buildTrafficSourceRows 同分類不同來源各自一列且 source_key 不重複', () => {
  const rows = buildTrafficSourceRows({ gaRows: [
    { source: 'bing', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 1, views: 1 },
    { source: 'yahoo', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 2, views: 2 },
    { source: 'chatgpt.com', medium: 'referral', campaign: '(referral)', landing_page: '/about/', sessions: 3, views: 3 },
    { source: 'gemini.google.com', medium: 'referral', campaign: '(referral)', landing_page: '/about/', sessions: 4, views: 4 },
  ], syncedAt: 'x' });
  assert.equal(new Set(rows.map((r) => r.source_key)).size, 4);
  assert.deepEqual(rows.map((r) => r.channel).sort(), ['AI 助理', 'AI 助理', '其他', '其他']);
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
    { channel: 'Google 搜尋', users: 7 }, { channel: '直接或不明來源', users: 5 }, { channel: 'Threads', users: 4 },
  ]);
  assert.deepEqual(buildTodaySources([], 3), []);
  assert.equal(buildTodaySources([{ source: 'google', medium: 'organic', users: 3 }, { source: 'fb', medium: 'social', users: 2 }, { source: 'x', medium: 'y', users: 1 }], 2).length, 2);
  assert.deepEqual(buildTodaySources([{ source: 'a', medium: 'b', users: 2 }, { source: 'c', medium: 'd', users: 3 }]), [{ channel: '其他', users: 5 }]);
});
test('parseGa4TodaySourceRows 解析維度與人數', () => {
  const rows = parseGa4TodaySourceRows({ rows: [{ dimensionValues: [{ value: 'google' }, { value: 'organic' }], metricValues: [{ value: '12' }] }] });
  assert.deepEqual(rows, [{ source: 'google', medium: 'organic', users: 12 }]);
  assert.deepEqual(parseGa4TodaySourceRows(undefined), []);
});
