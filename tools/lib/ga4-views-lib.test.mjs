// 跑法：node --test tools/lib/ga4-views-lib.test.mjs
// （或用 package.json 的 npm run test:views）
//
// 全部用寫死的假資料當 fixture：沒有 GA4 憑證，打不到真的 GA4 Data API，
// 也沒有真的從 GA4 後台匯出過 CSV 來對過格式，所以這裡的 CSV fixture 是照
// 官方文件描述的匯出格式手刻的，不是真實檔案。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  aggregateEngagementBySlug,
  aggregateViewsBySlug,
  buildAvgEngagementSecondsBySlug,
  buildSyncPlan,
  computeAvgEngagementSeconds,
  extractBlogSlug,
  findUnmatchedSlugs,
  normalizeGa4Path,
  parseGa4ApiRows,
  parseGa4ApiRowsWithEngagement,
  parseGa4Csv,
  pathToSlug,
  remapSlugAliases,
  splitCsvLine,
} from './ga4-views-lib.mjs';

// ── normalizeGa4Path / extractBlogSlug / pathToSlug ──────────────────────

test('normalizeGa4Path：有無尾斜線正規化成同一個結果', () => {
  assert.equal(normalizeGa4Path('/blog/threads-api-tutorial'), '/blog/threads-api-tutorial/');
  assert.equal(normalizeGa4Path('/blog/threads-api-tutorial/'), '/blog/threads-api-tutorial/');
});

test('normalizeGa4Path：去掉 query string 與 hash', () => {
  assert.equal(
    normalizeGa4Path('/blog/threads-api-tutorial?utm_source=ig&utm_medium=bio'),
    '/blog/threads-api-tutorial/',
  );
  assert.equal(normalizeGa4Path('/blog/threads-api-tutorial#faq'), '/blog/threads-api-tutorial/');
  assert.equal(
    normalizeGa4Path('/blog/threads-api-tutorial/?ref=newsletter#toc'),
    '/blog/threads-api-tutorial/',
  );
});

test('normalizeGa4Path：大小寫與連續斜線正規化', () => {
  assert.equal(normalizeGa4Path('/Blog/Threads-API-Tutorial/'), '/blog/threads-api-tutorial/');
  assert.equal(normalizeGa4Path('//blog//threads-api-tutorial//'), '/blog/threads-api-tutorial/');
});

test('normalizeGa4Path：非字串或空字串回傳 null', () => {
  assert.equal(normalizeGa4Path(''), null);
  assert.equal(normalizeGa4Path(undefined), null);
  assert.equal(normalizeGa4Path(null), null);
});

test('extractBlogSlug：/blog/ 列表頁本身要排除', () => {
  assert.equal(extractBlogSlug('/blog/'), null);
});

test('extractBlogSlug：非 /blog/ 開頭回傳 null', () => {
  assert.equal(extractBlogSlug('/about/'), null);
  assert.equal(extractBlogSlug('/'), null);
});

test('extractBlogSlug：正常文章路徑抽出 slug', () => {
  assert.equal(extractBlogSlug('/blog/threads-api-tutorial/'), 'threads-api-tutorial');
});

test('pathToSlug：整合測試（帶 query string 的路徑也能抽出 slug）', () => {
  assert.equal(pathToSlug('/blog/threads-api-tutorial?utm_source=ig'), 'threads-api-tutorial');
  assert.equal(pathToSlug('/blog/'), null);
  assert.equal(pathToSlug('/'), null);
});

// ── aggregateViewsBySlug ──────────────────────────────────────────────────

test('aggregateViewsBySlug：同一篇文章的多個路徑變形要加總', () => {
  const rows = [
    { path: '/blog/threads-api-tutorial', views: 100 },
    { path: '/blog/threads-api-tutorial/', views: 50 },
    { path: '/blog/threads-api-tutorial/?utm_source=ig', views: 20 },
    { path: '/blog/Threads-API-Tutorial/', views: 5 },
  ];
  const { bySlug, matched } = aggregateViewsBySlug(rows);
  assert.equal(bySlug.get('threads-api-tutorial'), 175);
  assert.equal(matched.length, 4);
});

test('aggregateViewsBySlug：排除 /blog/ 列表頁與非 /blog/ 路徑', () => {
  const rows = [
    { path: '/blog/', views: 999 },
    { path: '/', views: 500 },
    { path: '/about/', views: 10 },
    { path: '/blog/threads-api-tutorial/', views: 30 },
  ];
  const { bySlug, unmatchedBlogPaths, excludedNonBlogCount } = aggregateViewsBySlug(rows);
  assert.equal(bySlug.size, 1);
  assert.equal(bySlug.get('threads-api-tutorial'), 30);
  assert.equal(unmatchedBlogPaths.length, 1);
  assert.equal(unmatchedBlogPaths[0].normalizedPath, '/blog/');
  assert.equal(excludedNonBlogCount, 2);
});

test('aggregateViewsBySlug：不存在的 slug 一樣會被加總（比對交給 buildSyncPlan）', () => {
  const rows = [{ path: '/blog/this-slug-does-not-exist/', views: 7 }];
  const { bySlug } = aggregateViewsBySlug(rows);
  assert.equal(bySlug.get('this-slug-does-not-exist'), 7);
});

// ── computeAvgEngagementSeconds ────────────────────────────────────────────

test('computeAvgEngagementSeconds：duration/users 四捨五入成整數秒（已用真實 GA4 API 資料驗證公式）', () => {
  assert.equal(computeAvgEngagementSeconds(189, 2), 95); // 94.5 → 四捨五入 95
  assert.equal(computeAvgEngagementSeconds(69, 9), 8); // 7.666… → 四捨五入 8
});

test('computeAvgEngagementSeconds：users 為 0 回傳 null，不是 0（避免除以 0，也避免誤導成「平均 0 秒」）', () => {
  assert.equal(computeAvgEngagementSeconds(100, 0), null);
  assert.equal(computeAvgEngagementSeconds(0, 0), null);
});

// ── aggregateEngagementBySlug / buildAvgEngagementSecondsBySlug ───────────

test('aggregateEngagementBySlug：同一篇文章的多個路徑變形分別加總 duration 與 users', () => {
  const rows = [
    { path: '/blog/threads-api-tutorial', duration: 40, users: 5 },
    { path: '/blog/threads-api-tutorial/', duration: 29, users: 4 },
  ];
  const { durationBySlug, usersBySlug, matched } = aggregateEngagementBySlug(rows);
  assert.equal(durationBySlug.get('threads-api-tutorial'), 69);
  assert.equal(usersBySlug.get('threads-api-tutorial'), 9);
  assert.equal(matched.length, 2);
});

test('aggregateEngagementBySlug：排除 /blog/ 列表頁與非 /blog/ 路徑', () => {
  const rows = [
    { path: '/blog/', duration: 999, users: 700 },
    { path: '/about/', duration: 10, users: 8 },
    { path: '/blog/threads-api-tutorial/', duration: 69, users: 9 },
  ];
  const { durationBySlug, usersBySlug, unmatchedBlogPaths, excludedNonBlogCount } = aggregateEngagementBySlug(rows);
  assert.equal(durationBySlug.size, 1);
  assert.equal(durationBySlug.get('threads-api-tutorial'), 69);
  assert.equal(usersBySlug.get('threads-api-tutorial'), 9);
  assert.equal(unmatchedBlogPaths.length, 1);
  assert.equal(excludedNonBlogCount, 1);
});

test('buildAvgEngagementSecondsBySlug：套用真實 GA4 API 實測範例算出平均秒數', () => {
  const durationBySlug = new Map([
    ['threads-api-tutorial', 69],
    ['no-users-slug', 50],
  ]);
  const usersBySlug = new Map([
    ['threads-api-tutorial', 9],
    ['no-users-slug', 0],
  ]);
  const avgBySlug = buildAvgEngagementSecondsBySlug(durationBySlug, usersBySlug);
  assert.equal(avgBySlug.get('threads-api-tutorial'), 8); // 69/9 = 7.666… → 8
  assert.equal(avgBySlug.has('no-users-slug'), false); // users=0 沒有平均值可算，不進 Map
});

test('buildAvgEngagementSecondsBySlug：先加總（含別名合併）再算平均，不是直接加總平均值本身', () => {
  // 模擬套用 remapSlugAliases 後兩個舊 slug 合併進同一個新 slug 的情境：
  // duration/users 個別加總完才算平均，若誤把「已經算好的平均值」直接相加會得到錯誤結果。
  const durationBySlug = new Map([['merged-slug', 40 + 29]]);
  const usersBySlug = new Map([['merged-slug', 5 + 4]]);
  const avgBySlug = buildAvgEngagementSecondsBySlug(durationBySlug, usersBySlug);
  assert.equal(avgBySlug.get('merged-slug'), 8); // 69/9 = 7.666… → 8，不是 (40/5 + 29/4)/2 之類的算法
});

// ── parseGa4ApiRows ─────────────────────────────────────────────────────

test('parseGa4ApiRows：轉換 GA4 Data API runReport() 回應形狀', () => {
  const fakeResponse = {
    rows: [
      { dimensionValues: [{ value: '/blog/threads-api-tutorial/' }], metricValues: [{ value: '175' }] },
      { dimensionValues: [{ value: '/blog/' }], metricValues: [{ value: '999' }] },
    ],
  };
  const rows = parseGa4ApiRows(fakeResponse);
  assert.deepEqual(rows, [
    { path: '/blog/threads-api-tutorial/', views: 175 },
    { path: '/blog/', views: 999 },
  ]);
});

test('parseGa4ApiRows：空回應不炸掉', () => {
  assert.deepEqual(parseGa4ApiRows({}), []);
  assert.deepEqual(parseGa4ApiRows(null), []);
});

// ── parseGa4ApiRowsWithEngagement ──────────────────────────────────────────

test('parseGa4ApiRowsWithEngagement：轉換含 userEngagementDuration／activeUsers 的回應形狀', () => {
  const fakeResponse = {
    rows: [
      {
        dimensionValues: [{ value: '/blog/threads-api-tutorial/' }],
        metricValues: [{ value: '175' }, { value: '69' }, { value: '9' }],
      },
      {
        dimensionValues: [{ value: '/services/one-on-one/' }],
        metricValues: [{ value: '3' }, { value: '189' }, { value: '2' }],
      },
    ],
  };
  const rows = parseGa4ApiRowsWithEngagement(fakeResponse);
  assert.deepEqual(rows, [
    { path: '/blog/threads-api-tutorial/', views: 175, duration: 69, users: 9 },
    { path: '/services/one-on-one/', views: 3, duration: 189, users: 2 },
  ]);
});

test('parseGa4ApiRowsWithEngagement：空回應不炸掉', () => {
  assert.deepEqual(parseGa4ApiRowsWithEngagement({}), []);
  assert.deepEqual(parseGa4ApiRowsWithEngagement(null), []);
});

// ── splitCsvLine / parseGa4Csv ────────────────────────────────────────────

test('splitCsvLine：處理引號包欄位與欄位內逗號', () => {
  assert.deepEqual(splitCsvLine('a,b,c'), ['a', 'b', 'c']);
  assert.deepEqual(splitCsvLine('"1,234",b'), ['1,234', 'b']);
  assert.deepEqual(splitCsvLine('"say ""hi""",b'), ['say "hi"', 'b']);
});

const FAKE_GA4_EXPORT_CSV = [
  '# ----------------------------------------',
  '# Page path and screen class',
  '# 2026-01-01-2026-07-30',
  '# ----------------------------------------',
  '',
  'Page path and screen class,Views,Active users',
  '/blog/threads-api-tutorial/,"1,234",800',
  '/blog/threads-api-tutorial,50,40',
  '/blog/instagram-api-tutorial/,300,250',
  '/blog/,999,700',
  '/about/,120,100',
  '',
  '# Report was generated on Jul 30, 2026',
].join('\n');

test('parseGa4Csv：容錯找到標題列，忽略前面的 metadata 行與結尾說明行', () => {
  const rows = parseGa4Csv(FAKE_GA4_EXPORT_CSV);
  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0], { path: '/blog/threads-api-tutorial/', views: 1234 });
  assert.deepEqual(rows[3], { path: '/blog/', views: 999 });
});

test('parseGa4Csv：搭配 aggregateViewsBySlug 可以正確加總同一篇文章', () => {
  const rows = parseGa4Csv(FAKE_GA4_EXPORT_CSV);
  const { bySlug } = aggregateViewsBySlug(rows);
  assert.equal(bySlug.get('threads-api-tutorial'), 1284);
  assert.equal(bySlug.get('instagram-api-tutorial'), 300);
});

test('parseGa4Csv：標題列在不同位置也找得到（metadata 行數不固定）', () => {
  const csv = [
    '# 這行是額外的 metadata，位置刻意跟上面那份不一樣',
    '# ----------------------------------------',
    '# Page path and screen class',
    '# ----------------------------------------',
    '',
    '',
    'Page path and screen class,Views',
    '/blog/threads-api-tutorial/,10',
  ].join('\n');
  const rows = parseGa4Csv(csv);
  assert.deepEqual(rows, [{ path: '/blog/threads-api-tutorial/', views: 10 }]);
});

test('parseGa4Csv：找不到標題列要丟出明確錯誤，不能默默猜欄位', () => {
  const csv = ['# metadata', 'foo,bar', '1,2'].join('\n');
  assert.throws(() => parseGa4Csv(csv), /找不到 CSV 標題列/);
});

test('parseGa4Csv：空字串直接丟錯', () => {
  assert.throws(() => parseGa4Csv(''), /CSV 內容是空的/);
});

test('parseGa4Csv：找不到標題列的錯誤訊息要附上檔案前 15 行原始內容，讓使用者自己判斷欄名', () => {
  const csv = ['# metadata line 1', '# metadata line 2', 'foo,bar,baz', '1,2,3'].join('\n');
  assert.throws(() => parseGa4Csv(csv), (err) => {
    assert.match(err.message, /--path-col/);
    assert.match(err.message, /--views-col/);
    // 前幾行的原始內容（含行號）要原封不動出現在錯誤訊息裡，方便使用者對照。
    assert.match(err.message, /# metadata line 1/);
    assert.match(err.message, /foo,bar,baz/);
    return true;
  });
});

// ── 中文 GA4 匯出（未驗證推測的中文欄名，見 ga4-views-lib.mjs 的 CHINESE_*_CANDIDATES 註解）──

const FAKE_GA4_EXPORT_CSV_ZH = [
  '# ----------------------------------------',
  '# 網頁路徑和畫面級別',
  '# 2026-01-01-2026-07-30',
  '# ----------------------------------------',
  '',
  '網頁路徑和畫面級別,瀏覽次數,使用中的使用者',
  '/blog/threads-api-tutorial/,"1,234",800',
  '/blog/instagram-api-tutorial/,300,250',
  '/blog/,999,700',
  '',
  '# 報表產生於 2026 年 7 月 30 日',
].join('\n');

test('parseGa4Csv：中文標題列（未驗證推測的中文欄名）能正確解析', () => {
  const rows = parseGa4Csv(FAKE_GA4_EXPORT_CSV_ZH);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], { path: '/blog/threads-api-tutorial/', views: 1234 });
  assert.deepEqual(rows[1], { path: '/blog/instagram-api-tutorial/', views: 300 });
});

test('parseGa4Csv：中文 CSV 裡有「工作階段」「使用者參與度」等干擾欄位時不會抓錯瀏覽數欄', () => {
  const csv = [
    '# metadata',
    '網頁路徑,工作階段,使用者參與度,瀏覽次數,使用中的使用者',
    '/blog/threads-api-tutorial/,999,888,1234,800',
  ].join('\n');
  const rows = parseGa4Csv(csv);
  assert.deepEqual(rows, [{ path: '/blog/threads-api-tutorial/', views: 1234 }]);
});

test('parseGa4Csv：--path-col / --views-col 對應的手動指定選項能覆蓋自動偵測（含英文 CSV）', () => {
  // 故意用一份「同一列裡同時有多個含 view 字樣欄位」的 CSV，
  // 若沒有手動指定，自動偵測會抓到第一個符合的欄位；手動指定應該精準蓋過去。
  const csv = [
    'Weird path label,Active users,Odd views label,Views',
    '/blog/threads-api-tutorial/,800,999,1234',
  ].join('\n');
  const rows = parseGa4Csv(csv, { pathColumnName: 'weird path label', viewsColumnName: 'odd views label' });
  assert.deepEqual(rows, [{ path: '/blog/threads-api-tutorial/', views: 999 }]);
});

test('parseGa4Csv：手動指定欄名可以覆蓋中文自動偵測', () => {
  const csv = [
    '自訂路徑欄,自訂數字欄,瀏覽次數',
    '/blog/threads-api-tutorial/,777,1234',
  ].join('\n');
  const rows = parseGa4Csv(csv, { pathColumnName: '自訂路徑欄', viewsColumnName: '自訂數字欄' });
  assert.deepEqual(rows, [{ path: '/blog/threads-api-tutorial/', views: 777 }]);
});

test('parseGa4Csv：手動指定的欄名比對不分大小寫、去除欄名前後空白後用包含比對', () => {
  const csv = ['  My Custom Path  , My Custom Views ', '/blog/threads-api-tutorial/,42'].join('\n');
  const rows = parseGa4Csv(csv, { pathColumnName: 'custom path', viewsColumnName: 'CUSTOM VIEWS' });
  assert.deepEqual(rows, [{ path: '/blog/threads-api-tutorial/', views: 42 }]);
});

// ── remapSlugAliases ───────────────────────────────────────────────────

test('remapSlugAliases：舊 slug 的瀏覽數併入現在的 slug', () => {
  const bySlug = new Map([
    ['meta-api-application', 40],
    ['threads-api-tutorial', 175],
  ]);
  const { bySlug: remapped, appliedFrom } = remapSlugAliases(bySlug, {
    'meta-api-application': 'threads-api-tutorial',
  });
  assert.equal(remapped.get('threads-api-tutorial'), 215);
  assert.equal(remapped.has('meta-api-application'), false);
  assert.deepEqual(appliedFrom.get('threads-api-tutorial'), ['meta-api-application']);
});

test('remapSlugAliases：沒有別名表就原封不動', () => {
  const bySlug = new Map([['threads-api-tutorial', 175]]);
  const { bySlug: remapped, appliedFrom } = remapSlugAliases(bySlug);
  assert.equal(remapped.get('threads-api-tutorial'), 175);
  assert.equal(appliedFrom.size, 0);
});

// ── findUnmatchedSlugs ─────────────────────────────────────────────────

test('findUnmatchedSlugs：列出 GA4 有資料但 Directus 查無此文章的 slug', () => {
  const bySlug = new Map([
    ['threads-api-tutorial', 175],
    ['what-is-ai-agent', 12], // 已知尚未發布，屬於預期中的 404 流量
    ['some-typo-slug', 3],
  ]);
  const articles = [{ slug: 'threads-api-tutorial' }, { slug: 'instagram-api-tutorial' }];
  assert.deepEqual(findUnmatchedSlugs(bySlug, articles), ['some-typo-slug', 'what-is-ai-agent']);
});

// ── buildSyncPlan ────────────────────────────────────────────────────────

// 修過的舊測試：原本斷言「GA4 全期間資料沒有這篇 → views 視為 0」，這是本次修掉的資料安全缺陷
// （不完整的匯出檔會把已同步的累積瀏覽數洗成 0，見 tools/lib/ga4-views-lib.mjs buildSyncPlan()
// 開頭的安全機制註解）。改成斷言新的預設行為：views 未涵蓋 → 跳過、不寫入、保留 Directus 現值；
// views_30d 未涵蓋 → 維持寫 0（滾動值本來就該歸零，跳過反而留下過期舊值）。
test('buildSyncPlan：同時有全期間與 30 天資料時寫兩個欄位', () => {
  const articles = [
    { id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學' },
    { id: 18, slug: 'instagram-api-tutorial', title: 'IG API 教學' },
  ];
  const totalBySlug = new Map([['threads-api-tutorial', 1284]]);
  const last30dBySlug = new Map([
    ['threads-api-tutorial', 300],
    ['instagram-api-tutorial', 50],
  ]);
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug });

  assert.equal(updates.length, 2);
  const threads = updates.find((u) => u.slug === 'threads-api-tutorial');
  assert.equal(threads.views, 1284);
  assert.equal(threads.views_30d, 300);

  const ig = updates.find((u) => u.slug === 'instagram-api-tutorial');
  // 改動處：GA4 全期間資料沒有這篇 → 新預設是跳過、不產生 views 欄位（保留 Directus 現值），不再寫 0。
  assert.equal('views' in ig, false);
  assert.equal(ig.views_30d, 50); // views_30d 未涵蓋時的預設行為沒變，仍然是寫 0（這篇有資料所以不吃到預設）

  assert.deepEqual(report.views.keptExisting.map((r) => r.slug), ['instagram-api-tutorial']);
  assert.deepEqual(report.views.zeroed, []);
  assert.deepEqual(report.views_30d.zeroed, []);
});

test('buildSyncPlan：只給其中一種資料來源時，只寫對應欄位', () => {
  const articles = [{ id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const { updates } = buildSyncPlan({ articles, totalBySlug: null, last30dBySlug: new Map([['threads-api-tutorial', 10]]) });
  assert.equal(updates.length, 1);
  assert.equal('views' in updates[0], false);
  assert.equal(updates[0].views_30d, 10);
});

test('buildSyncPlan：兩種資料來源都沒給就不產生任何更新', () => {
  const articles = [{ id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const { updates } = buildSyncPlan({ articles, totalBySlug: null, last30dBySlug: null });
  assert.equal(updates.length, 0);
});

// ── buildSyncPlan：未涵蓋 slug 的資料安全保護（本次修的缺陷）───────────────

test('buildSyncPlan：views 欄位對「來源未涵蓋」的 slug 預設跳過，不寫入、保留現值', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const totalBySlug = new Map(); // 空 Map：這份匯出檔完全沒涵蓋到這篇文章
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug: null });

  assert.equal(updates.length, 0); // 沒有任何欄位被寫入，不會產生 PATCH
  assert.deepEqual(report.views.keptExisting.map((r) => r.slug), ['no-data-slug']);
  assert.deepEqual(report.views.zeroed, []);
  assert.deepEqual(report.views.updated, []);
});

test('buildSyncPlan：views_30d 欄位對「來源未涵蓋」的 slug 預設寫 0', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const last30dBySlug = new Map();
  const { updates, report } = buildSyncPlan({ articles, totalBySlug: null, last30dBySlug });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views_30d, 0);
  assert.deepEqual(report.views_30d.zeroed.map((r) => r.slug), ['no-data-slug']);
  assert.deepEqual(report.views_30d.keptExisting, []);
});

test('buildSyncPlan：zeroMissingTotal=true 強制把未涵蓋的 views 寫 0（對應 CLI --zero-missing）', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const totalBySlug = new Map();
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug,
    last30dBySlug: null,
    zeroMissingTotal: true,
  });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 0);
  assert.deepEqual(report.views.zeroed.map((r) => r.slug), ['no-data-slug']);
  assert.deepEqual(report.views.keptExisting, []);
});

test('buildSyncPlan：zeroMissing30d=false 強制把未涵蓋的 views_30d 跳過（對應 CLI --no-zero-missing）', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const last30dBySlug = new Map();
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug: null,
    last30dBySlug,
    zeroMissing30d: false,
  });

  assert.equal(updates.length, 0);
  assert.deepEqual(report.views_30d.keptExisting.map((r) => r.slug), ['no-data-slug']);
  assert.deepEqual(report.views_30d.zeroed, []);
});

test('buildSyncPlan：zeroMissingTotal=false 明確要求跳過（等同預設，驗證旗標可以雙向覆蓋）', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const totalBySlug = new Map();
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug,
    last30dBySlug: null,
    zeroMissingTotal: false,
  });

  assert.equal(updates.length, 0);
  assert.deepEqual(report.views.keptExisting.map((r) => r.slug), ['no-data-slug']);
});

// ── buildSyncPlan：累積值（views）不得倒退的保護 ───────────────────────────

test('buildSyncPlan：新值小於 Directus 現值時預設跳過，並記錄現值與新值', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 100]]);
  const currentViewsBySlug = new Map([['threads-api-tutorial', 500]]);
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug: null, currentViewsBySlug });

  assert.equal(updates.length, 0); // 跳過，不產生 PATCH
  assert.deepEqual(report.views.decreaseSkipped, [
    { id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學', currentValue: 500, newValue: 100 },
  ]);
  assert.deepEqual(report.views.updated, []);
});

test('buildSyncPlan：allowDecrease=true 時允許寫入比現值小的 views（對應 CLI --allow-decrease）', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 100]]);
  const currentViewsBySlug = new Map([['threads-api-tutorial', 500]]);
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug,
    last30dBySlug: null,
    currentViewsBySlug,
    allowDecrease: true,
  });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 100);
  assert.deepEqual(report.views.decreaseSkipped, []);
});

test('buildSyncPlan：新值等於現值不算下降，正常寫入', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 500]]);
  const currentViewsBySlug = new Map([['threads-api-tutorial', 500]]);
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug: null, currentViewsBySlug });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 500);
  assert.deepEqual(report.views.decreaseSkipped, []);
});

test('buildSyncPlan：現值為 null（欄位剛建立、從未同步過）不誤判為下降，正常寫入', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 5]]); // 數字很小，但沒有現值可比對，不能當成下降
  const currentViewsBySlug = new Map([['threads-api-tutorial', null]]);
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug: null, currentViewsBySlug });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 5);
  assert.deepEqual(report.views.decreaseSkipped, []);
});

test('buildSyncPlan：現值為 undefined（Map 裡沒有這個 slug 的紀錄）同樣不誤判為下降', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 5]]);
  const currentViewsBySlug = new Map(); // 沒有這個 slug 的現值紀錄
  const { updates, report } = buildSyncPlan({ articles, totalBySlug, last30dBySlug: null, currentViewsBySlug });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 5);
  assert.deepEqual(report.views.decreaseSkipped, []);
});

test('buildSyncPlan：currentViewsBySlug 傳 null（例如 views 欄位還不存在）完全停用下降檢查', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const totalBySlug = new Map([['threads-api-tutorial', 5]]);
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug,
    last30dBySlug: null,
    currentViewsBySlug: null,
  });

  assert.equal(updates.length, 1);
  assert.equal(updates[0].views, 5);
  assert.deepEqual(report.views.decreaseSkipped, []);
});

// ── buildSyncPlan：avg_engagement_seconds_30d（近 30 天平均停留秒數）─────────

test('buildSyncPlan：avgEngagementBySlug 有資料的 slug 正常寫入', () => {
  const articles = [
    { id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學' },
    { id: 18, slug: 'instagram-api-tutorial', title: 'IG API 教學' },
  ];
  const avgEngagementBySlug = new Map([['threads-api-tutorial', 8]]);
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug: null,
    last30dBySlug: null,
    avgEngagementBySlug,
  });

  assert.equal(updates.length, 1);
  const threads = updates.find((u) => u.slug === 'threads-api-tutorial');
  assert.equal(threads.avg_engagement_seconds_30d, 8);
  assert.deepEqual(report.avg_engagement_seconds_30d.updated, [
    { id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學', value: 8 },
  ]);
  assert.deepEqual(report.avg_engagement_seconds_30d.keptExisting, [
    { id: 18, slug: 'instagram-api-tutorial', title: 'IG API 教學' },
  ]);
});

test('buildSyncPlan：avgEngagementBySlug 未涵蓋的 slug 一律跳過保留現值，不會寫 0（跟 views_30d 的預設不同）', () => {
  const articles = [{ id: 1, slug: 'no-data-slug', title: '沒資料的文章' }];
  const avgEngagementBySlug = new Map(); // 空 Map：這次查詢完全沒涵蓋到這篇文章
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug: null,
    last30dBySlug: null,
    avgEngagementBySlug,
  });

  assert.equal(updates.length, 0);
  assert.deepEqual(report.avg_engagement_seconds_30d.keptExisting.map((r) => r.slug), ['no-data-slug']);
  assert.deepEqual(report.avg_engagement_seconds_30d.zeroed, []);
  assert.deepEqual(report.avg_engagement_seconds_30d.updated, []);
});

test('buildSyncPlan：avgEngagementBySlug 傳 null（例如沒有查這份資料）完全不動這個欄位', () => {
  const articles = [{ id: 1, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug: null,
    last30dBySlug: null,
    avgEngagementBySlug: null,
  });

  assert.equal(updates.length, 0);
  assert.deepEqual(report.avg_engagement_seconds_30d.updated, []);
  assert.deepEqual(report.avg_engagement_seconds_30d.keptExisting, []);
});

test('buildSyncPlan：三個欄位（views／views_30d／avg_engagement_seconds_30d）同時給資料時合併進同一筆 update', () => {
  const articles = [{ id: 17, slug: 'threads-api-tutorial', title: 'Threads API 教學' }];
  const { updates } = buildSyncPlan({
    articles,
    totalBySlug: new Map([['threads-api-tutorial', 1284]]),
    last30dBySlug: new Map([['threads-api-tutorial', 300]]),
    avgEngagementBySlug: new Map([['threads-api-tutorial', 8]]),
  });

  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0], {
    id: 17,
    slug: 'threads-api-tutorial',
    title: 'Threads API 教學',
    views: 1284,
    views_30d: 300,
    avg_engagement_seconds_30d: 8,
  });
});
