import { createHash } from 'node:crypto';
import { classifyPath } from './page-views-lib.mjs';
import { normalizeGa4Path } from './ga4-views-lib.mjs';

/** 一般造訪（medium 不是 (none)）：維度 [sessionSource, sessionMedium, sessionCampaignName, landingPagePlusQueryString]，指標 [sessions, screenPageViews]。 */
export function parseGa4SourceRows(response) {
  return (response?.rows ?? []).map((row) => ({
    source: row?.dimensionValues?.[0]?.value ?? '', medium: row?.dimensionValues?.[1]?.value ?? '',
    campaign: row?.dimensionValues?.[2]?.value ?? '', landing_page: row?.dimensionValues?.[3]?.value ?? '',
    sessions: Number(row?.metricValues?.[0]?.value ?? 0), views: Number(row?.metricValues?.[1]?.value ?? 0),
  }));
}

const DIRECT_KEY_FIELDS = ['landing_page', 'browser', 'new_vs_returning', 'screen_resolution', 'country'];

/**
 * 直接造訪（medium 是 (none)）：維度順序見 DIRECT_VISIT_DIMENSIONS，指標見 DIRECT_VISIT_METRICS。
 * source、medium、campaign 在直接造訪恆為 (direct)、(none)、(direct)，查詢不帶這幾個維度，在這裡補上。
 * page_referrer 不在這個查詢裡（原因見 attachSessionStartReferrers），由後者補上。
 */
export function parseGa4DirectVisitRows(response) {
  return (response?.rows ?? []).map((row) => {
    const d = (i) => row?.dimensionValues?.[i]?.value ?? '';
    const m = (i) => Number(row?.metricValues?.[i]?.value ?? 0);
    return {
      source: '(direct)', medium: '(none)', campaign: '(direct)',
      landing_page: d(0), browser: d(1), new_vs_returning: d(2), screen_resolution: d(3), country: d(4),
      sessions: m(0), views: m(1), engaged_sessions: m(2), engagement_seconds: m(3),
    };
  });
}

/** 「進站事件（session_start）的 pageReferrer」查詢：維度 DIRECT_VISIT_DIMENSIONS＋pageReferrer，指標只有一個計數。 */
export function parseGa4ReferrerRows(response) {
  return (response?.rows ?? []).map((row) => {
    const d = (i) => row?.dimensionValues?.[i]?.value ?? '';
    return {
      landing_page: d(0), browser: d(1), new_vs_returning: d(2), screen_resolution: d(3), country: d(4),
      page_referrer: d(5), count: Number(row?.metricValues?.[0]?.value ?? 0),
    };
  });
}

/** 最大餘數法把整數 total 依權重分給各格，總和一定等於 total。 */
function allocate(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map((_, i) => (i === 0 ? total : 0));
  const raw = weights.map((w) => (total * w) / sum);
  const result = raw.map(Math.floor);
  let left = total - result.reduce((a, b) => a + b, 0);
  [...raw.keys()].sort((x, y) => (raw[y] - result[y]) - (raw[x] - result[x]) || x - y).forEach((i) => { if (left > 0) { result[i] += 1; left -= 1; } });
  return result;
}

/**
 * 把「進站頁面的 referrer」補到直接造訪的列上。
 *
 * 為什麼不直接在同一個查詢加 pageReferrer 維度：pageReferrer 是事件層級，一次造訪看了兩頁，
 * 第二頁的 referrer 就是本站，同一次造訪會同時出現在「空 referrer」與「本站」兩列，造訪次數被重複計算
 * （實測直接造訪 450 次，加維度後變 553 次）。所以另用只含 session_start 事件的查詢取得每次造訪
 * 「進站那一頁」的 referrer（一次造訪只有一個 session_start），再依其餘維度（landing、browser、
 * newVsReturning、screenResolution、country）對應回去，並把 sessions／views 等計數欄位（countFields）依比例分配，
 * 其他欄位（互動指標）原樣複製。找不到對應的造訪視為 referrer 空白。非 direct 的列不動。
 */
export function attachSessionStartReferrers(rows, referrerRows, countFields = ['sessions', 'views']) {
  const keyOf = (r) => DIRECT_KEY_FIELDS.map((f) => r[f] ?? '').join('\u0001');
  const cellsByKey = new Map();
  for (const r of referrerRows ?? []) {
    if (!(r.count > 0)) continue;
    const key = keyOf(r); const list = cellsByKey.get(key) ?? [];
    list.push({ referrer: r.page_referrer, count: r.count }); cellsByKey.set(key, list);
  }
  const out = [];
  for (const row of rows ?? []) {
    if (!isDirectVisit(row.source, row.medium)) { out.push({ ...row, page_referrer: '' }); continue; }
    const cells = [...(cellsByKey.get(keyOf(row)) ?? [])];
    const principal = Number(row[countFields[0]] ?? 0);
    const known = cells.reduce((a, c) => a + c.count, 0);
    if (known < principal) cells.push({ referrer: '', count: principal - known });
    if (cells.length === 0) { out.push({ ...row, page_referrer: '' }); continue; }
    const shares = Object.fromEntries(countFields.map((f) => [f, allocate(Number(row[f] ?? 0), cells.map((c) => c.count))]));
    cells.forEach((cell, i) => {
      const split = { ...row, page_referrer: cell.referrer };
      for (const f of countFields) split[f] = shares[f][i];
      out.push(split);
    });
  }
  return out;
}

/**
 * GA4 單次查詢最多 9 個維度，而且 dimensionFilter 用到的欄位（本站 hostName 一定要）也算在內，
 * 所以入口資料拆成幾次查詢再合併（本機腳本與 Worker 共用這份定義，避免兩邊漂移）：
 * 1. 一般造訪（medium 不是 (none)）：4 個維度；
 * 2. 直接造訪：多帶 browser、newVsReturning、screenResolution、country 判斷去處；
 * 3. 直接造訪的 session_start referrer：見 attachSessionStartReferrers。
 */
export const MEDIUM_NONE_FILTER = { filter: { fieldName: 'sessionMedium', stringFilter: { matchType: 'EXACT', value: '(none)' } } };
export const NON_DIRECT_FILTER = { notExpression: MEDIUM_NONE_FILTER };
export const SESSION_START_FILTER = { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'session_start' } } };
export const TRAFFIC_SOURCE_DIMENSIONS = ['sessionSource', 'sessionMedium', 'sessionCampaignName', 'landingPagePlusQueryString'];
export const TRAFFIC_SOURCE_METRICS = ['sessions', 'screenPageViews'];
export const DIRECT_VISIT_DIMENSIONS = ['landingPagePlusQueryString', 'browser', 'newVsReturning', 'screenResolution', 'country'];
export const DIRECT_VISIT_METRICS = ['sessions', 'screenPageViews', 'engagedSessions', 'userEngagementDuration'];
export const REFERRER_DIMENSIONS = [...DIRECT_VISIT_DIMENSIONS, 'pageReferrer'];
export const REFERRER_METRICS = ['sessions'];

/** 「今日入口」：所有入口一次查（hostName 篩選＋7 個維度），直接造訪的 referrer 另查（TODAY_REFERRER_METRICS）。指標用 activeUsers，與卡片「今日活躍」同一指標。 */
export const TODAY_SOURCE_DIMENSIONS = ['sessionSource', 'sessionMedium', ...DIRECT_VISIT_DIMENSIONS];
export const TODAY_SOURCE_METRICS = ['activeUsers', 'engagedSessions', 'userEngagementDuration'];
export const TODAY_REFERRER_METRICS = ['activeUsers'];

/**
 * 入口分類共 13 類（指定的 11 類，加上原本就獨立的 YouTube、LINE）。排序分三段：
 * 1. EXTERNAL_CHANNELS：明確的外部來源，依人數／造訪次數多到少；
 * 2. DERIVED_CHANNELS：原本被 GA4 歸成 direct 的造訪，用其他維度推論出的去處，依人數多到少；
 * 3. TAIL_CHANNELS：固定排最後，順序固定「其他」「疑似自動程式」「不明」。
 */
export const EXTERNAL_CHANNELS = ['Google 搜尋', 'Facebook', 'Threads', 'Instagram', 'AI 搜尋', 'YouTube', 'LINE'];
export const DERIVED_CHANNELS = ['回訪讀者', 'App 內建瀏覽器', '站內換頁'];
export const TAIL_CHANNELS = ['其他', '疑似自動程式', '不明'];
export const CHANNELS = [...EXTERNAL_CHANNELS, ...DERIVED_CHANNELS, ...TAIL_CHANNELS];

/**
 * 依固定規則排列。items 為 [{ channel, [countKey] }]；沒有資料的分類不補 0 列。
 * 未列名的分類視同外部來源，避免新增分類時被藏起來。
 */
export function sortChannelsForDisplay(items, countKey = 'sessions') {
  const count = (item) => Number(item[countKey] ?? 0);
  const rank = (name) => (DERIVED_CHANNELS.includes(name) ? 1 : TAIL_CHANNELS.includes(name) ? 2 : 0);
  return [...items].sort((a, b) => {
    const ra = rank(a.channel); const rb = rank(b.channel);
    if (ra !== rb) return ra - rb;
    if (ra === 2) return TAIL_CHANNELS.indexOf(a.channel) - TAIL_CHANNELS.indexOf(b.channel);
    return count(b) - count(a) || CHANNELS.indexOf(a.channel) - CHANNELS.indexOf(b.channel);
  });
}

/** GA4 是否把這次造訪歸成「直接」（沒有任何來源資訊）。 */
export function isDirectVisit(source, medium) {
  return String(source ?? '').toLowerCase() === '(direct)' || String(medium ?? '').toLowerCase() === '(none)';
}

/**
 * 只靠 source／medium 的分類。原本歸 direct 的回傳「不明」；
 * 完整判斷（含 fbclid、瀏覽器等）請用 classifyVisit。
 */
export function classifySource(source, medium) {
  const s = String(source ?? '').toLowerCase(); const m = String(medium ?? '').toLowerCase();
  if (m === 'ai-assistant' || ['chatgpt', 'openai', 'perplexity', 'claude', 'anthropic', 'gemini', 'bard.google', 'copilot'].some((k) => s.includes(k))) return 'AI 搜尋';
  if (s.includes('threads')) return 'Threads';
  if (s === 'ig' || s.includes('instagram')) return 'Instagram';
  if (s.includes('facebook') || s === 'fb') return 'Facebook';
  if (s.includes('youtube') || s === 'yt' || s === 'youtu.be') return 'YouTube';
  // 發文連結加 utm_source=line 時 GA4 的 source 就是 line（見 docs/utm-tracking.md）。
  if (s === 'line' || s.includes('line.me') || s.includes('liff') || s.includes('line.naver')) return 'LINE';
  // google / organic 同時包含一般搜尋結果與 AI Overview 點擊，GA4 無法拆開；
  // 標籤只寫「Google 搜尋」，避免被誤讀成 AI 引用流量。明確的 AI 搜尋來源在上面另列。
  if (s === 'google' && m === 'organic') return 'Google 搜尋';
  if (isDirectVisit(source, medium)) return '不明';
  return '其他';
}

const IN_APP_BROWSERS = ['safari (in-app)', 'android webview'];
const SITE_HOST = 'aixwang.dev';

function urlHost(value) {
  try { return new URL(String(value)).hostname.toLowerCase(); } catch { return ''; }
}

/** 網址（含查詢字串）是否帶 fbclid 參數。 */
export function hasFbclid(landingPage) {
  return /[?&]fbclid=/i.test(String(landingPage ?? ''));
}

/**
 * 疑似自動程式（推論，非 GA4 官方標記；依據是開站以來 direct 造訪的觀察）：
 * 螢幕解析度 800x600（真人裝置幾乎不會有，常見於無頭瀏覽器預設值），
 * 或國家為 United States 且整列造訪都沒有互動（engagedSessions 0 且停留 0 秒）。
 * 本站讀者在台灣，美國來源且零互動的直接造訪多半是爬蟲或掃描。
 */
export function isSuspectedBot(visit) {
  if (String(visit.screen_resolution ?? '').replace(/\s/g, '').toLowerCase() === '800x600') return true;
  return visit.country === 'United States' && Number(visit.engaged_sessions ?? 0) === 0 && Number(visit.engagement_seconds ?? 0) === 0;
}

/**
 * 完整入口分類。visit 欄位：source、medium、landing_page（原始、含查詢字串）、browser、
 * new_vs_returning、page_referrer、screen_resolution、country、engaged_sessions、engagement_seconds。
 *
 * 只有 GA4 原本歸 direct 的造訪才會往下細分，非 direct 一律維持 classifySource 的結果。
 * 細分的優先順序（由「最確定、最具體」到「最弱」）：
 * 1. fbclid → Facebook：網址帶 fbclid 是 Meta 在點擊當下加的，直接證明是從 Meta 系產品（含 IG、Threads）點出，證據最硬。
 * 2. 疑似自動程式：不是真人就不該被算進任何讀者去處，所以排在「站內換頁、App、回訪」之前，
 *    否則爬蟲的內部換頁或固定瀏覽器會被誤算成讀者行為。
 * 3. 站內換頁：pageReferrer 是本站，代表這次造訪其實是站內點擊（例如工作階段逾時後重算）。
 * 4. App 內建瀏覽器：Safari (in-app)／Android Webview，通常是 LINE、FB、IG 等 App 點開連結而沒帶 referrer。
 * 5. 回訪讀者：newVsReturning=returning。它描述的是「人」而不是「從哪來」，資訊最弱，所以排最後。
 * 6. 其餘 → 不明。
 */
export function classifyVisit(visit) {
  const base = classifySource(visit.source, visit.medium);
  if (!isDirectVisit(visit.source, visit.medium)) return base;
  if (hasFbclid(visit.landing_page)) return 'Facebook';
  if (isSuspectedBot(visit)) return '疑似自動程式';
  const refHost = urlHost(visit.page_referrer);
  if (refHost === SITE_HOST || refHost.endsWith(`.${SITE_HOST}`)) return '站內換頁';
  if (IN_APP_BROWSERS.includes(String(visit.browser ?? '').toLowerCase())) return 'App 內建瀏覽器';
  if (String(visit.new_vs_returning ?? '').toLowerCase() === 'returning') return '回訪讀者';
  return '不明';
}

export function buildTrafficSourceRows({ gaRows, articleTitles = new Map(), syncedAt }) {
  const grouped = new Map();
  for (const row of gaRows ?? []) {
    const landing = normalizeGa4Path(row.landing_page);
    if (!landing) continue;
    const classification = classifyPath(landing, articleTitles);
    if (!classification.is_current || !['頁面', '文章'].includes(classification.content_type)) continue;
    const channel = classifyVisit(row);
    const campaign = row.campaign || '(not set)';
    // 多出來的判斷用維度（browser、referrer 等）分類後就彙總掉，列的粒度維持「分類＋進站頁＋source/medium/campaign」。
    const rawKey = [channel, row.source, row.medium, campaign, landing].join('|');
    const source_key = createHash('sha256').update(rawKey).digest('hex');
    const current = grouped.get(source_key) ?? { source_key, channel, source: row.source, medium: row.medium, campaign, landing_page: landing, sessions: 0, views: 0, views_synced_at: syncedAt };
    current.sessions += Number(row.sessions ?? 0); current.views += Number(row.views ?? 0); grouped.set(source_key, current);
  }
  return [...grouped.values()].sort((a, b) => b.sessions - a.sessions || b.views - a.views);
}

/** 解析「今日入口」查詢：維度順序見 TODAY_SOURCE_DIMENSIONS，指標見 TODAY_SOURCE_METRICS；referrer 之後由 attachSessionStartReferrers 補（countFields 用 ['users']）。 */
export function parseGa4TodaySourceRows(response) {
  return (response?.rows ?? []).map((row) => {
    const d = (i) => row?.dimensionValues?.[i]?.value ?? '';
    const m = (i) => Number(row?.metricValues?.[i]?.value ?? 0);
    return {
      source: d(0), medium: d(1), landing_page: d(2), browser: d(3), new_vs_returning: d(4), screen_resolution: d(5), country: d(6),
      users: m(0), engaged_sessions: m(1), engagement_seconds: m(2),
    };
  });
}

/**
 * 依 classifyVisit 歸類並加總，回傳 [{ channel, users }]，順序同 sortChannelsForDisplay。
 * 同一人若今天從兩個入口進站會各算一次，所以加總可能大於「今日活躍」。
 */
export function buildTodaySources(rows, limit = 20) {
  const byChannel = new Map();
  for (const row of rows ?? []) {
    const users = Number(row.users ?? 0);
    if (!Number.isFinite(users) || users <= 0) continue;
    const channel = classifyVisit(row);
    byChannel.set(channel, (byChannel.get(channel) ?? 0) + users);
  }
  return sortChannelsForDisplay([...byChannel.entries()].map(([channel, users]) => ({ channel, users })), 'users').slice(0, limit);
}
