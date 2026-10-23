// 在 Directus Insights 建立摘要數字，並建立真正可排序的原生表格書籤。
// Insights 內建 list 不是表格，因此明細改由 Content 的 tabular layout 顯示。
//
// 用法：
//   node tools/create-views-dashboard.mjs
//   DIRECTUS_TOKEN=xxx node tools/create-views-dashboard.mjs --apply

const CMS = process.env.DIRECTUS_URL ?? 'https://cms.aixwang.dev';
const DASHBOARD_NAME = '流量統計';
const LEGACY_DASHBOARD_NAMES = ['互動數據分析'];
const TABLE_EXTENSION = {
  id: '41ca762d-e56a-4377-87c2-73ca6f77cca2',
  version: 'a4cd622d-0861-4ae5-8b39-7fc67bfa48c1',
  package: '@directus-labs/table-view-panel',
};
import { TIMESTAMP_DISPLAY } from './lib/traffic-field-labels.mjs';

const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 建立面板，必須設定 DIRECTUS_TOKEN。');
  process.exit(1);
}

const PANELS = [
  {
    name: '使用者', icon: 'groups', type: 'traffic-summary-card',
    note: '今日活躍／近 30 天活躍／總使用者（新站 2026-07-22 上線後去重）。今日活躍下方是今天前 3 名入口與人數，滑鼠移到那行看完整入口清單；移到其他地方看桌機、手機、平板的累積與近 30 天。',
    position_x: 1, position_y: 1, width: 24, height: 10,
    options: { kind: 'users', timezone: 'Asia/Taipei' },
  },
  {
    name: '文章觀看', icon: 'article', type: 'traffic-summary-card',
    note: '已發布文章的當日／近 30 天／累積觀看（不含草稿）。滑鼠移上去看近 30 天平均停留（userEngagementDuration ÷ activeUsers；沒有使用者資料的文章不計入）。',
    position_x: 25, position_y: 1, width: 18, height: 10,
    options: { kind: 'articles', timezone: 'Asia/Taipei' },
  },
  {
    name: '頁面觀看', icon: 'web', type: 'traffic-summary-card',
    note: '全部一般頁面的當日／近 30 天／累積觀看。滑鼠移上去看近 30 天平均停留。',
    position_x: 43, position_y: 1, width: 18, height: 10,
    options: { kind: 'pages', timezone: 'Asia/Taipei' },
  },
  {
    name: '文章觀看明細', icon: 'table_view', type: 'traffic-content-table',
    note: '每篇已發布文章一列（草稿不列）；「主要入口」是開站以來帶來最多造訪次數的入口與占比，滑鼠移上去看前 5 名；點欄位標題排序、拖拉標題右緣調整欄寬（記在這個瀏覽器），點一列展開逐日明細。',
    position_x: 1, position_y: 11, width: 60, height: 50,
    options: { kind: 'articles', timezone: 'Asia/Taipei' },
  },
  {
    name: '頁面觀看明細', icon: 'table_view', type: 'traffic-content-table',
    note: '每個一般頁面一列；「主要入口」是開站以來帶來最多造訪次數的入口與占比，滑鼠移上去看前 5 名；點欄位標題排序、拖拉標題右緣調整欄寬，點一列展開逐日明細。',
    position_x: 1, position_y: 97, width: 60, height: 40,
    options: { kind: 'pages', timezone: 'Asia/Taipei' },
  },
  {
    name: '熱門入口造訪次數', icon: 'bar_chart', type: 'bar-chart',
    note: '依入口分類加總造訪次數（分 7 類）；「Google 搜尋」含一般搜尋結果與 AI Overview 點擊，GA4 無法分開。',
    position_x: 1, position_y: 137, width: 60, height: 18,
    options: { collection: 'traffic_sources', xAxis: 'channel', yAxis: 'sessions', function: 'sum', horizontal: true, decimals: 0 },
  },
  {
    name: '流量入口與進站頁', icon: 'alt_route', type: 'traffic-source-table',
    note: '入口、進站頁、造訪次數、觀看次數；進站頁顯示中文標題，滑鼠移上去看網址路徑。預設依造訪次數排序，點欄位標題改排序、拖拉標題右緣調整欄寬（記在這個瀏覽器）。要區分 IG 留言、YouTube 資訊欄等位置，分享連結需帶 UTM。',
    position_x: 1, position_y: 155, width: 60, height: 30,
    options: {},
  },
  {
    name: '每日流量趨勢', icon: 'show_chart', type: 'time-series',
    note: '新站每日總觀看數；排除 StarJobTW 舊站與非現行路徑。當天數字尚未結算，可能持續增加。',
    position_x: 1, position_y: 61, width: 60, height: 18,
    options: { collection: 'daily_views', dateField: 'date', valueField: 'total_views', function: 'sum', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
  {
    name: '每日活躍使用者', icon: 'person_check', type: 'time-series',
    note: '每天至少有一次有參與互動的使用者；使用全站日期層級查詢，不會跨頁重複加總。',
    position_x: 1, position_y: 79, width: 60, height: 18,
    options: { collection: 'daily_views', dateField: 'date', valueField: 'active_users', function: 'sum', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
];

/**
 * 明細表高度：表頭＋每列約 34px，加面板標題與留白，格子 18px；展開逐日明細時在面板內捲動。
 * @param {number} rows
 * @returns {number}
 */
function tableHeight(rows) {
  return Math.min(50, Math.max(14, Math.ceil((34 * (rows + 1) + 80) / 18) + 2));
}

async function countRows(path) {
  const res = await fetch(`${CMS}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  return Number((await res.json()).data?.[0]?.count ?? 0) || null;
}

// 依目前已發布文章數與頁面數決定明細表高度，並讓後面的面板 y 連續排列。
const publishedArticles = token ? await countRows('/items/articles?filter[status][_eq]=published&aggregate[count]=*') : null;
const pageCount = token ? await countRows('/items/page_views?aggregate[count]=*') : null;
// 流量入口表一列＝一組（入口分類, 進站頁），數 groupBy 後的列數。
const sourceRowCount = token
  ? await fetch(`${CMS}/items/traffic_sources?aggregate[sum]=sessions&groupBy[]=channel,landing_page&limit=-1`, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => (res.ok ? res.json() : null)).then((json) => json?.data?.length || null).catch(() => null)
  : null;
for (const panel of PANELS) {
  if (panel.type === 'traffic-source-table') panel.height = tableHeight(sourceRowCount ?? 20);
  if (panel.type !== 'traffic-content-table') continue;
  panel.height = tableHeight(panel.options.kind === 'articles' ? (publishedArticles ?? 5) : (pageCount ?? 10));
}
let nextY = 1 + Math.max(...PANELS.filter((p) => p.position_y === 1).map((p) => p.height));
for (const panel of PANELS.filter((p) => p.position_y !== 1)) {
  panel.position_y = nextY;
  nextY += panel.height;
}

const OBSOLETE_PANEL_NAMES = [
  '熱門入口工作階段',
  '最後同步時間',
  '近 30 天熱門文章',
  '每篇文章觀看次數（累積／近 30 天）',
  '全站頁面累積觀看總數',
  '每日總使用者',
  '總使用者',
  '近 30 天活躍使用者',
  '當日活躍使用者',
  '桌機使用者',
  '手機使用者',
  '平板使用者',
  '桌機使用者（近 30 天）',
  '手機使用者（近 30 天）',
  '平板使用者（近 30 天）',
  '文章累積觀看總數',
  '文章近 30 天觀看總數',
  '文章平均停留秒數（近 30 天）',
  '所有文章觀看次數',
  '每篇文章每日流量',
  '新站上線後累積觀看總數',
  '全站頁面近 30 天觀看總數',
  '全站頁面平均停留秒數（近 30 天）',
  '所有頁面觀看次數',
  '每個頁面每日流量',
];

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

async function ensureTrafficPanelsExtension() {
  const installed = await request('/extensions', { headers: headers() });
  const found = installed.filter((extension) => extension.schema?.name === 'directus-extension-traffic-panels' && extension.meta?.enabled !== false);
  if (found.length === 0) {
    throw new Error('主機尚未安裝自訂擴充 directus-extension-traffic-panels（見 directus-extensions/traffic-panels/README.md），--apply 會建出空 panel，已中止。');
  }
  console.log(`已偵測到自訂擴充 directus-extension-traffic-panels。`);
}

// 時間欄位顯示成台灣寫法；設定值與標題中文化集中在 tools/lib/traffic-field-labels.mjs，
// 完整欄位清單用 tools/localize-traffic-fields.mjs 套用。這裡只確保儀表板直接用到的兩個同步時間欄位。
async function ensureSyncedAtDisplayOptions() {
  for (const collection of ['articles', 'page_views']) {
    const field = await request(`/fields/${collection}/views_synced_at`, { headers: headers() });
    if (JSON.stringify(field.meta?.display_options) === JSON.stringify(TIMESTAMP_DISPLAY.display_options) && field.meta?.display === TIMESTAMP_DISPLAY.display) continue;
    await request(`/fields/${collection}/views_synced_at`, {
      method: 'PATCH',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ meta: { ...TIMESTAMP_DISPLAY } }),
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
await ensureTrafficPanelsExtension();
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
