// 在 Directus Insights 建立摘要數字，並建立真正可排序的原生表格書籤。
// Insights 內建 list 不是表格，因此明細改由 Content 的 tabular layout 顯示。
//
// 用法：
//   node tools/create-views-dashboard.mjs
//   DIRECTUS_TOKEN=xxx node tools/create-views-dashboard.mjs --apply

const CMS = 'https://cms.aixwang.dev';
const DASHBOARD_NAME = '流量統計';
const LEGACY_DASHBOARD_NAMES = ['互動數據分析'];
const TABLE_EXTENSION = {
  id: '41ca762d-e56a-4377-87c2-73ca6f77cca2',
  version: 'a4cd622d-0861-4ae5-8b39-7fc67bfa48c1',
  package: '@directus-labs/table-view-panel',
};
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 建立面板，必須設定 DIRECTUS_TOKEN。');
  process.exit(1);
}

const PANELS = [
  {
    name: '總使用者', icon: 'groups', type: 'metric',
    note: '目前 Astro 新站自 2026-07-22 上線後的去重總使用者。',
    position_x: 1, position_y: 1, width: 20, height: 5,
    options: { collection: 'audience_metrics', field: 'total_users', function: 'sum' },
  },
  {
    name: '近 30 天活躍使用者', icon: 'calendar_month', type: 'metric',
    note: '最近 30 天區間內的去重活躍使用者，不是每日數字相加。',
    position_x: 21, position_y: 1, width: 20, height: 5,
    options: { collection: 'audience_metrics', field: 'active_users_30d', function: 'sum' },
  },
  {
    name: '當日活躍使用者', icon: 'person_check', type: 'metric',
    note: '依 GA4 Property 時區計算今天的活躍使用者；當天尚未結算，可能持續增加。',
    position_x: 41, position_y: 1, width: 20, height: 5,
    options: { collection: 'audience_metrics', field: 'active_users_today', function: 'sum' },
  },
  {
    name: '文章累積觀看總數', icon: 'visibility', type: 'metric',
    position_x: 1, position_y: 6, width: 20, height: 5,
    options: { collection: 'articles', field: 'views', function: 'sum' },
  },
  {
    name: '文章近 30 天觀看總數', icon: 'date_range', type: 'metric',
    position_x: 21, position_y: 6, width: 20, height: 5,
    options: { collection: 'articles', field: 'views_30d', function: 'sum' },
  },
  {
    name: '文章平均停留秒數（近 30 天）', icon: 'timer', type: 'metric',
    note: '公式：userEngagementDuration ÷ activeUsers（GA4「網頁和畫面」報表算法，不是除以瀏覽數）。沒有使用者資料的文章不計入平均。',
    position_x: 41, position_y: 6, width: 20, height: 5,
    options: { collection: 'articles', field: 'avg_engagement_seconds_30d', function: 'avg', maximumFractionDigits: 0, suffix: 's' },
  },
  {
    name: '每日流量趨勢', icon: 'show_chart', type: 'time-series',
    note: '新站每日總觀看數；排除 StarJobTW 舊站與非現行路徑。當天數字尚未結算，可能持續增加。',
    position_x: 1, position_y: 11, width: 60, height: 18,
    options: { collection: 'daily_views', dateField: 'date', valueField: 'total_views', function: 'sum', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
  {
    name: '每日活躍使用者', icon: 'person_check', type: 'time-series',
    note: '每天至少有一次參與工作階段的使用者；使用全站日期層級查詢，不會跨頁重複加總。',
    position_x: 1, position_y: 29, width: 60, height: 18,
    options: { collection: 'daily_views', dateField: 'date', valueField: 'active_users', function: 'sum', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
  {
    name: '所有文章觀看次數', icon: 'table_view', type: 'directus-panel-table',
    note: '直接列出所有文章；可點欄位標題排序，點擊資料列可開啟文章。',
    position_x: 1, position_y: 47, width: 60, height: 50,
    options: {
      collection: 'articles',
      fields: ['title', 'status', 'views', 'views_30d', 'avg_engagement_seconds_30d', 'views_synced_at'],
      sort_field: 'views',
      sort_direction: 'desc',
      limit: 100,
      filter: {},
    },
  },
  {
    name: '每篇文章每日流量', icon: 'calendar_view_day', type: 'directus-panel-table',
    note: '每篇文章每天的觀看數；可依名稱或路徑篩選單篇文章，只保存有觀看的日期。',
    position_x: 1, position_y: 99, width: 60, height: 45,
    options: {
      collection: 'daily_content_views',
      fields: ['name', 'date', 'views', 'active_users', 'total_users', 'path'],
      sort_field: 'date', sort_direction: 'desc', limit: 100,
      filter: { content_type: { _eq: '文章' } },
    },
  },
  {
    name: '新站上線後累積觀看總數', icon: 'language', type: 'metric',
    position_x: 1, position_y: 146, width: 20, height: 5,
    options: { collection: 'page_views', field: 'views', function: 'sum' },
  },
  {
    name: '全站頁面近 30 天觀看總數', icon: 'date_range', type: 'metric',
    position_x: 21, position_y: 146, width: 20, height: 5,
    options: { collection: 'page_views', field: 'views_30d', function: 'sum' },
  },
  {
    name: '全站頁面平均停留秒數（近 30 天）', icon: 'timer', type: 'metric',
    note: '公式：userEngagementDuration ÷ activeUsers（GA4「網頁和畫面」報表算法，不是除以瀏覽數）。沒有使用者資料的頁面不計入平均。',
    position_x: 41, position_y: 146, width: 20, height: 5,
    options: { collection: 'page_views', field: 'avg_engagement_seconds_30d', function: 'avg', maximumFractionDigits: 0, suffix: 's' },
  },
  {
    name: '所有頁面觀看次數', icon: 'table_view', type: 'directus-panel-table',
    note: '列出目前新站的一般頁面；單篇文章另列於文章表格，並排除 StarJobTW 舊站與非現行路徑。',
    position_x: 1, position_y: 151, width: 60, height: 50,
    options: {
      collection: 'page_views',
      fields: ['name', 'views', 'views_30d', 'avg_engagement_seconds_30d', 'path'],
      sort_field: 'views',
      sort_direction: 'desc',
      limit: 100,
      filter: {},
    },
  },
  {
    name: '每個頁面每日流量', icon: 'calendar_view_day', type: 'directus-panel-table',
    note: '每個一般頁面每天的觀看數；可依名稱或路徑篩選單一頁面，只保存有觀看的日期。',
    position_x: 1, position_y: 203, width: 60, height: 45,
    options: {
      collection: 'daily_content_views',
      fields: ['name', 'date', 'views', 'active_users', 'total_users', 'path'],
      sort_field: 'date', sort_direction: 'desc', limit: 100,
      filter: { content_type: { _eq: '頁面' } },
    },
  },
  {
    name: '熱門入口工作階段', icon: 'bar_chart', type: 'bar-chart',
    note: '依入口分類加總工作階段；Google 自然搜尋包含無法單獨辨識的 AI Overview。',
    position_x: 1, position_y: 250, width: 60, height: 18,
    options: { collection: 'traffic_sources', xAxis: 'channel', yAxis: 'sessions', function: 'sum', horizontal: true, decimals: 0 },
  },
  {
    name: '流量入口與進站頁', icon: 'alt_route', type: 'directus-panel-table',
    note: '依工作階段排序；要區分 IG 留言、YouTube 資訊欄等位置，分享連結需帶 UTM。',
    position_x: 1, position_y: 268, width: 60, height: 45,
    options: {
      collection: 'traffic_sources',
      fields: ['channel', 'sessions', 'views', 'medium', 'campaign', 'landing_page'],
      sort_field: 'sessions', sort_direction: 'desc', limit: 100, filter: {},
    },
  },
];

const OBSOLETE_PANEL_NAMES = ['最後同步時間', '近 30 天熱門文章', '每篇文章觀看次數（累積／近 30 天）', '全站頁面累積觀看總數', '每日總使用者'];

const TABLES = [
  {
    bookmark: '文章觀看次數表格', collection: 'articles', icon: 'article',
    fields: ['title', 'status', 'views', 'views_30d', 'avg_engagement_seconds_30d', 'views_synced_at'],
    widths: { title: 480, status: 120, views: 120, views_30d: 140, avg_engagement_seconds_30d: 160, views_synced_at: 200 },
  },
  {
    bookmark: '全站頁面觀看次數表格', collection: 'page_views', icon: 'table_view',
    fields: ['name', 'views', 'views_30d', 'avg_engagement_seconds_30d', 'path'],
    widths: { name: 320, views: 160, views_30d: 140, avg_engagement_seconds_30d: 160, path: 420 },
  },
  {
    bookmark: '文章每日流量表格', collection: 'daily_content_views', icon: 'article',
    fields: ['name', 'date', 'views', 'active_users', 'total_users', 'path'], sort: ['-date', '-views'],
    filter: { content_type: { _eq: '文章' } },
    widths: { name: 440, date: 160, views: 140, active_users: 160, total_users: 160, path: 420 },
  },
  {
    bookmark: '頁面每日流量表格', collection: 'daily_content_views', icon: 'web',
    fields: ['name', 'date', 'views', 'active_users', 'total_users', 'path'], sort: ['-date', '-views'],
    filter: { content_type: { _eq: '頁面' } },
    widths: { name: 360, date: 160, views: 140, active_users: 160, total_users: 160, path: 420 },
  },
];

const headers = () => ({ Authorization: `Bearer ${token}` });

async function request(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}：${text.slice(0, 300)}`);
  return text ? JSON.parse(text).data : null;
}

async function findDashboard() {
  for (const name of [DASHBOARD_NAME, ...LEGACY_DASHBOARD_NAMES]) {
    const data = await request(`/dashboards?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`, { headers: headers() });
    if (data[0]) return data[0];
  }
  return null;
}

async function renameDashboard(id) {
  return request(`/dashboards/${id}`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DASHBOARD_NAME }),
  });
}

async function createDashboard() {
  return request('/dashboards', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: DASHBOARD_NAME, icon: 'monitoring', note: 'GA4 文章觀看數總覽；資料由背景排程同步，不影響網站載入速度。' }),
  });
}

async function findPanel(dashboardId, name) {
  const data = await request(`/panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${encodeURIComponent(name)}&limit=1`, { headers: headers() });
  return data[0] ?? null;
}

async function createPanel(dashboardId, panel) {
  return request('/panels', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboard: dashboardId, show_header: true, ...panel }),
  });
}

async function updatePanel(panelId, dashboardId, panel) {
  return request(`/panels/${panelId}`, {
    method: 'PATCH',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ dashboard: dashboardId, show_header: true, ...panel }),
  });
}

async function deletePanel(panelId) {
  return request(`/panels/${panelId}`, {
    method: 'DELETE',
    headers: headers(),
  });
}

async function upsertTableBookmark(userId, table) {
  const query = `/presets?filter[user][_eq]=${userId}&filter[collection][_eq]=${table.collection}&filter[bookmark][_eq]=${encodeURIComponent(table.bookmark)}&limit=1`;
  const existing = (await request(query, { headers: headers() }))[0] ?? null;
  const payload = {
    bookmark: table.bookmark,
    user: userId,
    collection: table.collection,
    layout: 'tabular',
    filter: table.filter ?? null,
    layout_query: { tabular: { page: 1, sort: table.sort ?? ['-views'], fields: table.fields } },
    layout_options: { tabular: { widths: table.widths } },
    icon: table.icon,
  };
  if (existing) {
    await request(`/presets/${existing.id}`, { method: 'PATCH', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return existing.id;
  }
  const created = await request('/presets', { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  return created.id;
}

async function ensureTableExtension() {
  const installed = await request('/extensions', { headers: headers() });
  if (installed.some((extension) => extension.id === TABLE_EXTENSION.id && extension.meta?.enabled !== false)) {
    console.log(`沿用已安裝的 ${TABLE_EXTENSION.package}。`);
    return;
  }
  await request('/extensions/registry/install', {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ extension: TABLE_EXTENSION.id, version: TABLE_EXTENSION.version }),
  });
  console.log(`已安裝 ${TABLE_EXTENSION.package}。`);
}

async function ensureSyncedAtDisplayOptions() {
  for (const collection of ['articles', 'page_views']) {
    const field = await request(`/fields/${collection}/views_synced_at`, { headers: headers() });
    if (field.meta?.display === 'datetime' && field.meta?.display_options?.relative === false) continue;
    await request(`/fields/${collection}/views_synced_at`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta: { display: 'datetime', display_options: { relative: false, format: 'short', use24: true } },
      }),
    });
    console.log(`已補齊 ${collection}.views_synced_at 的日期顯示設定。`);
  }
}

console.log(`Dashboard：${DASHBOARD_NAME}`);
console.log(apply ? '模式：--apply' : '模式：dry-run');
for (const panel of PANELS) console.log(`- [${panel.type}] ${panel.name}`);

if (!apply) {
  console.log('\n這是 dry-run，沒有修改 CMS。');
  process.exit(0);
}

let dashboard = await findDashboard();
await ensureTableExtension();
await ensureSyncedAtDisplayOptions();
if (!dashboard) {
  dashboard = await createDashboard();
  console.log(`已建立 Dashboard「${DASHBOARD_NAME}」。`);
} else {
  if (dashboard.name !== DASHBOARD_NAME) {
    await renameDashboard(dashboard.id);
    console.log(`已將 Dashboard「${dashboard.name}」改名為「${DASHBOARD_NAME}」。`);
    dashboard.name = DASHBOARD_NAME;
  }
  console.log(`沿用 Dashboard「${DASHBOARD_NAME}」。`);
}

for (const panel of PANELS) {
  const existing = await findPanel(dashboard.id, panel.name);
  if (existing) {
    await updatePanel(existing.id, dashboard.id, panel);
    console.log(`已更新「${panel.name}」。`);
    continue;
  }
  await createPanel(dashboard.id, panel);
  console.log(`已建立「${panel.name}」。`);
}

for (const name of OBSOLETE_PANEL_NAMES) {
  const obsolete = await findPanel(dashboard.id, name);
  if (!obsolete) continue;
  await deletePanel(obsolete.id);
  console.log(`已移除舊面板「${name}」。`);
}

const currentUser = await request('/users/me?fields=id', { headers: headers() });
for (const table of TABLES) {
  const presetId = await upsertTableBookmark(currentUser.id, table);
  console.log(`已建立／更新「${table.bookmark}」：${CMS}/admin/content/${table.collection}?bookmark=${presetId}`);
}
