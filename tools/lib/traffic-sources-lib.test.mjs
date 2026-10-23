import test from 'node:test'; import assert from 'node:assert/strict';
import { CHANNELS, DERIVED_CHANNELS, EXTERNAL_CHANNELS, TAIL_CHANNELS, attachSessionStartReferrers, buildTodaySources, buildTrafficSourceRows, classifySource, classifyVisit, hasFbclid, isSuspectedBot, parseGa4DirectVisitRows, parseGa4ReferrerRows, parseGa4SourceRows, parseGa4TodaySourceRows, sortChannelsForDisplay } from './traffic-sources-lib.mjs';
test('classifySource 依 source／medium 分類（direct 先回「不明」）', () => {
  const cases = [
    ['google', 'organic', 'Google 搜尋'], ['google', 'cpc', '其他'],
    ['l.threads.com', 'referral', 'Threads'], ['threads.net', 'social', 'Threads'],
    ['ig', 'comment', 'Instagram'], ['l.instagram.com', 'referral', 'Instagram'],
    ['lm.facebook.com', 'referral', 'Facebook'], ['fb', 'social', 'Facebook'],
    ['chatgpt.com', 'referral', 'AI 搜尋'], ['gemini.google.com', 'referral', 'AI 搜尋'], ['perplexity', 'referral', 'AI 搜尋'],
    ['claude.ai', 'referral', 'AI 搜尋'], ['copilot.microsoft.com', 'referral', 'AI 搜尋'], ['someai.example', 'ai-assistant', 'AI 搜尋'],
    ['(direct)', '(none)', '不明'],
    ['bing', 'organic', '其他'], ['yahoo', 'organic', '其他'], ['example.com', 'referral', '其他'], ['line.me', 'referral', 'LINE'], ['line', 'social', 'LINE'], ['liff.line.me', 'referral', 'LINE'],
    ['youtube', 'description', 'YouTube'], ['m.youtube.com', 'referral', 'YouTube'], ['yt', 'social', 'YouTube'], ['(not set)', '(not set)', '其他'], ['', '', '其他'],
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
  assert.deepEqual(rows.map((r) => r.channel).sort(), ['AI 搜尋', 'AI 搜尋', '其他', '其他']);
});
test('buildTodaySources 依入口分類合併、依固定順序排列並略過 0 人', () => {
  const result = buildTodaySources([
    { source: 'google', medium: 'organic', users: 7 },
    { source: 'l.threads.com', medium: 'referral', users: 3 },
    { source: 'threads.net', medium: 'social', users: 1 },
    { source: '(direct)', medium: '(none)', users: 5 },
    { source: 'bing', medium: 'organic', users: 0 },
    { source: 'x', medium: 'y', users: 2 },
  ]);
  assert.deepEqual(result, [
    { channel: 'Google 搜尋', users: 7 }, { channel: 'Threads', users: 4 }, { channel: '其他', users: 2 }, { channel: '不明', users: 5 },
  ]);
  assert.deepEqual(buildTodaySources([], 3), []);
  assert.equal(buildTodaySources([{ source: 'google', medium: 'organic', users: 3 }, { source: 'fb', medium: 'social', users: 2 }, { source: 'x', medium: 'y', users: 1 }], 2).length, 2);
  assert.deepEqual(buildTodaySources([{ source: 'a', medium: 'b', users: 2 }, { source: 'c', medium: 'd', users: 3 }]), [{ channel: '其他', users: 5 }]);
});
test('buildTodaySources 直接造訪用同一套細分規則', () => {
  const direct = { source: '(direct)', medium: '(none)', landing_page: '/', engaged_sessions: 1, engagement_seconds: 10 };
  const result = buildTodaySources([
    { ...direct, landing_page: '/?fbclid=abc', users: 2 },
    { ...direct, browser: 'Safari (in-app)', users: 1 },
    { ...direct, new_vs_returning: 'returning', users: 3 },
    { ...direct, users: 4 },
  ]);
  assert.deepEqual(result, [
    { channel: 'Facebook', users: 2 }, { channel: '回訪讀者', users: 3 }, { channel: 'App 內建瀏覽器', users: 1 }, { channel: '不明', users: 4 },
  ]);
});
test('parseGa4TodaySourceRows 解析維度與人數', () => {
  const dims = ['google', 'organic', '/', 'Chrome', 'new', '1920x1080', 'Taiwan'];
  const rows = parseGa4TodaySourceRows({ rows: [{ dimensionValues: dims.map((value) => ({ value })), metricValues: [{ value: '12' }, { value: '10' }, { value: '99' }] }] });
  assert.deepEqual(rows, [{ source: 'google', medium: 'organic', landing_page: '/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1920x1080', country: 'Taiwan', users: 12, engaged_sessions: 10, engagement_seconds: 99 }]);
  assert.deepEqual(parseGa4TodaySourceRows(undefined), []);
});

const direct = (extra = {}) => ({ source: '(direct)', medium: '(none)', landing_page: '/blog/a/', browser: 'Chrome', new_vs_returning: 'new', page_referrer: '', screen_resolution: '1920x1080', country: 'Taiwan', engaged_sessions: 1, engagement_seconds: 12, ...extra });
test('classifyVisit：非 direct 維持 classifySource，不受其他維度影響', () => {
  assert.equal(classifyVisit({ source: 'google', medium: 'organic', landing_page: '/?fbclid=x', browser: 'Safari (in-app)', screen_resolution: '800x600' }), 'Google 搜尋');
  assert.equal(classifyVisit({ source: 'bing', medium: 'organic', new_vs_returning: 'returning' }), '其他');
  assert.equal(classifyVisit({ source: 'line', medium: 'social' }), 'LINE');
});
test('classifyVisit：direct 的細分與優先順序', () => {
  assert.equal(classifyVisit(direct()), '不明');
  assert.equal(classifyVisit(direct({ landing_page: '/blog/a/?fbclid=IwAR1' })), 'Facebook');
  assert.equal(classifyVisit(direct({ landing_page: '/blog/a/?x=1&fbclid=IwAR1' })), 'Facebook');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://aixwang.dev/blog/' })), '站內換頁');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://www.aixwang.dev/' })), '站內換頁');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://notaixwang.dev/' })), '不明');
  assert.equal(classifyVisit(direct({ browser: 'Safari (in-app)' })), 'App 內建瀏覽器');
  assert.equal(classifyVisit(direct({ browser: 'Android Webview' })), 'App 內建瀏覽器');
  assert.equal(classifyVisit(direct({ new_vs_returning: 'returning' })), '回訪讀者');
  // 優先順序：fbclid > 自動程式 > 站內換頁 > App 內建 > 回訪
  assert.equal(classifyVisit(direct({ landing_page: '/?fbclid=1', screen_resolution: '800x600' })), 'Facebook');
  assert.equal(classifyVisit(direct({ screen_resolution: '800x600', page_referrer: 'https://aixwang.dev/' })), '疑似自動程式');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://aixwang.dev/', browser: 'Safari (in-app)', new_vs_returning: 'returning' })), '站內換頁');
  assert.equal(classifyVisit(direct({ browser: 'Safari (in-app)', new_vs_returning: 'returning' })), 'App 內建瀏覽器');
});
test('疑似自動程式規則：800x600，或美國且零互動；有互動的美國訪客不算', () => {
  assert.equal(isSuspectedBot({ screen_resolution: '800x600' }), true);
  assert.equal(isSuspectedBot({ screen_resolution: '800 x 600' }), true);
  assert.equal(isSuspectedBot({ country: 'United States', engaged_sessions: 0, engagement_seconds: 0 }), true);
  assert.equal(isSuspectedBot({ country: 'United States', engaged_sessions: 1, engagement_seconds: 0 }), false);
  assert.equal(isSuspectedBot({ country: 'United States', engaged_sessions: 0, engagement_seconds: 3 }), false);
  assert.equal(isSuspectedBot({ country: 'Taiwan', engaged_sessions: 0, engagement_seconds: 0 }), false);
  assert.equal(hasFbclid('/a/?fbclid=1'), true); assert.equal(hasFbclid('/a/?notfbclid=1'), false); assert.equal(hasFbclid('/a/'), false);
});
test('所有分類結果都在 CHANNELS 內，且 CHANNELS 無重複', () => {
  assert.equal(new Set(CHANNELS).size, CHANNELS.length);
  for (const visit of [direct(), direct({ landing_page: '/?fbclid=1' }), direct({ screen_resolution: '800x600' }), direct({ browser: 'Android Webview' }), direct({ new_vs_returning: 'returning' }), direct({ page_referrer: 'https://aixwang.dev/' }), { source: 'x', medium: 'y' }]) {
    assert.ok(CHANNELS.includes(classifyVisit(visit)));
  }
});
test('sortChannelsForDisplay：外部來源依人數、再衍生分類依人數，最後固定「其他」「疑似自動程式」「不明」', () => {
  const sorted = sortChannelsForDisplay([
    { channel: '不明', sessions: 900 }, { channel: '疑似自動程式', sessions: 500 }, { channel: '其他', sessions: 1 },
    { channel: '站內換頁', sessions: 5 }, { channel: '回訪讀者', sessions: 7 }, { channel: 'App 內建瀏覽器', sessions: 6 },
    { channel: 'AI 搜尋', sessions: 2 }, { channel: 'Facebook', sessions: 40 }, { channel: 'Google 搜尋', sessions: 3 }, { channel: 'Threads', sessions: 40 }, { channel: 'Instagram', sessions: 9 },
  ]);
  assert.deepEqual(sorted.map((x) => x.channel), ['Facebook', 'Threads', 'Instagram', 'Google 搜尋', 'AI 搜尋', '回訪讀者', 'App 內建瀏覽器', '站內換頁', '其他', '疑似自動程式', '不明']);
  assert.deepEqual(sortChannelsForDisplay([{ channel: 'LINE', sessions: 2 }, { channel: '不明', sessions: 9 }]).map((x) => x.channel), ['LINE', '不明']);
  assert.deepEqual(sortChannelsForDisplay([{ channel: 'a', users: 1 }, { channel: 'b', users: 3 }], 'users').map((x) => x.channel), ['b', 'a']);
  assert.deepEqual([...EXTERNAL_CHANNELS, ...DERIVED_CHANNELS, ...TAIL_CHANNELS], CHANNELS);
  assert.deepEqual(TAIL_CHANNELS, ['其他', '疑似自動程式', '不明']);
});
test('buildTrafficSourceRows：細分後依「分類＋進站頁」合併，source_key 不重複', () => {
  const rows = buildTrafficSourceRows({ syncedAt: 'x', gaRows: [
    { ...direct({ landing_page: '/about/?fbclid=1' }), campaign: '(direct)', sessions: 2, views: 3 },
    { ...direct({ landing_page: '/about/?fbclid=2', browser: 'Safari (in-app)' }), campaign: '(direct)', sessions: 1, views: 1 },
    { ...direct({ landing_page: '/about/', browser: 'Safari (in-app)' }), campaign: '(direct)', sessions: 4, views: 4 },
    { ...direct({ landing_page: '/about/', browser: 'Android Webview', country: 'Japan' }), campaign: '(direct)', sessions: 1, views: 2 },
    { ...direct({ landing_page: '/about/', page_referrer: 'https://aixwang.dev/' }), campaign: '(direct)', sessions: 3, views: 3 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 9, views: 9 },
  ] });
  const byChannel = Object.fromEntries(rows.map((r) => [r.channel, r]));
  assert.equal(rows.length, 4); assert.equal(new Set(rows.map((r) => r.source_key)).size, 4);
  assert.equal(byChannel['Facebook'].sessions, 3); assert.equal(byChannel['Facebook'].landing_page, '/about/');
  assert.equal(byChannel['App 內建瀏覽器'].sessions, 5); assert.equal(byChannel['App 內建瀏覽器'].views, 6);
  assert.equal(byChannel['站內換頁'].sessions, 3); assert.equal(byChannel['Google 搜尋'].sessions, 9);
});
test('parseGa4SourceRows／parseGa4DirectVisitRows／parseGa4ReferrerRows 解析', () => {
  const mk = (dims, mets) => ({ rows: [{ dimensionValues: dims.map((value) => ({ value })), metricValues: mets.map((value) => ({ value })) }] });
  assert.deepEqual(parseGa4SourceRows(mk(['google', 'organic', '(organic)', '/a/'], ['3', '5'])), [{ source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/a/', sessions: 3, views: 5 }]);
  assert.deepEqual(parseGa4DirectVisitRows(mk(['/a/', 'Chrome', 'new', '1x1', 'Taiwan'], ['2', '3', '1', '40'])), [{ source: '(direct)', medium: '(none)', campaign: '(direct)', landing_page: '/a/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1x1', country: 'Taiwan', sessions: 2, views: 3, engaged_sessions: 1, engagement_seconds: 40 }]);
  assert.deepEqual(parseGa4ReferrerRows(mk(['/a/', 'Chrome', 'new', '1x1', 'Taiwan', 'https://aixwang.dev/'], ['2'])), [{ landing_page: '/a/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1x1', country: 'Taiwan', page_referrer: 'https://aixwang.dev/', count: 2 }]);
});
test('attachSessionStartReferrers：以進站 referrer 切分，總數不變（不重複計算）', () => {
  const base = direct({ sessions: 5, views: 8 });
  const ref = (page_referrer, count) => ({ landing_page: base.landing_page, browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1920x1080', country: 'Taiwan', page_referrer, count });
  const out = attachSessionStartReferrers([base, { source: 'google', medium: 'organic', landing_page: '/x/', sessions: 7, views: 7 }], [ref('', 4), ref('https://aixwang.dev/blog/', 1)]);
  assert.equal(out.reduce((s, r) => s + r.sessions, 0), 12); assert.equal(out.reduce((s, r) => s + r.views, 0), 15);
  const self = out.find((r) => r.page_referrer.startsWith('https://aixwang.dev'));
  assert.equal(self.sessions, 1);
  assert.equal(out.find((r) => r.source === 'google').page_referrer, '');
  // 找不到對應的進站事件 → 全部視為 referrer 空白；查詢結果多於實際（不可能超過）時按實際總數縮回
  assert.deepEqual(attachSessionStartReferrers([base], []).map((r) => [r.page_referrer, r.sessions]), [['', 5]]);
  assert.equal(attachSessionStartReferrers([base], [ref('', 9)]).reduce((s, r) => s + r.sessions, 0), 5);
  // 互動指標原樣複製，用在 today 時計數欄位是 users
  const today = attachSessionStartReferrers([{ ...direct(), users: 3 }], [ref('https://aixwang.dev/', 1), ref('', 2)], ['users']);
  assert.deepEqual(today.map((r) => r.users).sort(), [1, 2]);
});
