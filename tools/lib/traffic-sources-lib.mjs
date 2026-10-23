import { createHash } from 'node:crypto';
import { classifyPath } from './page-views-lib.mjs';
import { normalizeGa4Path } from './ga4-views-lib.mjs';

export function parseGa4SourceRows(response) {
  return (response?.rows ?? []).map((row) => ({
    source: row?.dimensionValues?.[0]?.value ?? '', medium: row?.dimensionValues?.[1]?.value ?? '',
    campaign: row?.dimensionValues?.[2]?.value ?? '', landing_page: row?.dimensionValues?.[3]?.value ?? '',
    sessions: Number(row?.metricValues?.[0]?.value ?? 0), views: Number(row?.metricValues?.[1]?.value ?? 0),
  }));
}

/** 入口分類固定 7 類；Bing、Yahoo、推薦連結、LINE、YouTube 與任何未列者一律歸「其他」。 */
export const CHANNELS = ['Google 搜尋', 'Facebook', 'Threads', 'Instagram', 'AI 助理', '直接或不明來源', '其他'];

export function classifySource(source, medium) {
  const s = String(source ?? '').toLowerCase(); const m = String(medium ?? '').toLowerCase();
  if (m === 'ai-assistant' || ['chatgpt', 'openai', 'perplexity', 'claude', 'anthropic', 'gemini', 'bard.google', 'copilot'].some((k) => s.includes(k))) return 'AI 助理';
  if (s.includes('threads')) return 'Threads';
  if (s === 'ig' || s.includes('instagram')) return 'Instagram';
  if (s.includes('facebook') || s === 'fb') return 'Facebook';
  // google / organic 同時包含一般搜尋結果與 AI Overview 點擊，GA4 無法拆開；
  // 標籤只寫「Google 搜尋」，避免被誤讀成 AI 引用流量。明確的 AI 助理來源在上面另列。
  if (s === 'google' && m === 'organic') return 'Google 搜尋';
  // 這個分類混雜了真的直接輸入網址／書籤，跟從 App／通訊軟體點連結但沒帶
  // referrer 而被 GA4 判斷成查無來源的情況，兩者無法用 GA4 現有資料分開。
  if (s === '(direct)' || m === '(none)') return '直接或不明來源';
  return '其他';
}

export function buildTrafficSourceRows({ gaRows, articleTitles = new Map(), syncedAt }) {
  const grouped = new Map();
  for (const row of gaRows ?? []) {
    const landing = normalizeGa4Path(row.landing_page);
    if (!landing) continue;
    const classification = classifyPath(landing, articleTitles);
    if (!classification.is_current || !['頁面', '文章'].includes(classification.content_type)) continue;
    const channel = classifySource(row.source, row.medium);
    const campaign = row.campaign || '(not set)';
    const rawKey = [channel, row.source, row.medium, campaign, landing].join('|');
    const source_key = createHash('sha256').update(rawKey).digest('hex');
    const current = grouped.get(source_key) ?? { source_key, channel, source: row.source, medium: row.medium, campaign, landing_page: landing, sessions: 0, views: 0, views_synced_at: syncedAt };
    current.sessions += Number(row.sessions ?? 0); current.views += Number(row.views ?? 0); grouped.set(source_key, current);
  }
  return [...grouped.values()].sort((a, b) => b.sessions - a.sessions || b.views - a.views);
}

/** 解析「今日入口」查詢：維度 [sessionSource, sessionMedium]，指標 [activeUsers]。 */
export function parseGa4TodaySourceRows(response) {
  return (response?.rows ?? []).map((row) => ({
    source: row?.dimensionValues?.[0]?.value ?? '', medium: row?.dimensionValues?.[1]?.value ?? '',
    users: Number(row?.metricValues?.[0]?.value ?? 0),
  }));
}

/**
 * 依 classifySource 歸類並加總，回傳 [{ channel, users }]，人數多的在前（同數依名稱）。
 * 同一人若今天從兩個入口進站會各算一次，所以加總可能大於「今日活躍」。
 */
export function buildTodaySources(rows, limit = 20) {
  const byChannel = new Map();
  for (const row of rows ?? []) {
    const users = Number(row.users ?? 0);
    if (!Number.isFinite(users) || users <= 0) continue;
    const channel = classifySource(row.source, row.medium);
    byChannel.set(channel, (byChannel.get(channel) ?? 0) + users);
  }
  return [...byChannel.entries()]
    .map(([channel, users]) => ({ channel, users }))
    .sort((a, b) => b.users - a.users || a.channel.localeCompare(b.channel, 'zh-TW'))
    .slice(0, limit);
}
