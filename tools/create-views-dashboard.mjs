// 在 Directus Insights 的「互動數據分析」建立文章觀看數面板。
// 資料只讀 articles.views / views_30d / views_synced_at；網站前台不會多發任何請求。
//
// 用法：
//   node tools/create-views-dashboard.mjs
//   DIRECTUS_TOKEN=xxx node tools/create-views-dashboard.mjs --apply

const CMS = 'https://cms.aixwang.dev';
const DASHBOARD_NAME = '互動數據分析';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 建立面板，必須設定 DIRECTUS_TOKEN。');
  process.exit(1);
}

const PANELS = [
  {
    name: '文章累積觀看總數', icon: 'visibility', type: 'metric',
    position_x: 1, position_y: 1, width: 6, height: 4,
    options: { collection: 'articles', field: 'views', function: 'sum' },
  },
  {
    name: '文章近 30 天觀看總數', icon: 'date_range', type: 'metric',
    position_x: 7, position_y: 1, width: 6, height: 4,
    options: { collection: 'articles', field: 'views_30d', function: 'sum' },
  },
  {
    name: '最後同步時間', icon: 'sync', type: 'metric',
    position_x: 13, position_y: 1, width: 6, height: 4,
    options: { collection: 'articles', field: 'views_synced_at', function: 'max' },
  },
  {
    name: '所有文章觀看次數', icon: 'format_list_numbered', type: 'list',
    position_x: 1, position_y: 5, width: 18, height: 10,
    options: {
      collection: 'articles',
      sortField: 'views', sortDirection: 'desc',
      displayTemplate: '{{title}}（{{status}}）— 累積 {{views}} 次／近 30 天 {{views_30d}} 次',
      limit: 100, linkToItem: true,
    },
  },
  {
    name: '近 30 天熱門文章', icon: 'trending_up', type: 'list',
    position_x: 1, position_y: 15, width: 18, height: 10,
    options: {
      collection: 'articles',
      sortField: 'views_30d', sortDirection: 'desc',
      displayTemplate: '{{title}}（{{status}}）— {{views_30d}} 次',
      limit: 100, linkToItem: true,
    },
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
  const data = await request(`/dashboards?filter[name][_eq]=${encodeURIComponent(DASHBOARD_NAME)}&limit=1`, { headers: headers() });
  return data[0] ?? null;
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

console.log(`Dashboard：${DASHBOARD_NAME}`);
console.log(apply ? '模式：--apply' : '模式：dry-run');
for (const panel of PANELS) console.log(`- [${panel.type}] ${panel.name}`);

if (!apply) {
  console.log('\n這是 dry-run，沒有修改 CMS。');
  process.exit(0);
}

let dashboard = await findDashboard();
if (!dashboard) {
  dashboard = await createDashboard();
  console.log(`已建立 Dashboard「${DASHBOARD_NAME}」。`);
} else {
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
