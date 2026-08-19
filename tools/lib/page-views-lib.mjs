import { computeAvgEngagementSeconds, normalizeGa4Path } from './ga4-views-lib.mjs';

const CURRENT_PAGES = new Map([
  ['/', '首頁'],
  ['/blog/', '文章列表'],
  ['/about/', '關於我'],
  ['/course/', 'AI 新手教學課程'],
  ['/services/ai-tutor/', 'AI 新手教學課程'],
  ['/services/one-on-one/', '一對一 AI 教學'],
  ['/services/speaking/', '演講邀約'],
  ['/resources/', '免費資源'],
  ['/faq/', '常見問題'],
  ['/privacy/', '隱私權政策'],
  ['/disclaimer/', '免責聲明'],
]);

const SYSTEM_PATHS = new Set(['/favicon.ico/', '/index.php/']);

export function aggregateViewsByPath(rows) {
  const result = new Map();
  for (const row of rows ?? []) {
    const normalized = normalizeGa4Path(row?.path);
    if (!normalized) continue;
    const views = Number(row?.views ?? 0);
    if (!Number.isFinite(views)) continue;
    result.set(normalized, (result.get(normalized) ?? 0) + views);
  }
  return result;
}

/**
 * 依正規化後路徑加總近 30 天平均停留秒數的原始資料（duration=userEngagementDuration 累積秒數、
 * users=activeUsers）。跟 aggregateViewsByPath 一樣不在這裡先算平均，先加總完再由
 * buildPageViewRows 呼叫 computeAvgEngagementSeconds 換算，避免直接加總「已經算好的平均值」。
 */
export function aggregateEngagementByPath(rows) {
  const result = new Map();
  for (const row of rows ?? []) {
    const normalized = normalizeGa4Path(row?.path);
    if (!normalized) continue;
    const duration = Number(row?.duration ?? 0);
    const users = Number(row?.users ?? 0);
    if (!Number.isFinite(duration) || !Number.isFinite(users)) continue;
    const current = result.get(normalized) ?? { duration: 0, users: 0 };
    result.set(normalized, { duration: current.duration + duration, users: current.users + users });
  }
  return result;
}

export function classifyPath(path, articleTitles = new Map()) {
  if (CURRENT_PAGES.has(path)) {
    return { name: CURRENT_PAGES.get(path), content_type: '頁面', is_current: true };
  }

  const blogMatch = path.match(/^\/blog\/([^/]+)\/$/);
  if (blogMatch) {
    const slug = blogMatch[1];
    return {
      name: articleTitles.get(slug) ?? slug,
      content_type: articleTitles.has(slug) ? '文章' : '舊文章／未收錄文章',
      is_current: articleTitles.has(slug),
    };
  }

  if (SYSTEM_PATHS.has(path) || path.startsWith('/wp-')) {
    return { name: path, content_type: '系統／其他', is_current: false };
  }

  const fallback = path === '/' ? '首頁' : path.split('/').filter(Boolean).at(-1) ?? path;
  return { name: fallback, content_type: '舊站頁面', is_current: false };
}

export function buildPageViewRows({ totalRows, last30dRows, articleTitles = new Map(), syncedAt }) {
  const total = aggregateViewsByPath(totalRows);
  const recent = aggregateViewsByPath(last30dRows);
  // 平均停留秒數只做近 30 天滾動值，資料來源沿用 last30dRows（同一次 GA4 查詢，
  // duration/users 是額外欄位，不用多打一次 API），不做全期間累積平均。
  const engagement = aggregateEngagementByPath(last30dRows);
  const paths = new Set([...total.keys(), ...recent.keys()]);

  return [...paths]
    .map((path) => {
      const eng = engagement.get(path);
      return {
        path,
        ...classifyPath(path, articleTitles),
        views: total.get(path) ?? 0,
        views_30d: recent.get(path) ?? 0,
        // 沒有互動資料（eng 不存在，或 users=0）回傳 null，不是 0——0 秒代表「有使用者但平均只待 0 秒」，
        // 語意上跟「這次沒有互動資料」不同。
        avg_engagement_seconds_30d: eng ? computeAvgEngagementSeconds(eng.duration, eng.users) : null,
        views_synced_at: syncedAt,
      };
    })
    // 單篇文章已由 articles 的觀看表格呈現；page_views 只保留一般站內頁面，避免重複統計。
    // /blog/ 列表頁在 CURRENT_PAGES 中，content_type 是「頁面」，仍會保留。
    .filter((row) => row.is_current && row.content_type === '頁面')
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));
}
