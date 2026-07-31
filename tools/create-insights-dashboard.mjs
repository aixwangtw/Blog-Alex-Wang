// 在 Directus Insights 建立一個 dashboard，把「panel 可以直接查 articles 算出來」的統計，跟
// 「panel 算不出來、要靠 tools/write-content-stats.mjs 預先算好寫進 content_stats /
// content_stats_history 的統計」，放進同一個 dashboard 裡。分類依據見 docs/cms-insights-dashboard.md
// 「可直接查 / 需要預先計算 的指標分類表」。
//
// 依據（皆已查證，來源見下方逐項註解）：
//   - Directus Dashboards / Panels REST API 欄位與端點：
//     https://directus.com/docs/api/dashboards
//     https://directus.com/docs/api/panels
//   - 內建 panel type 的 id 字串與各自 options 需要哪些欄位，是直接讀 Directus GitHub 原始碼
//     （main 分支，抓取日期 2026-07-31）確認的，不是查文件猜的：
//     https://github.com/directus/directus/tree/main/app/src/panels/metric/index.ts
//     https://github.com/directus/directus/tree/main/app/src/panels/list/index.ts
//     https://github.com/directus/directus/tree/main/app/src/panels/time-series/index.ts
//     https://github.com/directus/directus/tree/main/app/src/panels/bar-chart/index.ts
//     https://github.com/directus/directus/tree/main/app/src/panels/pie-chart/index.ts
//   - 這台 cms.aixwang.dev 的確切版本號查不到（沒有 admin token 時 /server/info 不會回傳
//     directus.version，這是 Directus 本身的行為，不是這支腳本的限制），所以上面對照的是
//     GitHub main 分支的原始碼，不保證跟這台實際跑的版本逐欄位相同。--apply 前建議先手動在
//     後台試建一個 panel，確認選單跟這裡假設的欄位一致。
//
// 版面配置：這裡採用「單欄由上往下堆疊」，每個 panel 的 width 用官方原始碼裡各 panel type 的
// minWidth（或略寬一點），position_y 依序往下疊，保證不會互相重疊。沒有查到這台 Directus
// 的 Insights 工作區網格總寬度是多少格，所以不假設「一排放幾個」，建好之後可以在後台自由拖曳調整。
//
// 冪等：用「名稱」比對——dashboard 用 name 查是否已存在（存在就沿用該 dashboard，不重建）；
// panel 用「同一個 dashboard 底下 name 是否已存在」查（存在就跳過，不會建出重複 panel）。
// 這代表：如果你手動把某個 panel 改名，重跑這支腳本會誤判成「不存在」而建出一個新的——這是已知取捨，
// 不是 bug；想要改名又不被覆蓋，另外用後台手動管理即可。
//
// 沒有 DIRECTUS_TOKEN，這支腳本本身沒有真的打過 POST /dashboards 或 POST /panels。
//
// 用法：
//   node tools/create-insights-dashboard.mjs                  # dry-run，印出要建立的 dashboard／panel
//   DIRECTUS_TOKEN=xxx node tools/create-insights-dashboard.mjs --apply   # 真的建立

import { layoutPanels, PANELS, validatePanelDefs } from './lib/insights-dashboard-lib.mjs';

const CMS = 'https://cms.aixwang.dev';
const DASHBOARD_NAME = 'Blog 內容統計';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 真的建立 dashboard／panel，必須先設定 DIRECTUS_TOKEN 環境變數。');
  console.error('token 怎麼拿、collection 要先建好見 docs/cms-insights-dashboard.md。');
  process.exit(1);
}

// panel 定義本體（PANELS）與版面配置邏輯（layoutPanels）都搬到 tools/lib/insights-dashboard-lib.mjs
// 了，方便寫測試（tools/lib/insights-dashboard-lib.test.mjs）。這裡先做一次基本檢查，
// 避免手動改壞了某個 panel 的必要欄位還渾然不覺。

const problems = validatePanelDefs(PANELS);
if (problems.length) {
  console.error('PANELS 定義有問題，中止：');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

const LAID_OUT_PANELS = layoutPanels(PANELS);

// ── Directus API 呼叫 ──────────────────────────────────────────────────

async function findDashboardByName(name) {
  const url = `${CMS}/dashboards?filter[name][_eq]=${encodeURIComponent(name)}&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403 || res.status === 404) return { found: false, unreadable: true };
  if (!res.ok) throw new Error(`查詢 dashboard 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  return { found: data.length > 0, dashboard: data[0] ?? null, unreadable: false };
}

async function createDashboard(name) {
  const res = await fetch(`${CMS}/dashboards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, icon: 'analytics', note: '由 tools/create-insights-dashboard.mjs 自動建立，內容統計總覽。' }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`建立 dashboard 失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  return JSON.parse(text).data;
}

async function findPanelByName(dashboardId, name) {
  const url = `${CMS}/panels?filter[dashboard][_eq]=${dashboardId}&filter[name][_eq]=${encodeURIComponent(name)}&limit=1`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403 || res.status === 404) return { found: false, unreadable: true };
  if (!res.ok) throw new Error(`查詢 panel 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  return { found: data.length > 0, unreadable: false };
}

async function createPanel(dashboardId, panel) {
  const body = {
    dashboard: dashboardId,
    name: panel.name,
    icon: panel.icon,
    show_header: true,
    type: panel.type,
    position_x: panel.position_x,
    position_y: panel.position_y,
    width: panel.width,
    height: panel.height,
    options: panel.options,
  };
  const res = await fetch(`${CMS}/panels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`建立 panel「${panel.name}」失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  return JSON.parse(text).data;
}

// ── 主流程 ──────────────────────────────────────────────────────────────

const GROUP_LABEL = {
  A: 'A. 直接查 articles collection',
  B: 'B. 讀 content_stats（目前快照）',
  C: 'C. 讀 content_stats_history（趨勢）',
};

async function main() {
  console.log(`目標 Directus：${CMS}`);
  console.log(apply ? '模式：--apply（會真的呼叫 Directus API）' : '模式：dry-run（預設，不會真的打 API）');
  console.log(`Dashboard 名稱：${DASHBOARD_NAME}`);
  console.log(`Panel 總數：${LAID_OUT_PANELS.length}`);
  console.log('');

  if (!apply) {
    if (token) {
      const existing = await findDashboardByName(DASHBOARD_NAME);
      if (existing.unreadable) {
        console.log('Dashboard 目前狀態：查不到（沒有權限讀 directus_dashboards，或這個 collection 不存在——都可能是 token 權限不夠）。');
      } else if (existing.found) {
        console.log(`Dashboard 目前狀態：已存在（id=${existing.dashboard.id}），實際執行時會沿用它，逐一檢查底下的 panel 是否已存在。`);
      } else {
        console.log('Dashboard 目前狀態：不存在，實際執行時會新建。');
      }
    } else {
      console.log('Dashboard 目前狀態：未檢查（沒有 DIRECTUS_TOKEN，無法呼叫 GET /dashboards 確認是否已存在）。');
    }

    console.log('');
    for (const group of ['A', 'B', 'C']) {
      const inGroup = LAID_OUT_PANELS.filter((p) => p.group === group);
      console.log(`── ${GROUP_LABEL[group]}（${inGroup.length} 個 panel）──`);
      for (const p of inGroup) {
        console.log(`  [${p.type}] ${p.name}　位置=(${p.position_x},${p.position_y}) 尺寸=${p.width}x${p.height}`);
        console.log(`    options: ${JSON.stringify(p.options)}`);
      }
      console.log('');
    }
    console.log('這是 dry-run，沒有任何 dashboard／panel 被建立。要真的建立，加 --apply 並帶 DIRECTUS_TOKEN。');
    return;
  }

  // --apply
  let dashboardId;
  const existing = await findDashboardByName(DASHBOARD_NAME);
  if (existing.unreadable) {
    throw new Error('讀不到 directus_dashboards，token 權限可能不夠（需要能讀寫 directus_dashboards / directus_panels 的權限）。');
  }
  if (existing.found) {
    dashboardId = existing.dashboard.id;
    console.log(`Dashboard「${DASHBOARD_NAME}」已存在（id=${dashboardId}），沿用它。`);
  } else {
    const created = await createDashboard(DASHBOARD_NAME);
    dashboardId = created.id;
    console.log(`已建立 Dashboard「${DASHBOARD_NAME}」（id=${dashboardId}）。`);
  }
  console.log('');

  for (const panel of LAID_OUT_PANELS) {
    process.stdout.write(`[${panel.type}] ${panel.name} … `);
    try {
      const found = await findPanelByName(dashboardId, panel.name);
      if (found.unreadable) {
        console.log('查不到現況（權限不足？），略過。');
        continue;
      }
      if (found.found) {
        console.log('已存在，跳過。');
        continue;
      }
      await createPanel(dashboardId, panel);
      console.log('建立成功。');
    } catch (err) {
      console.log(`失敗：${err.message}`);
    }
  }

  console.log('\n完成。到 Directus 後台左側選單的 Insights 找到「' + DASHBOARD_NAME + '」查看。');
  console.log('版面是單欄由上往下堆疊的初始配置，可以在後台自由拖曳調整位置與大小。');
}

main().catch((err) => {
  console.error(`執行失敗：${err.message}`);
  process.exit(1);
});
