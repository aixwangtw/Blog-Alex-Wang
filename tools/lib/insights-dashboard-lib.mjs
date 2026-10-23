// Directus Insights「文章產出與品質」dashboard 的純資料與版面配置邏輯（不做網路請求、不讀環境變數）。
// 從 tools/create-insights-dashboard.mjs 抽出來，讓 PANELS 定義與 layoutPanels() 版面計算
// 可以直接被 tools/lib/insights-dashboard-lib.test.mjs 測試，不用真的打 Directus API。
//
// 口徑：全部只算已發布文章（草稿只在「發文概況」顯示一個數字）。資料來源：
//   - articles（即時）：已發布／草稿／主打篇數、每月發文數、發布狀態；
//   - content_stats（每篇已發布文章一列的快照，由 tools/write-content-stats.mjs 每天寫入）：字數、標籤、FAQ、站內連結；
//   - content_stats_history（一天一列的站台彙總歷史）：趨勢圖、最長發文空窗。
//
// 版面與「流量統計」一致：60 格滿版（Directus VWorkspace 每格 18px）。
// 卡片與明細表是自訂擴充 directus-extension-traffic-panels 的面板（見 directus-extensions/traffic-panels/README.md），
// 圖表仍用 Directus 內建 panel。內建 panel type 的 options 欄位是讀 Directus GitHub 原始碼確認的（抓取日期 2026-07-31）：
//   https://github.com/directus/directus/tree/main/app/src/panels/<type>/index.ts

export const DASHBOARD_NAME = '文章產出與品質';
/** 舊名稱：腳本依序用這些名稱找既有 dashboard 並改名，保留原有 id 與連結。 */
export const LEGACY_DASHBOARD_NAMES = ['網站內容統計', 'Blog 內容統計', '內容統計'];
export const DASHBOARD_NOTE = '看文章的產出與品質：發了幾篇、寫得多長、標籤與 FAQ 夠不夠、文章之間有沒有互相連結。只算已發布文章（草稿只顯示一個數字）。資料每天更新一次。';

/** 自訂擴充的 package 名稱（用來確認主機已安裝）。 */
export const EXTENSION_PACKAGE = 'directus-extension-traffic-panels';

/** 內建與自訂 panel type 的 id 字串。 */
export const KNOWN_PANEL_TYPES = [
  'label',
  'list',
  'metric',
  'metric-list',
  'time-series',
  'variable',
  'relational-variable',
  'bar-chart',
  'line-chart',
  'meter',
  'pie-chart',
  // 自訂擴充
  'traffic-summary-card',
  'content-article-table',
];

/** 自訂擴充提供的 panel type（沒裝擴充時建出來是空 panel，所以腳本 --apply 前會先確認）。 */
export const CUSTOM_PANEL_TYPES = ['traffic-summary-card', 'content-article-table'];

/**
 * 每種 panel type 的 query() 函式裡，「沒給就整個 panel 查不出東西」的必要 options 欄位
 * （抓自各 index.ts 的 query() 開頭那段 early return 判斷）。
 */
export const REQUIRED_OPTION_FIELDS = {
  metric: ['function'],
  list: ['collection'],
  'time-series': ['function', 'valueField', 'dateField'],
  'bar-chart': ['collection', 'xAxis', 'yAxis'],
  'pie-chart': ['column'],
  'traffic-summary-card': ['kind'],
};

/** 版面總寬（格）。 */
export const GRID_WIDTH = 60;

/** `traffic-summary-card` 的內容類型（需與擴充的 kind 選項一致）。 */
export const CONTENT_CARD_KINDS = ['content-posts', 'content-quality', 'content-links'];

export const PANELS = [
  // ── 第 1 排：三張卡片 ───────────────────────────────────────────────
  {
    row: 1,
    name: '發文概況',
    type: 'traffic-summary-card',
    icon: 'edit_calendar',
    note: '並排顯示已發布、草稿、主打篇數；主打是已發布文章裡標為主打的。草稿只在這裡顯示一個數字，不計入其他任何統計。滑鼠移上去看第一篇與最新一篇的發布日、最長多久沒發文（天）。',
    width: 20,
    height: 10,
    options: { kind: 'content-posts' },
  },
  {
    row: 1,
    name: '寫作品質',
    type: 'traffic-summary-card',
    icon: 'edit_note',
    note: '已發布文章的平均正文字數、平均標籤數、平均 FAQ 數（每天更新一次的快照）。滑鼠移上去看字數最少與最多的文章。',
    width: 20,
    height: 10,
    options: { kind: 'content-quality' },
  },
  {
    row: 1,
    name: '站內連結',
    type: 'traffic-summary-card',
    icon: 'link',
    note: '已發布文章之間的連結檢查（每天更新一次）：左邊是沒有任何其他文章連到它的篇數，右邊是文章裡沒有連到其他文章的篇數。滑鼠移到數字上看是哪幾篇。',
    width: 20,
    height: 10,
    options: { kind: 'content-links' },
  },

  // ── 第 2 排：發布狀態、每月發文數 ────────────────────────────────────
  {
    row: 2,
    name: '發布狀態',
    type: 'pie-chart',
    icon: 'donut_large',
    note: '全部文章依狀態的篇數比例（published＝已發布、draft＝草稿）。',
    width: 24,
    height: 22,
    options: { collection: 'articles', column: 'status', function: 'count', donut: true, showLabels: true, legend: 'bottom' },
  },
  {
    row: 2,
    name: '每月發文數',
    type: 'time-series',
    icon: 'show_chart',
    note: '已發布文章依發布日（pub_date）統計每月篇數；草稿不算。',
    width: 36,
    height: 22,
    options: {
      collection: 'articles',
      dateField: 'pub_date',
      valueField: 'id',
      function: 'count',
      precision: 'month',
      range: 'auto',
      filter: { status: { _eq: 'published' } },
      showXAxis: true,
      showYAxis: true,
    },
  },

  // ── 第 3 排：文章明細表（高度依已發布篇數，見 layoutPanels） ──────────────
  {
    row: 3,
    name: '文章明細',
    type: 'content-article-table',
    icon: 'table_view',
    note: '只列已發布文章。SEO 描述字數建議 40～80 字；站內連結狀況用白話說明。字數、標籤、FAQ、連結來自每天更新一次的內容統計，剛發布的文章要等下次更新才有這些數字。點欄位標題排序、拖拉標題右緣調整欄寬。',
    width: 60,
    height: 18,
    options: {},
  },

  // ── 第 4 排：趨勢 ────────────────────────────────────────────────────
  {
    row: 4,
    name: '平均字數趨勢',
    type: 'time-series',
    icon: 'trending_up',
    note: '每天一次的內容統計，已發布文章的平均正文字數。',
    width: 30,
    height: 18,
    options: { collection: 'content_stats_history', dateField: 'run_date', valueField: 'avg_word_count', function: 'avg', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
  {
    row: 4,
    name: '已發布篇數趨勢',
    type: 'time-series',
    icon: 'trending_up',
    note: '每天一次的內容統計，當時的已發布篇數（文章下架成草稿也會讓數字下降）。',
    width: 30,
    height: 18,
    options: { collection: 'content_stats_history', dateField: 'run_date', valueField: 'article_count', function: 'avg', precision: 'day', range: 'auto', showXAxis: true, showYAxis: true },
  },
];

/**
 * 要從 dashboard 移除的舊 panel 名稱（改版前的所有零碎 metric 與 list、達標分布、非 ASCII slug 清單、description 達標趨勢…）。
 * 腳本 --apply 時依名稱刪除；新版同名的 panel（「每月發文數」「平均字數趨勢」）不在這裡，會被更新而不是刪除。
 */
export const OBSOLETE_PANEL_NAMES = [
  '總篇數',
  'featured 篇數',
  '最早發佈日',
  '最新發佈日',
  'status 分布',
  '最近更新的文章',
  '平均正文字數',
  '正文字數：最少',
  '正文字數：最多',
  '正文字數排行',
  'description 達標分布',
  '平均每篇標籤數',
  '平均每篇 FAQ 題數',
  '孤島文章數（零站內連入）',
  '死路文章數（沒有連出任何站內文章）',
  '孤島文章清單',
  '死路文章清單',
  'slug 含非 ASCII 字元的文章',
  '目前不重複標籤數',
  '目前 featured 比例（%）',
  '目前最長發文空窗（天）',
  '草稿篇數',
  '總篇數趨勢',
  'description 達標篇數趨勢',
];

/**
 * 明細表高度（格，每格 18px）：表頭＋每列約 34px，加面板標題與留白，最低 14、最高 50；超過時在面板內捲動。
 * 與 tools/create-views-dashboard.mjs 的 tableHeight 同一公式。
 *
 * @param {number} rows
 * @returns {number}
 */
export function articleTableHeight(rows) {
  return Math.min(50, Math.max(14, Math.ceil((34 * (rows + 1) + 80) / 18) + 2));
}

/**
 * 版面配置：60 格滿版。每個 panel 的 row 決定排在第幾排，同一排由左到右依序排；
 * 排與排之間不留空，y 由上一排最高的 panel 高度推算。content-article-table 的高度依已發布篇數調整。
 *
 * @param {typeof PANELS} panels
 * @param {{ publishedCount?: number | null }} [options]
 * @returns {Array<typeof PANELS[number] & { position_x: number, position_y: number }>}
 */
export function layoutPanels(panels, { publishedCount = null } = {}) {
  const rows = [...new Set(panels.map((p) => p.row))].sort((a, b) => a - b);
  const laidOut = [];
  let cursorY = 1;
  for (const row of rows) {
    let cursorX = 1;
    let rowHeight = 0;
    for (const p of panels.filter((item) => item.row === row)) {
      const height = p.type === 'content-article-table' && publishedCount !== null ? articleTableHeight(publishedCount) : p.height;
      laidOut.push({ ...p, height, position_x: cursorX, position_y: cursorY });
      cursorX += p.width;
      rowHeight = Math.max(rowHeight, height);
    }
    cursorY += rowHeight;
  }
  return laidOut;
}

/**
 * 檢查每個 panel 定義有沒有缺該 panel type 的必要 options 欄位（見 REQUIRED_OPTION_FIELDS）、
 * type 是不是已知的 panel type。回傳問題清單，空陣列代表全部通過。
 *
 * @param {typeof PANELS} panels
 * @returns {string[]} 問題描述清單（例如 "「總篇數」缺少必要欄位 options.function"）
 */
export function validatePanelDefs(panels) {
  const problems = [];
  for (const p of panels) {
    if (!KNOWN_PANEL_TYPES.includes(p.type)) {
      problems.push(`「${p.name}」的 type「${p.type}」不是已知的 panel type`);
      continue;
    }
    const required = REQUIRED_OPTION_FIELDS[p.type] ?? [];
    for (const field of required) {
      if (p.options?.[field] === undefined || p.options?.[field] === null || p.options?.[field] === '') {
        problems.push(`「${p.name}」（type=${p.type}）缺少必要欄位 options.${field}`);
      }
    }
  }
  return problems;
}
