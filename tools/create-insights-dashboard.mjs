// 建立／更新 Directus Insights「文章產出與品質」dashboard（舊名「網站內容統計」，同一個 dashboard id，腳本會改名沿用）。
//
// 面板定義與版面在 tools/lib/insights-dashboard-lib.mjs（事實來源，有單元測試）。
// 資料由 tools/write-content-stats.mjs 每天寫入 content_stats／content_stats_history；
// 排程見 tools/daily-stats-cron.sh 與 docs/cms-insights-dashboard.md。
//
// 這支腳本 --apply 時會實際 PATCH：
//   - dashboard：沿用舊名稱的 dashboard 並改名、更新說明（note）；
//   - panel：依「名稱」比對，已存在就更新版面與設定（覆蓋手動調整），不存在就建立；
//   - 舊版 panel（OBSOLETE_PANEL_NAMES）：依名稱刪除。
// 手動改名的 panel 重跑會被當成不存在而新建，這是依名稱比對的已知取捨。
//
// 卡片與明細表用自訂擴充 directus-extension-traffic-panels，--apply 前會先確認主機已安裝，
// 沒裝就中止（避免建出空 panel），安裝見 directus-extensions/traffic-panels/README.md。
//
// 用法：
//   node tools/create-insights-dashboard.mjs                  # dry-run，印出要建立／更新／刪除的內容
//   DIRECTUS_TOKEN=xxx node tools/create-insights-dashboard.mjs --apply

import {
  CUSTOM_PANEL_TYPES,
  DASHBOARD_NAME,
  DASHBOARD_NOTE,
  EXTENSION_PACKAGE,
  LEGACY_DASHBOARD_NAMES,
  layoutPanels,
  OBSOLETE_PANEL_NAMES,
  PANELS,
  validatePanelDefs,
} from './lib/insights-dashboard-lib.mjs';

const CMS = process.env.DIRECTUS_URL ?? 'https://cms.aixwang.dev';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 必須先設定 DIRECTUS_TOKEN 環境變數。');
  process.exit(1);
}

const problems = validatePanelDefs(PANELS);
if (problems.length) {
  console.error('PANELS 定義有問題，中止：');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

async function request(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, { ...init, headers: { ...headers(), ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}：${text.slice(0, 300)}`);
  return text ? JSON.parse(text).data : null;
}

async function findDashboard() {
  for (const name of [DASHBOARD_NAME, ...LEGACY_DASHBOARD_NAMES]) {
    const data = await request(`/dashboards?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
    if (data[0]) return data[0];
  }
  return null;
}

async function findPanel(dashboardId, name) {
  const data = await request(`/panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${encodeURIComponent(name)}&limit=1`);
  return data[0] ?? null;
}

const panelBody = (dashboardId, panel) => ({
  dashboard: dashboardId,
  name: panel.name,
  icon: panel.icon,
  note: panel.note,
  show_header: true,
  type: panel.type,
  position_x: panel.position_x,
  position_y: panel.position_y,
  width: panel.width,
  height: panel.height,
  options: panel.options,
});

async function ensureCustomExtension() {
  const installed = await request('/extensions');
  const found = installed.some((extension) => extension.schema?.name === EXTENSION_PACKAGE && extension.meta?.enabled !== false);
  if (!found) {
    throw new Error(`主機尚未安裝自訂擴充 ${EXTENSION_PACKAGE}（見 directus-extensions/traffic-panels/README.md），--apply 會建出空 panel，已中止。`);
  }
  console.log(`已偵測到自訂擴充 ${EXTENSION_PACKAGE}。`);
}

// 已發布篇數決定明細表高度；沒 token（dry-run）就用預設高度。
const publishedCount = token
  ? await request('/items/articles?aggregate[count]=*&filter[status][_eq]=published').then((rows) => Number(rows?.[0]?.count ?? 0) || null).catch(() => null)
  : null;
const LAID_OUT_PANELS = layoutPanels(PANELS, { publishedCount });

console.log(`目標 Directus：${CMS}`);
console.log(apply ? '模式：--apply（會真的修改 Directus）' : '模式：dry-run（預設，不修改）');
console.log(`Dashboard 名稱：${DASHBOARD_NAME}（舊名：${LEGACY_DASHBOARD_NAMES.join('、')}）`);
console.log(`Panel：${LAID_OUT_PANELS.length} 個；移除舊 panel：${OBSOLETE_PANEL_NAMES.length} 個名稱`);
for (const p of LAID_OUT_PANELS) console.log(`  [${p.type}] ${p.name}　位置=(${p.position_x},${p.position_y}) 尺寸=${p.width}x${p.height}`);

if (!apply) {
  if (token) {
    const existing = await findDashboard();
    if (!existing) console.log('\nDashboard 目前狀態：不存在，實際執行時會新建。');
    else {
      console.log(`\nDashboard 目前狀態：已存在（id=${existing.id}，名稱「${existing.name}」），實際執行時會沿用。`);
      const stale = [];
      for (const name of OBSOLETE_PANEL_NAMES) if (await findPanel(existing.id, name)) stale.push(name);
      console.log(`會移除的舊 panel（${stale.length}）：${stale.join('、') || '無'}`);
    }
  }
  console.log('\n這是 dry-run，沒有修改 Directus。要真的執行，加 --apply 並帶 DIRECTUS_TOKEN。');
  process.exit(0);
}

if (LAID_OUT_PANELS.some((p) => CUSTOM_PANEL_TYPES.includes(p.type))) await ensureCustomExtension();

let dashboard = await findDashboard();
if (!dashboard) {
  dashboard = await request('/dashboards', { method: 'POST', body: JSON.stringify({ name: DASHBOARD_NAME, icon: 'analytics', note: DASHBOARD_NOTE }) });
  console.log(`已建立 Dashboard「${DASHBOARD_NAME}」（id=${dashboard.id}）。`);
} else {
  await request(`/dashboards/${dashboard.id}`, { method: 'PATCH', body: JSON.stringify({ name: DASHBOARD_NAME, icon: 'analytics', note: DASHBOARD_NOTE }) });
  console.log(`Dashboard（id=${dashboard.id}）已更新為「${DASHBOARD_NAME}」，說明已更新。`);
}

for (const panel of LAID_OUT_PANELS) {
  const existing = await findPanel(dashboard.id, panel.name);
  if (existing) {
    await request(`/panels/${existing.id}`, { method: 'PATCH', body: JSON.stringify(panelBody(dashboard.id, panel)) });
    console.log(`已更新「${panel.name}」。`);
  } else {
    await request('/panels', { method: 'POST', body: JSON.stringify(panelBody(dashboard.id, panel)) });
    console.log(`已建立「${panel.name}」。`);
  }
}

for (const name of OBSOLETE_PANEL_NAMES) {
  const obsolete = await findPanel(dashboard.id, name);
  if (!obsolete) continue;
  await request(`/panels/${obsolete.id}`, { method: 'DELETE' });
  console.log(`已移除舊面板「${name}」。`);
}

console.log(`\n完成。到 Directus 後台 Insights 找到「${DASHBOARD_NAME}」查看。`);
