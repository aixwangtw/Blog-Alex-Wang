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

export function classifySource(source, medium) {
  const s = String(source).toLowerCase(); const m = String(medium).toLowerCase();
  if ((s === 'ig' || s.includes('instagram')) && m.includes('comment')) return 'Instagram 留言';
  if (s.includes('youtube') && (m.includes('description') || m.includes('info'))) return 'YouTube 資訊欄';
  if (s.includes('chatgpt') || s.includes('openai')) return 'ChatGPT';
  if (s.includes('perplexity')) return 'Perplexity';
  if (s.includes('claude') || s.includes('anthropic')) return 'Claude';
  if (s.includes('gemini') || s.includes('bard.google')) return 'Gemini';
  if (s.includes('copilot')) return 'Microsoft Copilot';
  if (s.includes('threads')) return 'Threads';
  if (s === 'ig' || s.includes('instagram')) return 'Instagram';
  if (/(^|\.)facebook\.com$/.test(s) || s === 'fb') return 'Facebook';
  if (/(^|\.)line\.me$/.test(s) || s === 'line' || s.includes('liff.line')) return 'LINE';
  if (s.includes('youtube') || s.includes('youtu.be')) return 'YouTube';
  // Google AI Overview 在 GA4 仍歸 google / organic，無法和一般自然搜尋可靠拆分。
  if (s === 'google' && m === 'organic') return 'Google 搜尋／AI Overview';
  if (s === 'bing' && m === 'organic') return 'Bing 搜尋';
  if (s.includes('yahoo') && (m === 'organic' || m === 'referral')) return 'Yahoo 搜尋';
  if (s === '(direct)' || m === '(none)') return '直接進入';
  if (m === 'organic') return `${source} 搜尋`;
  if (m === 'referral') return `${source} 推薦連結`;
  return source || '其他';
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
