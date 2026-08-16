import test from 'node:test'; import assert from 'node:assert/strict';
import { buildTrafficSourceRows, classifySource } from './traffic-sources-lib.mjs';
test('classifySource 辨識搜尋、Threads 與帶 UTM 的入口位置', () => {
  assert.equal(classifySource('google', 'organic'), 'Google 搜尋／AI Overview');
  assert.equal(classifySource('l.threads.com', 'referral'), 'Threads');
  assert.equal(classifySource('ig', 'comment'), 'Instagram 留言');
  assert.equal(classifySource('youtube', 'description'), 'YouTube 資訊欄');
  assert.equal(classifySource('chatgpt.com', 'referral'), 'ChatGPT');
  assert.equal(classifySource('lm.facebook.com', 'referral'), 'Facebook');
  assert.equal(classifySource('line.me', 'referral'), 'LINE');
});
test('buildTrafficSourceRows 合併同入口並排除舊站 landing page', () => {
  const rows = buildTrafficSourceRows({ gaRows: [
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 2, views: 3 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/?x=1', sessions: 1, views: 2 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/old/', sessions: 99, views: 99 },
  ], syncedAt: '2026-08-16T00:00:00Z' });
  assert.equal(rows.length, 1); assert.equal(rows[0].sessions, 3); assert.equal(rows[0].views, 5); assert.equal(rows[0].landing_page, '/about/');
});
