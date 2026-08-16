// Directus Insights dashboard／panel 的純資料與版面配置邏輯（不做網路請求、不讀環境變數）。
// 從 tools/create-insights-dashboard.mjs 抽出來，讓 PANELS 定義與 layoutPanels() 版面計算
// 可以直接被 tools/lib/insights-dashboard-lib.test.mjs 測試，不用真的打 Directus API。
//
// PANELS 分三組，對應 docs/cms-insights-dashboard.md 的分類：
//   A. 直接查 articles collection 就算得出來
//   B. articles 算不出來，改讀 content_stats（目前快照，一篇文章一列，由
//      tools/write-content-stats.mjs 寫入）
//   C. 趨勢圖，讀 content_stats_history（一天一列的站台彙總歷史）
//
// 每個 panel type 的 options 需要哪些欄位，是直接讀 Directus GitHub 原始碼（main 分支，
// 抓取日期 2026-07-31）確認的，不是查文件猜的：
//   https://github.com/directus/directus/tree/main/app/src/panels/metric/index.ts
//   https://github.com/directus/directus/tree/main/app/src/panels/list/index.ts
//   https://github.com/directus/directus/tree/main/app/src/panels/time-series/index.ts
//   https://github.com/directus/directus/tree/main/app/src/panels/bar-chart/index.ts
//   https://github.com/directus/directus/tree/main/app/src/panels/pie-chart/index.ts

/** 內建 panel type 的 id 字串，抓自上述原始碼的 definePanel({ id: '...' })。 */
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
];

/**
 * 每種 panel type 的 query() 函式裡，「沒給就整個 panel 查不出東西」的必要 options 欄位
 * （抓自各 index.ts 的 query() 開頭那段 early return 判斷）。用來在建立前做基本檢查，
 * 避免手動填錯漏掉必要欄位、建出一個 Directus 後台會顯示空白的 panel。
 */
export const REQUIRED_OPTION_FIELDS = {
  metric: ['function'], // query(): if (!options || !options.function) return;
  list: ['collection'], // query(): if (!options?.collection) return;
  'time-series': ['function', 'valueField', 'dateField'], // query(): 三者缺一 return
  'bar-chart': ['collection', 'xAxis', 'yAxis'], // query(): requiredFields
  'pie-chart': ['column'], // query(): if (!options.column) return;
};

export const PANELS = [
  // ── A. 直接查 articles collection 就算得出來 ──────────────────────────
  {
    group: 'A',
    name: '總篇數',
    type: 'metric',
    icon: 'article',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'articles', field: 'id', function: 'count' },
  },
  {
    group: 'A',
    name: 'featured 篇數',
    type: 'metric',
    icon: 'star',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'articles', field: 'id', function: 'count', filter: { featured: { _eq: true } } },
  },
  {
    group: 'A',
    name: '最早發佈日',
    type: 'metric',
    icon: 'first_page',
    minWidth: 6,
    minHeight: 4,
    // Directus GraphQL 的 aggregated_fields 不包含 date 欄位；日期不可用 min/max 聚合。
    // metric 的 first/last 會改走一般 items 查詢，再依 sortField 取第一列／最後一列。
    options: { collection: 'articles', field: 'pub_date', function: 'first', sortField: 'pub_date' },
  },
  {
    group: 'A',
    name: '最新發佈日',
    type: 'metric',
    icon: 'last_page',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'articles', field: 'pub_date', function: 'last', sortField: 'pub_date' },
  },
  {
    group: 'A',
    name: 'status 分布',
    type: 'pie-chart',
    icon: 'donut_large',
    minWidth: 10,
    minHeight: 10,
    options: { collection: 'articles', column: 'status', function: 'count', donut: true, showLabels: true, legend: 'bottom' },
  },
  {
    group: 'A',
    name: '每月發文數',
    type: 'time-series',
    icon: 'show_chart',
    minWidth: 12,
    minHeight: 6,
    options: {
      collection: 'articles',
      dateField: 'pub_date',
      valueField: 'id',
      function: 'count',
      precision: 'month',
      range: 'auto',
      showXAxis: true,
      showYAxis: true,
    },
  },
  {
    group: 'A',
    name: '最近更新的文章',
    type: 'list',
    icon: 'update',
    minWidth: 12,
    minHeight: 6,
    options: {
      collection: 'articles',
      sortField: 'updated_date',
      sortDirection: 'desc',
      displayTemplate: '{{title}} — {{updated_date}}',
      limit: 20,
      linkToItem: true,
    },
  },

  // ── B. articles 算不出來，讀 content_stats（目前快照，一篇一列）──────────
  {
    group: 'B',
    name: '平均正文字數',
    type: 'metric',
    icon: 'notes',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'word_count', function: 'avg', maximumFractionDigits: 0 },
  },
  {
    group: 'B',
    name: '正文字數：最少',
    type: 'metric',
    icon: 'south',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'word_count', function: 'min' },
  },
  {
    group: 'B',
    name: '正文字數：最多',
    type: 'metric',
    icon: 'north',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'word_count', function: 'max' },
  },
  {
    group: 'B',
    name: '正文字數排行',
    type: 'list',
    icon: 'format_list_numbered',
    minWidth: 12,
    minHeight: 6,
    options: {
      collection: 'content_stats',
      sortField: 'word_count',
      sortDirection: 'desc',
      displayTemplate: '{{title}} — {{word_count}} 字',
      limit: 20,
    },
  },
  {
    group: 'B',
    name: 'description 達標分布',
    type: 'bar-chart',
    icon: 'bar_chart',
    minWidth: 12,
    minHeight: 10,
    options: { collection: 'content_stats', xAxis: 'desc_status', yAxis: 'slug', function: 'count', horizontal: true, decimals: 0 },
  },
  {
    group: 'B',
    name: '平均每篇標籤數',
    type: 'metric',
    icon: 'sell',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'tag_count', function: 'avg' },
  },
  {
    group: 'B',
    name: '平均每篇 FAQ 題數',
    type: 'metric',
    icon: 'quiz',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'faq_count', function: 'avg' },
  },
  {
    group: 'B',
    name: '孤島文章數（零站內連入）',
    type: 'metric',
    icon: 'link_off',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'slug', function: 'count', filter: { is_island: { _eq: true } } },
  },
  {
    group: 'B',
    name: '死路文章數（沒有連出任何站內文章）',
    type: 'metric',
    icon: 'block',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats', field: 'slug', function: 'count', filter: { is_dead_end: { _eq: true } } },
  },
  {
    group: 'B',
    name: '孤島文章清單',
    type: 'list',
    icon: 'link_off',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats', filter: { is_island: { _eq: true } }, sortField: 'slug', sortDirection: 'asc', displayTemplate: '{{title}}（{{slug}}）', limit: 50 },
  },
  {
    group: 'B',
    name: '死路文章清單',
    type: 'list',
    icon: 'block',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats', filter: { is_dead_end: { _eq: true } }, sortField: 'slug', sortDirection: 'asc', displayTemplate: '{{title}}（{{slug}}）', limit: 50 },
  },
  {
    group: 'B',
    name: 'slug 含非 ASCII 字元的文章',
    type: 'list',
    icon: 'translate',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats', filter: { slug_has_non_ascii: { _eq: true } }, sortField: 'slug', sortDirection: 'asc', displayTemplate: '{{title}} — {{slug}}', limit: 50 },
  },
  {
    group: 'B',
    name: '目前不重複標籤數',
    type: 'metric',
    icon: 'sell',
    minWidth: 6,
    minHeight: 4,
    // content_stats（一篇文章一列）沒有「不重複標籤數」這種站台彙總數字，只能從
    // content_stats_history（一天一列）取「run_date 最新的那一列」的值：
    // function='last' + sortField='run_date' 是 Directus metric panel 官方支援的寫法
    // （query() 內部會用 sort=`-${sortField}` 排序後 limit=1，取到的就是最新一列）。
    options: { collection: 'content_stats_history', field: 'unique_tag_count', function: 'last', sortField: 'run_date' },
  },
  {
    group: 'B',
    name: '目前 featured 比例（%）',
    type: 'metric',
    icon: 'percent',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats_history', field: 'featured_ratio', function: 'last', sortField: 'run_date', suffix: '%' },
  },
  {
    group: 'B',
    name: '目前最長發文空窗（天）',
    type: 'metric',
    icon: 'hourglass_empty',
    minWidth: 6,
    minHeight: 4,
    options: { collection: 'content_stats_history', field: 'max_gap_days', function: 'last', sortField: 'run_date', suffix: ' 天' },
  },
  {
    group: 'B',
    name: '草稿篇數',
    type: 'metric',
    icon: 'edit_note',
    minWidth: 6,
    minHeight: 4,
    // 非 published（草稿等）文章篇數，不計入其他任何指標，只是讓人看得到「還有多少草稿沒發」。
    // content_stats（一篇文章一列）不含草稿的列，這個數字只存在 content_stats_history（站台彙總），
    // 用法跟上面幾個「目前 XXX」metric panel 相同：function='last' + sortField='run_date'。
    options: { collection: 'content_stats_history', field: 'draft_count', function: 'last', sortField: 'run_date' },
  },

  // ── C. 趨勢（讀 content_stats_history，一天一列，本來就適合畫 time-series）──
  {
    group: 'C',
    name: '平均字數趨勢',
    type: 'time-series',
    icon: 'trending_up',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats_history', dateField: 'run_date', valueField: 'avg_word_count', function: 'avg', precision: 'day', range: 'auto' },
  },
  {
    group: 'C',
    name: '總篇數趨勢',
    type: 'time-series',
    icon: 'trending_up',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats_history', dateField: 'run_date', valueField: 'article_count', function: 'avg', precision: 'day', range: 'auto' },
  },
  {
    group: 'C',
    name: 'description 達標篇數趨勢',
    type: 'time-series',
    icon: 'trending_up',
    minWidth: 12,
    minHeight: 6,
    options: { collection: 'content_stats_history', dateField: 'run_date', valueField: 'desc_pass_count', function: 'avg', precision: 'day', range: 'auto' },
  },
];

/**
 * 版面配置：單欄由上往下堆疊。position_x 固定 1，position_y 依序疊加每個 panel 的 minHeight，
 * 保證不會互相重疊——沒有查到這台 Directus 的 Insights 工作區網格總寬度是多少格，
 * 所以不假設「一排放幾個」，這是刻意保守的版面（見 tools/create-insights-dashboard.mjs 開頭說明）。
 *
 * @param {typeof PANELS} panels
 * @returns {Array<typeof PANELS[number] & { position_x: number, position_y: number, width: number, height: number }>}
 */
export function layoutPanels(panels) {
  let cursorY = 1;
  return panels.map((p) => {
    const laidOut = { ...p, position_x: 1, position_y: cursorY, width: p.minWidth, height: p.minHeight };
    cursorY += p.minHeight;
    return laidOut;
  });
}

/**
 * 檢查每個 panel 定義有沒有缺該 panel type 的必要 options 欄位（見 REQUIRED_OPTION_FIELDS）、
 * type 是不是已知的內建 panel type。回傳問題清單，空陣列代表全部通過。
 *
 * @param {typeof PANELS} panels
 * @returns {string[]} 問題描述清單（例如 "「總篇數」缺少必要欄位 options.function"）
 */
export function validatePanelDefs(panels) {
  const problems = [];
  for (const p of panels) {
    if (!KNOWN_PANEL_TYPES.includes(p.type)) {
      problems.push(`「${p.name}」的 type「${p.type}」不是已知的內建 panel type`);
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
