import test from 'node:test'; import assert from 'node:assert/strict';
import { CHANNELS, CH, CHANNEL_MERGE, DERIVED_CHANNELS, EXTERNAL_CHANNELS, TAIL_CHANNELS, attachSessionStartReferrers, buildTodaySources, buildTrafficSourceRows, classifySource, classifyVisit, classifyVisitDetail, hasFbclid, isSuspectedBot, parseGa4DirectVisitRows, parseGa4ReferrerRows, parseGa4SourceRows, parseGa4TodaySourceRows, sortChannelsForDisplay } from './traffic-sources-lib.mjs';
test('classifySource 依 source／medium 分類（direct 與未列名來源都是「其他」）', () => {
  const cases = [
    ['google', 'organic', 'Google 搜尋'], ['google', 'cpc', '其他'],
    ['l.threads.com', 'referral', 'Threads'], ['threads.net', 'social', 'Threads'],
    ['ig', 'comment', 'Instagram'], ['l.instagram.com', 'referral', 'Instagram'],
    ['lm.facebook.com', 'referral', 'Facebook'], ['fb', 'social', 'Facebook'],
    ['chatgpt.com', 'referral', 'AI 助理'], ['gemini.google.com', 'referral', 'AI 助理'], ['perplexity', 'referral', 'AI 助理'],
    ['claude.ai', 'referral', 'AI 助理'], ['copilot.microsoft.com', 'referral', 'AI 助理'], ['someai.example', 'ai-assistant', 'AI 助理'],
    ['(direct)', '(none)', '其他'],
    ['bing', 'organic', '其他'], ['yahoo', 'organic', '其他'], ['example.com', 'referral', '其他'],
    ['line.me', 'referral', 'LINE'], ['line', 'social', 'LINE'], ['LINE', 'Social', 'LINE'], ['liff.line.me', 'referral', 'LINE'],
    ['youtube', 'description', '其他'], ['m.youtube.com', 'referral', '其他'], ['yt', 'social', '其他'], ['(not set)', '(not set)', '其他'], ['', '', '其他'],
  ];
  for (const [source, medium, expected] of cases) assert.equal(classifySource(source, medium), expected, `${source}/${medium}`);
  for (const [source, medium] of cases) assert.ok(CHANNELS.includes(classifySource(source, medium)));
});
test('後台不得出現已取消的分類名稱', () => {
  for (const banned of ['不明', '回訪讀者', 'App 內建瀏覽器', '直接或不明來源', 'AI 搜尋']) assert.ok(!CHANNELS.includes(banned), banned);
  assert.deepEqual(CHANNEL_MERGE, {});
});
const direct = (extra = {}) => ({ source: '(direct)', medium: '(none)', landing_page: '/blog/a/', page_referrer: '', screen_resolution: '1920x1080', country: 'Taiwan', engaged_sessions: 1, engagement_seconds: 12, ...extra });
test('classifyVisit：非 direct 維持 classifySource，不受其他維度影響', () => {
  assert.equal(classifyVisit({ source: 'google', medium: 'organic', landing_page: '/?fbclid=x', screen_resolution: '800x600' }), 'Google 搜尋');
  assert.equal(classifyVisit({ source: 'bing', medium: 'organic' }), '其他');
});
test('LINE：source=line（含 utm_source=line、LINE 分享按鈕的 campaign=article_share）歸獨立「LINE」類，排在外部來源區', () => {
  assert.equal(classifyVisit({ source: 'line', medium: 'social', campaign: 'article_share' }), 'LINE');
  assert.equal(classifyVisit({ source: 'line', medium: 'social', screen_resolution: '800x600' }), 'LINE');
  assert.ok(EXTERNAL_CHANNELS.includes(CH.LINE));
  assert.deepEqual(sortChannelsForDisplay([{ channel: '其他', sessions: 99 }, { channel: 'LINE', sessions: 1 }, { channel: '站內換頁', sessions: 5 }]).map((x) => x.channel), ['LINE', '站內換頁', '其他']);
});
test('classifyVisit：direct 的細分與優先順序（fbclid > 疑似自動程式 > 站內換頁 > 其他）', () => {
  assert.equal(classifyVisit(direct()), '其他');
  assert.equal(classifyVisit(direct({ landing_page: '/blog/a/?fbclid=IwAR1' })), 'Facebook');
  assert.equal(classifyVisit(direct({ landing_page: '/blog/a/?x=1&fbclid=IwAR1' })), 'Facebook');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://aixwang.dev/blog/' })), '站內換頁');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://www.aixwang.dev/' })), '站內換頁');
  assert.equal(classifyVisit(direct({ page_referrer: 'https://notaixwang.dev/' })), '其他');
  // 回訪、App 內建瀏覽器不再單獨列：一律「其他」
  assert.equal(classifyVisit({ ...direct(), browser: 'Safari (in-app)', new_vs_returning: 'returning' }), '其他');
  assert.equal(classifyVisit(direct({ landing_page: '/?fbclid=1', screen_resolution: '800x600' })), 'Facebook');
  assert.equal(classifyVisit(direct({ screen_resolution: '800x600', page_referrer: 'https://aixwang.dev/' })), '疑似自動程式');
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
  for (const visit of [direct(), direct({ landing_page: '/?fbclid=1' }), direct({ screen_resolution: '800x600' }), direct({ page_referrer: 'https://aixwang.dev/' }), { source: 'x', medium: 'y' }]) assert.ok(CHANNELS.includes(classifyVisit(visit)));
});
test('sortChannelsForDisplay：外部來源依人數、接著站內換頁，最後固定「其他」「疑似自動程式」', () => {
  const sorted = sortChannelsForDisplay([
    { channel: '疑似自動程式', sessions: 500 }, { channel: '其他', sessions: 1 }, { channel: '站內換頁', sessions: 5 },
    { channel: 'AI 助理', sessions: 2 }, { channel: 'Facebook', sessions: 40 }, { channel: 'Google 搜尋', sessions: 3 }, { channel: 'Threads', sessions: 40 }, { channel: 'Instagram', sessions: 9 }, { channel: 'LINE', sessions: 4 },
  ]);
  assert.deepEqual(sorted.map((x) => x.channel), ['Facebook', 'Threads', 'Instagram', 'LINE', 'Google 搜尋', 'AI 助理', '站內換頁', '其他', '疑似自動程式']);
  assert.deepEqual(sortChannelsForDisplay([{ channel: 'a', users: 1 }, { channel: 'b', users: 3 }], 'users').map((x) => x.channel), ['b', 'a']);
  assert.deepEqual([...EXTERNAL_CHANNELS, ...DERIVED_CHANNELS, ...TAIL_CHANNELS], CHANNELS);
  assert.deepEqual(TAIL_CHANNELS, ['其他', '疑似自動程式']);
});
test('buildTodaySources 依入口分類合併、依固定順序排列並略過 0 人', () => {
  const result = buildTodaySources([
    { source: 'google', medium: 'organic', users: 7 }, { source: 'l.threads.com', medium: 'referral', users: 3 }, { source: 'threads.net', medium: 'social', users: 1 },
    { source: '(direct)', medium: '(none)', users: 5 }, { source: 'bing', medium: 'organic', users: 0 }, { source: 'x', medium: 'y', users: 2 },
  ]);
  assert.deepEqual(result, [{ channel: 'Google 搜尋', users: 7 }, { channel: 'Threads', users: 4 }, { channel: '其他', users: 7, details: [{ name: '查不出來源', users: 5 }, { name: 'x / y', users: 2 }] }]);
  assert.deepEqual(buildTodaySources([], 3), []);
  assert.equal(buildTodaySources([{ source: 'google', medium: 'organic', users: 3 }, { source: 'fb', medium: 'social', users: 2 }, { source: 'x', medium: 'y', users: 1 }], 2).length, 2);
});
test('buildTodaySources 直接造訪用同一套細分規則', () => {
  const d = { source: '(direct)', medium: '(none)', landing_page: '/', engaged_sessions: 1, engagement_seconds: 10 };
  assert.deepEqual(buildTodaySources([
    { ...d, landing_page: '/?fbclid=abc', users: 2 }, { ...d, page_referrer: 'https://aixwang.dev/', users: 1 }, { ...d, users: 4 }, { ...d, screen_resolution: '800x600', users: 6 },
  ]), [{ channel: 'Facebook', users: 2 }, { channel: '站內換頁', users: 1 }, { channel: '其他', users: 4, details: [{ name: '查不出來源', users: 4 }] }, { channel: '疑似自動程式', users: 6 }]);
});
test('buildTrafficSourceRows：細分後依「分類＋進站頁」合併，source_key 不重複', () => {
  const rows = buildTrafficSourceRows({ syncedAt: 'x', gaRows: [
    { ...direct({ landing_page: '/about/?fbclid=1' }), campaign: '(direct)', sessions: 2, views: 3 },
    { ...direct({ landing_page: '/about/?fbclid=2' }), campaign: '(direct)', sessions: 1, views: 1 },
    { ...direct({ landing_page: '/about/' }), campaign: '(direct)', sessions: 4, views: 4 },
    { ...direct({ landing_page: '/about/', country: 'Japan' }), campaign: '(direct)', sessions: 1, views: 2 },
    { ...direct({ landing_page: '/about/', page_referrer: 'https://aixwang.dev/' }), campaign: '(direct)', sessions: 3, views: 3 },
    { source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/about/', sessions: 9, views: 9 },
    { source: 'line', medium: 'social', campaign: 'article_share', landing_page: '/about/', sessions: 2, views: 2 },
  ] });
  const by = Object.fromEntries(rows.map((r) => [r.channel, r]));
  assert.equal(rows.length, 5); assert.equal(new Set(rows.map((r) => r.source_key)).size, 5);
  assert.equal(by['Facebook'].sessions, 3); assert.equal(by['Facebook'].landing_page, '/about/');
  assert.equal(by['其他'].sessions, 5); assert.equal(by['其他'].views, 6); assert.equal(by['其他'].channel_detail, '查不出來源'); assert.equal(by['Google 搜尋'].channel_detail, '');
  assert.equal(by['站內換頁'].sessions, 3); assert.equal(by['Google 搜尋'].sessions, 9); assert.equal(by['LINE'].sessions, 2);
});
test('parseGa4SourceRows／parseGa4DirectVisitRows／parseGa4ReferrerRows／parseGa4TodaySourceRows 解析', () => {
  const mk = (dims, mets) => ({ rows: [{ dimensionValues: dims.map((value) => ({ value })), metricValues: mets.map((value) => ({ value })) }] });
  assert.deepEqual(parseGa4SourceRows(mk(['google', 'organic', '(organic)', '/a/'], ['3', '5'])), [{ source: 'google', medium: 'organic', campaign: '(organic)', landing_page: '/a/', sessions: 3, views: 5 }]);
  assert.deepEqual(parseGa4DirectVisitRows(mk(['/a/', 'Chrome', 'new', '1x1', 'Taiwan'], ['2', '3', '1', '40'])), [{ source: '(direct)', medium: '(none)', campaign: '(direct)', landing_page: '/a/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1x1', country: 'Taiwan', sessions: 2, views: 3, engaged_sessions: 1, engagement_seconds: 40 }]);
  assert.deepEqual(parseGa4ReferrerRows(mk(['/a/', 'Chrome', 'new', '1x1', 'Taiwan', 'https://aixwang.dev/'], ['2'])), [{ landing_page: '/a/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1x1', country: 'Taiwan', page_referrer: 'https://aixwang.dev/', count: 2 }]);
  assert.deepEqual(parseGa4TodaySourceRows(mk(['google', 'organic', '/', 'Chrome', 'new', '1x1', 'Taiwan'], ['12', '10', '99'])), [{ source: 'google', medium: 'organic', landing_page: '/', browser: 'Chrome', new_vs_returning: 'new', screen_resolution: '1x1', country: 'Taiwan', users: 12, engaged_sessions: 10, engagement_seconds: 99 }]);
  assert.deepEqual(parseGa4TodaySourceRows(undefined), []);
});
test('attachSessionStartReferrers：以進站 referrer 切分，總數不變（不重複計算）', () => {
  const base = direct({ sessions: 5, views: 8 });
  const ref = (page_referrer, count) => ({ landing_page: base.landing_page, screen_resolution: '1920x1080', country: 'Taiwan', page_referrer, count });
  const out = attachSessionStartReferrers([base, { source: 'google', medium: 'organic', landing_page: '/x/', sessions: 7, views: 7 }], [ref('', 4), ref('https://aixwang.dev/blog/', 1)]);
  assert.equal(out.reduce((s, r) => s + r.sessions, 0), 12); assert.equal(out.reduce((s, r) => s + r.views, 0), 15);
  assert.equal(out.find((r) => r.page_referrer.startsWith('https://aixwang.dev')).sessions, 1);
  assert.equal(out.find((r) => r.source === 'google').page_referrer, '');
  assert.deepEqual(attachSessionStartReferrers([base], []).map((r) => [r.page_referrer, r.sessions]), [['', 5]]);
  assert.equal(attachSessionStartReferrers([base], [ref('', 9)]).reduce((s, r) => s + r.sessions, 0), 5);
  const today = attachSessionStartReferrers([{ ...direct(), users: 3 }], [ref('https://aixwang.dev/', 1), ref('', 2)], ['users']);
  assert.deepEqual(today.map((r) => r.users).sort(), [1, 2]);
});
test('「其他」細項：搜尋引擎、YouTube、推薦網域、direct 的 App 內建瀏覽器／回訪讀者／查不出來源', () => {
  const d = (visit) => classifyVisitDetail(visit);
  assert.deepEqual(d({ source: 'bing', medium: 'organic' }), { channel: '其他', detail: 'Bing 搜尋' });
  assert.deepEqual(d({ source: 'tw.search.yahoo.com', medium: 'referral' }), { channel: '其他', detail: 'Yahoo 搜尋' });
  assert.deepEqual(d({ source: 'cn.bing.com', medium: 'referral' }), { channel: '其他', detail: 'Bing 搜尋' });
  assert.deepEqual(d({ source: 'yahoo', medium: 'organic' }), { channel: '其他', detail: 'Yahoo 搜尋' });
  assert.deepEqual(d({ source: 'm.youtube.com', medium: 'referral' }), { channel: '其他', detail: 'YouTube' });
  assert.deepEqual(d({ source: 'example.com', medium: 'referral' }), { channel: '其他', detail: 'example.com' });
  assert.deepEqual(d({ source: '(not set)', medium: '(not set)' }), { channel: '其他', detail: '查不出來源' });
  assert.deepEqual(d({ source: 'newsletter', medium: 'email' }), { channel: '其他', detail: 'newsletter / email' });
  assert.deepEqual(d(direct({ browser: 'Safari (in-app)', new_vs_returning: 'returning' })), { channel: '其他', detail: 'App 內建瀏覽器' });
  assert.deepEqual(d(direct({ browser: 'Android Webview' })), { channel: '其他', detail: 'App 內建瀏覽器' });
  assert.deepEqual(d(direct({ new_vs_returning: 'returning' })), { channel: '其他', detail: '回訪讀者' });
  assert.deepEqual(d(direct()), { channel: '其他', detail: '查不出來源' });
  assert.deepEqual(d({ source: 'google', medium: 'organic' }), { channel: 'Google 搜尋', detail: '' });
  assert.deepEqual(d(direct({ landing_page: '/?fbclid=1' })), { channel: 'Facebook', detail: '' });
});
test('buildTodaySources：「其他」帶細項，依人數降冪；其他分類不帶 details', () => {
  const d = { source: '(direct)', medium: '(none)', landing_page: '/', engaged_sessions: 1, engagement_seconds: 5 };
  const result = buildTodaySources([
    { source: 'bing', medium: 'organic', users: 2 }, { ...d, browser: 'Safari (in-app)', users: 3 }, { ...d, new_vs_returning: 'returning', users: 1 },
    { ...d, users: 3 }, { source: 'google', medium: 'organic', users: 9 },
  ]);
  assert.deepEqual(result[0], { channel: 'Google 搜尋', users: 9 });
  assert.deepEqual(result[1], { channel: '其他', users: 9, details: [{ name: '查不出來源', users: 3 }, { name: 'App 內建瀏覽器', users: 3 }, { name: 'Bing 搜尋', users: 2 }, { name: '回訪讀者', users: 1 }] });
});
