// 把 GA4 的文章瀏覽數同步回 Directus articles collection（views / views_30d / views_synced_at）。
//
// 兩種資料來源，選一種：
//   A. GA4 Data API（需要 GA4_PROPERTY_ID + GOOGLE_APPLICATION_CREDENTIALS service account）
//      套件：@google-analytics/data（裝成 devDependency，見 package.json）
//      未實測：這台機器沒有任何 Google 憑證，這條路徑完全沒有打過真的 API 驗證過，
//      是照官方 quickstart（https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries）
//      與 npm README（https://www.npmjs.com/package/@google-analytics/data）寫的。
//   B. CSV 匯入（--csv-total / --csv-30d）：吃 GA4 後台「報表 > 參與度 > 網頁和畫面」匯出的 CSV。
//      解析邏輯（tools/lib/ga4-views-lib.mjs 的 parseGa4Csv）也未實測，沒有真的匯出檔案對過格式。
//
// 全期間與近 30 天是兩次獨立查詢／兩份 CSV，因為 GA4 runReport 一次只能給一組日期區間：
//   - 全期間：--csv-total，或 API 模式下 dateRanges [{startDate: GA4_SINCE_DATE, endDate: 'today'}]
//     GA4_SINCE_DATE 預設 2015-08-14（GA4 官方文件承認的最早可能日期），但實際能查到多久以前的資料
//     取決於這個 GA4 資源設定的「資料保留」期間與建立時間，不是程式能保證的，請在文件裡告知使用者。
//   - 近 30 天：--csv-30d，或 API 模式下 dateRanges [{startDate: '30daysAgo', endDate: 'today'}]
//
// 流程：讀 GA4 資料 → 過濾 /blog/... 路徑 → 正規化（尾斜線/query/hash/大小寫）→ 套用 slug 別名表
// （tools/ga4-slug-aliases.json，處理改過 slug 的舊網址）→ 加總同一 slug → 對應 Directus 文章 →
// 印出對應表／不到文章的路徑／沒有資料的文章 → （--apply 才會）PATCH 回 Directus。
//
// 用法：
//   # CSV 模式（dry-run，預設）
//   node tools/sync-ga4-views.mjs --csv-total ga4-all-time.csv --csv-30d ga4-last-30d.csv
//
//   # CSV 欄名自動偵測不到時（例如 GA4 後台語系是中文，欄名不是英文），手動指定欄名：
//   node tools/sync-ga4-views.mjs --csv-total a.csv --csv-30d b.csv \
//     --path-col "頁面路徑" --views-col "瀏覽量"
//
//   # GA4 API 模式（dry-run，預設）
//   GA4_PROPERTY_ID=123456789 GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node tools/sync-ga4-views.mjs
//
//   # 真的寫回 Directus
//   DIRECTUS_TOKEN=xxx node tools/sync-ga4-views.mjs --csv-total a.csv --csv-30d b.csv --apply
//
// 完整說明（憑證怎麼申請、CSV 怎麼匯出）見 docs/ga4-views-sync.md。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  aggregateViewsBySlug,
  buildSyncPlan,
  findUnmatchedSlugs,
  parseGa4ApiRows,
  parseGa4Csv,
  remapSlugAliases,
} from './lib/ga4-views-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CMS = 'https://cms.aixwang.dev';
const DEFAULT_ALIASES_PATH = path.join(__dirname, 'ga4-slug-aliases.json');
// GA4 官方文件承認的服務最早日期；實際查得到多早的資料取決於這個 GA4 資源的資料保留設定。
const GA4_EARLIEST_POSSIBLE_DATE = '2015-08-14';

// ── 參數解析 ──────────────────────────────────────────────────────────────

const HELP_TEXT = `
用法：node tools/sync-ga4-views.mjs [選項]

資料來源（擇一，不給任何 --csv-* 就會走 GA4 Data API 模式）：
  --csv-total <path>       全期間 CSV（GA4 後台匯出，見 docs/ga4-views-sync.md）
  --csv-30d <path>         近 30 天 CSV
  --path-col <欄名>        手動指定 CSV 的路徑欄（自動偵測猜不到欄名時用）
  --views-col <欄名>       手動指定 CSV 的瀏覽數欄
  --since <YYYY-MM-DD>     API 模式下「全期間」查詢的起始日（預設 ${GA4_EARLIEST_POSSIBLE_DATE}）
  --aliases <path>         slug 別名表路徑（預設 ${DEFAULT_ALIASES_PATH}）

寫入行為：
  --apply                  真的 PATCH 回 Directus（預設只 dry-run，不寫入；需要 DIRECTUS_TOKEN）

未涵蓋 slug（GA4 資料裡完全沒有這篇文章）的處理方式（見 docs/ga4-views-sync.md）：
  預設：views（累積值）跳過、保留 Directus 現值；views_30d（近 30 天）寫 0。
  --zero-missing            強制兩個欄位遇到未涵蓋 slug 都寫 0
                             （只有在你確定這份匯出檔／查詢區間完整涵蓋所有文章時才該用；
                              對不完整的匯出檔用這個旗標會把 views 累積值洗成 0，不可逆）
  --no-zero-missing          強制兩個欄位遇到未涵蓋 slug 都跳過、保留現值（含 views_30d）
                             （--zero-missing 與 --no-zero-missing 不能同時給）

累積值（views）下降保護：
  預設：這次算出的 views 新值若比 Directus 目前存的值小，跳過該篇、印出警告，不寫入。
  --allow-decrease          允許寫入比現值小的 views（你確定新資料是對的、且流量真的倒退才用）

  --help, -h                印出這份說明
`.trim();

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

if (has('help') || has('h')) {
  console.log(HELP_TEXT);
  process.exit(0);
}

const apply = has('apply');
const csvTotalPath = flag('csv-total');
const csv30dPath = flag('csv-30d');
const aliasesPath = flag('aliases') || DEFAULT_ALIASES_PATH;
const sinceDate = flag('since') || GA4_EARLIEST_POSSIBLE_DATE;
const directusToken = process.env.DIRECTUS_TOKEN;
// 手動指定 CSV 欄名（例如中文介面匯出的 CSV，自動偵測猜不到欄名時的逃生門）。
// 見 tools/lib/ga4-views-lib.mjs 的 parseGa4Csv() 與 docs/ga4-views-sync.md「CSV 欄名對不到怎麼辦」。
const pathColumnName = flag('path-col');
const viewsColumnName = flag('views-col');

// 未涵蓋 slug 的處理方式：見 tools/lib/ga4-views-lib.mjs 的 buildSyncPlan() 開頭註解與
// docs/ga4-views-sync.md「未涵蓋資料與累積值保護」。undefined＝用 buildSyncPlan 的兩欄不同預設。
if (has('zero-missing') && has('no-zero-missing')) {
  console.error('--zero-missing 與 --no-zero-missing 不能同時給，語意互斥。');
  process.exit(1);
}
const zeroMissingFlag = has('zero-missing') ? true : has('no-zero-missing') ? false : undefined;
const allowDecrease = has('allow-decrease');

if (apply && !directusToken) {
  console.error('要 --apply 真的寫回 Directus，必須先設定 DIRECTUS_TOKEN 環境變數。');
  process.exit(1);
}

// ── 讀取 slug 別名表（舊 slug → 現在的 slug，處理改過 slug 的重導） ───────

function loadAliasMap(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`（沒有找到別名表 ${filePath}，視為沒有別名，跳過）`);
    return {};
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    console.error(`別名表 ${filePath} 格式不對，應該是 { "舊slug": "現在的slug" } 的物件，忽略。`);
    return {};
  } catch (err) {
    console.error(`讀別名表 ${filePath} 失敗：${err.message}，忽略。`);
    return {};
  }
}

// ── 資料來源 A：GA4 Data API ──────────────────────────────────────────────

/**
 * 透過 GA4 Data API 查詢 pagePath × screenPageViews。
 * 未實測：沒有 GA4_PROPERTY_ID / service account，這段程式碼從沒真的執行過。
 * 分頁：runReport 的 limit 預設回 10000 列，用 offset 迴圈把 rowCount 內的資料抓完，
 * 避免文章數／路徑變形數超過單頁上限時漏資料。
 */
async function fetchGa4ApiRows({ startDate, endDate }) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    throw new Error('缺少 GA4_PROPERTY_ID 環境變數（GA4 後台 Admin > Property Settings 看到的數字 ID）。');
  }

  let BetaAnalyticsDataClient;
  try {
    ({ BetaAnalyticsDataClient } = await import('@google-analytics/data'));
  } catch (err) {
    throw new Error(
      `載入 @google-analytics/data 失敗：${err.message}\n` +
        '確認已經 npm install（devDependency），且沒有在 Cloudflare 正式環境跑這支腳本（只在本機/CI 用）。',
    );
  }

  const client = new BetaAnalyticsDataClient();
  const pageSize = 10000;
  let offset = 0;
  let rowCount = Infinity;
  const allRows = [];

  while (offset < rowCount) {
    // eslint-disable-next-line no-await-in-loop
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      // 只同步正式站；排除 localhost 本機開發、Browser Agent 與預覽環境反覆載入。
      dimensionFilter: { filter: { fieldName: 'hostName', stringFilter: { matchType: 'EXACT', value: 'aixwang.dev', caseSensitive: false } } },
      limit: pageSize,
      offset,
    });
    rowCount = response.rowCount ?? 0;
    allRows.push(...parseGa4ApiRows(response));
    offset += pageSize;
  }

  return allRows;
}

// ── 資料來源 B：CSV ────────────────────────────────────────────────────────

function readCsvRows(filePath) {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`找不到 CSV 檔案：${absolute}`);
  }
  const text = fs.readFileSync(absolute, 'utf8');
  return parseGa4Csv(text, { pathColumnName, viewsColumnName });
}

// ── Directus：讀文章清單、寫回欄位 ─────────────────────────────────────────

const ARTICLES_BASE_FIELDS = 'id,slug,title,status';

async function requestArticles(fields) {
  const headers = directusToken ? { Authorization: `Bearer ${directusToken}` } : {};
  const url = directusToken
    ? `${CMS}/items/articles?fields=${fields}&limit=-1`
    : `${CMS}/items/articles?fields=${fields}&filter[status][_eq]=published&limit=-1`;
  return fetch(url, { headers });
}

/**
 * 讀 Directus 文章清單，並嘗試一併帶出目前的 views 值（給 buildSyncPlan 的累積值下降保護用）。
 * views 欄位可能還沒建立（要先跑 views:create-fields）：Directus 對查詢裡不存在的欄位一般會
 * 回錯誤而不是默默忽略，所以先試著帶 views 欄位查一次，失敗就自動重試不帶 views，
 * 不要讓整支腳本因為欄位還沒建立就掛掉——只是這種情況下沒有現值可比對，會停用下降保護。
 *
 * @returns {{ articles: Array, currentViewsBySlug: Map<string, number|null>|null }}
 *   currentViewsBySlug 為 null 代表這次沒有讀到現值（欄位不存在），buildSyncPlan 會停用下降保護。
 */
async function fetchArticlesWithCurrentViews() {
  let res = await requestArticles(`${ARTICLES_BASE_FIELDS},views`);
  let includedViews = true;

  if (!res.ok) {
    const errText = (await res.text()).slice(0, 300);
    console.log(
      `（讀取文章清單時帶 views 欄位失敗，HTTP ${res.status}：${errText}）\n` +
        '（很可能是 views 欄位還沒建立：請先跑 `npm run views:create-fields -- --apply`。' +
        '本次先改成不帶 views 欄位重新查詢，累積值下降保護這次會停用。）',
    );
    res = await requestArticles(ARTICLES_BASE_FIELDS);
    includedViews = false;
  }

  if (!res.ok) {
    throw new Error(`讀 Directus 文章清單失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  }

  const { data } = await res.json();
  if (!directusToken) {
    console.log(`（沒有 DIRECTUS_TOKEN，只能看到公開的已發布文章：${data.length} 篇，看不到草稿）`);
  }

  const currentViewsBySlug = includedViews ? new Map(data.map((a) => [a.slug, a.views])) : null;
  return { articles: data, currentViewsBySlug };
}

async function patchArticle(id, payload) {
  const res = await fetch(`${CMS}/items/articles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${directusToken}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  }
}

// ── 主流程 ──────────────────────────────────────────────────────────────

function printMatchTable(label, matched, appliedFrom) {
  console.log(`\n【${label}】GA4 路徑 → 文章 slug 對應表（原始列，未套用文章清單比對）`);
  if (matched.length === 0) {
    console.log('  （沒有任何列對應到 /blog/ 底下的路徑）');
    return;
  }
  for (const row of matched) {
    console.log(`  ${row.path}  →  slug=${row.slug}  views=${row.views}`);
  }
  if (appliedFrom.size > 0) {
    console.log('  別名合併：');
    for (const [canonical, fromSlugs] of appliedFrom.entries()) {
      console.log(`    ${fromSlugs.join(', ')}  →  ${canonical}`);
    }
  }
}

/**
 * 印出單一欄位（views 或 views_30d）的同步計畫分段報告，讓使用者按 --apply 前能一眼看出
 * 有沒有東西會被洗掉。四段分別對應 buildSyncPlan() 回傳的 report.{field} 四個分類。
 */
function printFieldReport(fieldLabel, fieldReport, { showDecrease }) {
  const { updated, keptExisting, zeroed, decreaseSkipped } = fieldReport;
  console.log(`\n── ${fieldLabel} ──`);

  if (updated.length > 0) {
    console.log(`  有資料，會更新（${updated.length} 篇）：`);
    updated.forEach((r) => console.log(`    [id=${r.id}] ${r.slug}（${r.title}）→ ${r.value}`));
  }

  if (keptExisting.length > 0) {
    console.log(`  GA4 這次的資料沒涵蓋到，保留 Directus 現值不動（${keptExisting.length} 篇）：`);
    keptExisting.forEach((r) => console.log(`    [id=${r.id}] ${r.slug}（${r.title}）`));
  }

  if (showDecrease && decreaseSkipped.length > 0) {
    console.log(
      `  新算出的值比 Directus 現值小，已跳過、不會覆蓋（${decreaseSkipped.length} 篇；` +
        '累積值理論上只增不減，變小多半是資料來源不完整；確定要寫入請加 --allow-decrease）：',
    );
    decreaseSkipped.forEach((r) =>
      console.log(`    [id=${r.id}] ${r.slug}（${r.title}）現值=${r.currentValue} → 這次算出=${r.newValue}`),
    );
  }

  if (zeroed.length > 0) {
    console.log(`  GA4 這次的資料沒涵蓋到，明確寫入 0（${zeroed.length} 篇）：`);
    zeroed.forEach((r) => console.log(`    [id=${r.id}] ${r.slug}（${r.title}）`));
  }

  if (
    updated.length === 0 &&
    keptExisting.length === 0 &&
    zeroed.length === 0 &&
    (!showDecrease || decreaseSkipped.length === 0)
  ) {
    console.log('  （沒有任何文章要處理這個欄位）');
  }
}

function printUnmatched(label, unmatchedBlogPaths, unmatchedSlugs) {
  console.log(`\n【${label}】對不到任何文章的路徑`);
  if (unmatchedBlogPaths.length > 0) {
    console.log('  /blog/ 列表頁本身（不算文章，已排除）：');
    for (const row of unmatchedBlogPaths) {
      console.log(`    ${row.normalizedPath}  views=${row.views}`);
    }
  }
  if (unmatchedSlugs.length > 0) {
    console.log('  slug 在 Directus 文章清單裡查無此文章：');
    for (const slug of unmatchedSlugs) {
      console.log(`    /blog/${slug}/`);
    }
    console.log(
      '  （可能是已下架／改過 slug 未加進 tools/ga4-slug-aliases.json／從未發布過的頁面 404 流量，逐一確認）',
    );
  } else {
    console.log('  （沒有）');
  }
}

async function main() {
  console.log(`Directus：${CMS}／collection=articles`);
  console.log(apply ? '模式：--apply（會真的 PATCH 回 Directus）' : '模式：dry-run（預設，只印出計畫，不會寫入）');

  const aliasMap = loadAliasMap(aliasesPath);
  if (Object.keys(aliasMap).length > 0) {
    console.log(`已載入 slug 別名表（${aliasesPath}）：`, aliasMap);
  }

  const usingCsv = Boolean(csvTotalPath || csv30dPath);
  const usingApi = !usingCsv;

  let totalRows = null;
  let last30dRows = null;

  if (usingCsv) {
    if (csvTotalPath) {
      console.log(`\n讀取全期間 CSV：${csvTotalPath}`);
      totalRows = readCsvRows(csvTotalPath);
      console.log(`  共 ${totalRows.length} 列`);
    } else {
      console.log('\n沒有給 --csv-total，這次不更新 views 欄位。');
    }
    if (csv30dPath) {
      console.log(`讀取近 30 天 CSV：${csv30dPath}`);
      last30dRows = readCsvRows(csv30dPath);
      console.log(`  共 ${last30dRows.length} 列`);
    } else {
      console.log('沒有給 --csv-30d，這次不更新 views_30d 欄位。');
    }
  } else if (usingApi) {
    console.log(`\n使用 GA4 Data API，查詢區間：全期間（${sinceDate} ~ today）與近 30 天（30daysAgo ~ today）`);
    totalRows = await fetchGa4ApiRows({ startDate: sinceDate, endDate: 'today' });
    console.log(`  全期間共 ${totalRows.length} 列`);
    last30dRows = await fetchGa4ApiRows({ startDate: '30daysAgo', endDate: 'today' });
    console.log(`  近 30 天共 ${last30dRows.length} 列`);
  }

  const { articles, currentViewsBySlug } = await fetchArticlesWithCurrentViews();
  console.log(`\nDirectus 文章清單：${articles.length} 篇`);

  let totalBySlug = null;
  let last30dBySlug = null;

  if (totalRows) {
    const agg = aggregateViewsBySlug(totalRows);
    const { bySlug, appliedFrom } = remapSlugAliases(agg.bySlug, aliasMap);
    totalBySlug = bySlug;
    printMatchTable('全期間', agg.matched, appliedFrom);
    const unmatched = findUnmatchedSlugs(bySlug, articles);
    printUnmatched('全期間', agg.unmatchedBlogPaths, unmatched);
    console.log(`  （另外有 ${agg.excludedNonBlogCount} 列不是 /blog/ 開頭，已略過，不列出）`);
  }

  if (last30dRows) {
    const agg = aggregateViewsBySlug(last30dRows);
    const { bySlug, appliedFrom } = remapSlugAliases(agg.bySlug, aliasMap);
    last30dBySlug = bySlug;
    printMatchTable('近 30 天', agg.matched, appliedFrom);
    const unmatched = findUnmatchedSlugs(bySlug, articles);
    printUnmatched('近 30 天', agg.unmatchedBlogPaths, unmatched);
    console.log(`  （另外有 ${agg.excludedNonBlogCount} 列不是 /blog/ 開頭，已略過，不列出）`);
  }

  const { updates, report } = buildSyncPlan({
    articles,
    totalBySlug,
    last30dBySlug,
    currentViewsBySlug,
    zeroMissingTotal: zeroMissingFlag,
    zeroMissing30d: zeroMissingFlag,
    allowDecrease,
  });

  console.log('\n【同步計畫】');
  console.log(
    `模式：未涵蓋 slug → views ${
      zeroMissingFlag === true ? '強制寫 0（--zero-missing）' : zeroMissingFlag === false ? '強制跳過（--no-zero-missing）' : '預設跳過保留現值'
    }／views_30d ${
      zeroMissingFlag === true ? '強制寫 0（--zero-missing）' : zeroMissingFlag === false ? '強制跳過（--no-zero-missing）' : '預設寫 0'
    }；累積值下降保護：${allowDecrease ? '關閉（--allow-decrease）' : currentViewsBySlug ? '開啟' : '停用（沒有讀到 views 現值）'}`,
  );

  if (totalBySlug) {
    printFieldReport('views（累積值）', report.views, { showDecrease: true });
  }
  if (last30dBySlug) {
    printFieldReport('views_30d（近 30 天）', report.views_30d, { showDecrease: false });
  }

  console.log('\n實際會送出的 PATCH（依文章 id 排序）：');
  if (updates.length === 0) {
    console.log('  （沒有任何文章有欄位要更新）');
  }
  for (const u of [...updates].sort((a, b) => a.id - b.id)) {
    const parts = [];
    if ('views' in u) parts.push(`views=${u.views}`);
    if ('views_30d' in u) parts.push(`views_30d=${u.views_30d}`);
    console.log(`  [id=${u.id}] ${u.slug}（${u.title}）── ${parts.join('，')}`);
  }

  if (!apply) {
    console.log('\n這是 dry-run，沒有任何資料被寫入 Directus。要真的寫入，加 --apply 並帶 DIRECTUS_TOKEN。');
    return;
  }

  console.log(`\n開始寫回 Directus（共 ${updates.length} 篇）…`);
  const syncedAt = new Date().toISOString();
  let okCount = 0;
  let failCount = 0;
  for (const u of updates) {
    const payload = { views_synced_at: syncedAt };
    if ('views' in u) payload.views = u.views;
    if ('views_30d' in u) payload.views_30d = u.views_30d;
    try {
      // eslint-disable-next-line no-await-in-loop
      await patchArticle(u.id, payload);
      okCount += 1;
      console.log(`  [id=${u.id}] ${u.slug} → 成功`);
    } catch (err) {
      failCount += 1;
      console.log(`  [id=${u.id}] ${u.slug} → 失敗：${err.message}`);
    }
  }
  console.log(`\n完成。成功 ${okCount} 篇，失敗 ${failCount} 篇。`);
}

main().catch((err) => {
  console.error(`\n執行失敗：${err.message}`);
  process.exit(1);
});
