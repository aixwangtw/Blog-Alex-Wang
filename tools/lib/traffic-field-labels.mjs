// 流量統計相關欄位的中文標題（meta.translations）與台灣時間顯示設定。
// 由 tools/localize-traffic-fields.mjs 套用；create-views-dashboard.mjs 也引用顯示設定，避免互相覆蓋。
// 顯示格式來源：Directus 11.17.4 後台 datetime display 的 format 選項接受 date-fns 格式字串（allowOther），
// timestamp 另有 tz 選項（IANA 時區）；date 欄位只有日期、不做時區轉換。

export const LANGUAGE = 'zh-TW';
export const TIME_ZONE = 'Asia/Taipei';

/** 日期時間（timestamp）：2026/10/22 20:17，台北時間。relative:false 是 table-view-panel 會直接讀的欄位。 */
export const TIMESTAMP_DISPLAY = {
  display: 'datetime',
  display_options: { relative: false, format: 'yyyy/MM/dd HH:mm', tz: TIME_ZONE },
};

/** 純日期（date）：2026/10/22。 */
export const DATE_DISPLAY = {
  display: 'datetime',
  display_options: { relative: false, format: 'yyyy/MM/dd' },
};

const SYNCED = { views_synced_at: ['最後同步時間', 'timestamp'] };

/** 欄位 → [中文標題, 顯示類型 'timestamp' | 'date' | 省略, 欄位說明（選填）]。 */
export const FIELD_LABELS = {
  articles: {
    title: ['標題'], status: ['狀態'],
    views: ['累積觀看'], views_30d: ['近 30 天觀看'], avg_engagement_seconds_30d: ['每人平均停留（秒）'],
    ...SYNCED,
  },
  page_views: {
    name: ['頁面名稱'], path: ['路徑'], content_type: ['內容類型'], is_current: ['目前頁面'],
    views: ['累積觀看'], views_30d: ['近 30 天觀看'], avg_engagement_seconds_30d: ['每人平均停留（秒）'],
    ...SYNCED,
  },
  daily_views: {
    date: ['日期', 'date'], total_views: ['總觀看'], article_views: ['文章觀看'], page_views: ['頁面觀看'],
    active_users: ['活躍使用者'], total_users: ['總使用者'],
    ...SYNCED,
  },
  daily_content_views: {
    date: ['日期', 'date'], content_type: ['內容類型'], name: ['標題／名稱'], views: ['觀看'],
    active_users: ['活躍使用者'], total_users: ['總使用者'], path: ['路徑'],
    ...SYNCED,
  },
  traffic_sources: {
    channel: ['入口分類', undefined, '入口分類，共 13 類。外部來源（依造訪次數多到少）：Google 搜尋、Facebook、Threads、Instagram、AI 搜尋、YouTube、LINE；接著是 GA4 查無來源時推論出去處的：回訪讀者、App 內建瀏覽器、站內換頁（依造訪次數多到少）；最後固定為其他、疑似自動程式、不明。「Facebook」含從 IG、Threads 點出、帶 fbclid 的連結。GA4 查無來源（直接）的造訪才會細分，判斷順序：網址帶 fbclid → Facebook；疑似自動程式（推論，非 GA4 官方標記：螢幕解析度 800x600，或美國來源且完全沒有互動）；進站頁的上一頁是本站 → 站內換頁；瀏覽器是 Safari (in-app) 或 Android Webview → App 內建瀏覽器；曾回訪的使用者 → 回訪讀者；其餘 → 不明。'], sessions: ['造訪次數', undefined, '造訪次數（GA4 工作階段數）。'], views: ['觀看'], source: ['來源'], medium: ['媒介'],
    campaign: ['活動'], landing_page: ['進站頁'],
    ...SYNCED,
  },
  audience_metrics: {
    total_users: ['總使用者'], active_users_30d: ['近 30 天活躍使用者'], active_users_today: ['今日活躍使用者'], today_sources: ['今日入口'],
    desktop_users: ['桌機使用者（累積）'], mobile_users: ['手機使用者（累積）'], tablet_users: ['平板使用者（累積）'], other_users: ['其他裝置使用者（累積）'],
    desktop_users_30d: ['桌機使用者（近 30 天）'], mobile_users_30d: ['手機使用者（近 30 天）'], tablet_users_30d: ['平板使用者（近 30 天）'], other_users_30d: ['其他裝置使用者（近 30 天）'],
    synced_at: ['最後同步時間', 'timestamp'],
  },
};

/** 只合併 zh-TW 翻譯，保留其他語言。 */
export function mergeTranslations(existing, label) {
  const others = (Array.isArray(existing) ? existing : []).filter((item) => item?.language !== LANGUAGE);
  return [...others, { language: LANGUAGE, translation: label }];
}

/** 組出要 PATCH 的 meta 片段（只含 translations 與 display 相關欄位）。 */
export function buildMetaPatch(currentMeta, [label, displayKind, note]) {
  const patch = { translations: mergeTranslations(currentMeta?.translations, label) };
  if (note) patch.note = note;
  const display = displayKind === 'timestamp' ? TIMESTAMP_DISPLAY : displayKind === 'date' ? DATE_DISPLAY : null;
  if (display) Object.assign(patch, { display: display.display, display_options: { ...display.display_options } });
  return patch;
}
