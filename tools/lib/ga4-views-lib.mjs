// GA4 → Directus 瀏覽數同步的純邏輯（路徑正規化、slug 對應、CSV 解析、彙總）。
// 刻意跟 CLI 腳本（tools/sync-ga4-views.mjs）分開放，方便寫測試：
// 這裡完全不做網路請求、不讀環境變數、不呼叫 process.exit。
//
// 背景事實（已查證，見 tools/sync-ga4-views.mjs 開頭註解）：
//   - 本站文章網址固定是 /blog/<slug>/（有尾斜線；沒帶尾斜線會被 307 導到有斜線版本）
//   - 文章清單只有兩層：/blog/（列表頁，要排除）與 /blog/<slug>/（單篇），沒有分類或分頁子路徑

const BLOG_PREFIX = '/blog/';

/**
 * 把 GA4 回傳／CSV 裡的一個路徑字串正規化成統一格式，方便比對。
 * 規則：
 *   - 去掉 query string（?...）與 hash（#...）
 *   - 嘗試 decodeURIComponent（GA4 有時會把中文或特殊字元編碼）；解碼失敗就用原字串，不丟例外
 *   - 全部轉小寫（slug 目前都是小寫英數＋連字號）
 *   - 補開頭斜線、把連續斜線收成一個
 *   - 統一補上尾斜線（比照本站 canonical 網址規則）
 * 不是字串或空字串回傳 null。
 */
export function normalizeGa4Path(rawPath) {
  if (typeof rawPath !== 'string') return null;
  let path = rawPath.trim();
  if (path === '') return null;

  path = path.split('#')[0].split('?')[0];

  try {
    path = decodeURIComponent(path);
  } catch {
    // 解碼失敗（例如不合法的 % 編碼）就沿用原字串，不要整筆丟掉
  }

  path = path.toLowerCase();
  if (!path.startsWith('/')) path = `/${path}`;
  path = path.replace(/\/{2,}/g, '/');
  if (!path.endsWith('/')) path = `${path}/`;

  return path;
}

/**
 * 從「已經正規化過」的路徑抽出文章 slug。
 * - 不是 /blog/ 開頭 → null（非文章頁）
 * - 正規化後恰好是 /blog/ → null（列表頁本身，要排除）
 * - /blog/<slug>/(任何更深的子路徑) → 只取第一段當 slug
 *   （本站文章沒有巢狀路徑；若 GA4 出現這種資料，視為同一篇文章的變形路徑一併歸戶）
 */
export function extractBlogSlug(normalizedPath) {
  if (typeof normalizedPath !== 'string' || !normalizedPath.startsWith(BLOG_PREFIX)) return null;
  const rest = normalizedPath.slice(BLOG_PREFIX.length);
  if (rest === '' || rest === '/') return null;
  const slug = rest.split('/')[0];
  return slug || null;
}

/** normalizeGa4Path + extractBlogSlug 的合併捷徑。 */
export function pathToSlug(rawPath) {
  const normalized = normalizeGa4Path(rawPath);
  if (!normalized) return null;
  return extractBlogSlug(normalized);
}

/**
 * GA4「網頁和畫面」報表用的平均停留秒數算法：userEngagementDuration（累積互動秒數）÷
 * activeUsers（不是除以瀏覽數）。四捨五入成整數秒。
 * users 為 0（沒有使用者資料，或除以 0）回傳 null，代表「沒有平均值可算」，不是 0 秒。
 * 已用真實 GA4 API 實測驗證過公式（近 7 天範例）：
 *   /services/one-on-one/       duration=189 users=2 → 94.5s
 *   /blog/threads-api-tutorial/ duration=69  users=9 → 7.7s
 */
export function computeAvgEngagementSeconds(duration, users) {
  const numDuration = Number(duration ?? 0);
  const numUsers = Number(users ?? 0);
  if (!numUsers) return null;
  return Math.round(numDuration / numUsers);
}

/**
 * 把一份 GA4 資料列（[{path, views}, ...]）依 slug 加總。
 * 回傳：
 *   - bySlug: Map(slug -> 總瀏覽數)
 *   - matched: [{ path, normalizedPath, slug, views }]  ── 對應到 /blog/ 底下某篇文章的原始列
 *   - unmatchedBlogPaths: [{ path, normalizedPath, views }] ── 落在 /blog/ 底下但抽不出 slug（含列表頁本身）
 *   - excludedNonBlogCount: 數字 ── 完全不是 /blog/ 開頭、直接略過的列數
 */
export function aggregateViewsBySlug(rows) {
  const bySlug = new Map();
  const matched = [];
  const unmatchedBlogPaths = [];
  let excludedNonBlogCount = 0;

  for (const row of rows ?? []) {
    const path = row?.path;
    const views = Number(row?.views ?? 0);
    const normalized = normalizeGa4Path(path);

    if (!normalized || !normalized.startsWith(BLOG_PREFIX)) {
      excludedNonBlogCount += 1;
      continue;
    }

    const slug = extractBlogSlug(normalized);
    if (!slug) {
      unmatchedBlogPaths.push({ path, normalizedPath: normalized, views });
      continue;
    }

    bySlug.set(slug, (bySlug.get(slug) ?? 0) + views);
    matched.push({ path, normalizedPath: normalized, slug, views });
  }

  return { bySlug, matched, unmatchedBlogPaths, excludedNonBlogCount };
}

/**
 * 把一份 GA4 互動資料列（[{path, duration, users}, ...]，duration=userEngagementDuration
 * 累積秒數、users=activeUsers）依 slug 分別加總 duration 與 users（刻意不在這裡先算平均——
 * 平均值不能直接相加，要等套用完 remapSlugAliases 的別名合併後才能算，見 buildAvgEngagementSecondsBySlug）。
 * 路徑正規化／slug 抽取規則與 aggregateViewsBySlug 完全一致。
 * 回傳：
 *   - durationBySlug / usersBySlug: Map(slug -> 加總後的秒數／使用者數)
 *   - matched: [{ path, normalizedPath, slug, duration, users }]
 *   - unmatchedBlogPaths: [{ path, normalizedPath, duration, users }]
 *   - excludedNonBlogCount: 數字
 */
export function aggregateEngagementBySlug(rows) {
  const durationBySlug = new Map();
  const usersBySlug = new Map();
  const matched = [];
  const unmatchedBlogPaths = [];
  let excludedNonBlogCount = 0;

  for (const row of rows ?? []) {
    const path = row?.path;
    const duration = Number(row?.duration ?? 0);
    const users = Number(row?.users ?? 0);
    const normalized = normalizeGa4Path(path);

    if (!normalized || !normalized.startsWith(BLOG_PREFIX)) {
      excludedNonBlogCount += 1;
      continue;
    }

    const slug = extractBlogSlug(normalized);
    if (!slug) {
      unmatchedBlogPaths.push({ path, normalizedPath: normalized, duration, users });
      continue;
    }

    durationBySlug.set(slug, (durationBySlug.get(slug) ?? 0) + duration);
    usersBySlug.set(slug, (usersBySlug.get(slug) ?? 0) + users);
    matched.push({ path, normalizedPath: normalized, slug, duration, users });
  }

  return { durationBySlug, usersBySlug, matched, unmatchedBlogPaths, excludedNonBlogCount };
}

/**
 * 把「依 slug 加總後的 duration／users」（套用過 remapSlugAliases 別名合併之後）換算成
 * 每個 slug 的平均停留秒數。users 為 0 的 slug 不會出現在回傳的 Map 裡（沒有使用者資料時
 * 平均秒數沒有意義，不是 0 秒；要不要在同步計畫裡補現值或跳過，交給 buildSyncPlan 決定）。
 *
 * @param {Map<string, number>} durationBySlug
 * @param {Map<string, number>} usersBySlug
 * @returns {Map<string, number>} slug -> 平均停留秒數（四捨五入整數）
 */
export function buildAvgEngagementSecondsBySlug(durationBySlug, usersBySlug) {
  const result = new Map();
  for (const [slug, duration] of (durationBySlug ?? new Map()).entries()) {
    const users = usersBySlug?.get(slug) ?? 0;
    const avg = computeAvgEngagementSeconds(duration, users);
    if (avg !== null) result.set(slug, avg);
  }
  return result;
}

/**
 * 把 GA4 Data API runReport() 的回應（dimensions=[pagePath], metrics=[screenPageViews]）
 * 轉成 aggregateViewsBySlug() 吃的 [{path, views}] 格式。
 * 未實測：這是照官方 quickstart 範例（dimensionValues[0].value / metricValues[0].value）推的形狀，
 * 沒有真的打過 API 驗證過完整回應結構。
 */
export function parseGa4ApiRows(response) {
  const rows = response?.rows ?? [];
  return rows.map((row) => ({
    path: row?.dimensionValues?.[0]?.value ?? '',
    views: Number(row?.metricValues?.[0]?.value ?? 0),
  }));
}

/**
 * 把 GA4 Data API runReport() 的回應轉成同時含 views／duration／users 的
 * [{path, views, duration, users}] 格式，供 aggregateViewsBySlug 與 aggregateEngagementBySlug
 * 共用同一次查詢結果，不用為了平均停留秒數多打一次 API。
 * 已用真實 GA4 API 實測驗證過：pagePath 可以跟 userEngagementDuration、activeUsers 放在
 * 同一個 runReport 呼叫裡查詢。
 *
 * 呼叫端下 metrics 時**順序必須是** [screenPageViews, userEngagementDuration, activeUsers]，
 * 這裡依 metricValues 的陣列順序（而非欄名）取值，順序對不上會取到錯的數字。
 */
export function parseGa4ApiRowsWithEngagement(response) {
  const rows = response?.rows ?? [];
  return rows.map((row) => ({
    path: row?.dimensionValues?.[0]?.value ?? '',
    views: Number(row?.metricValues?.[0]?.value ?? 0),
    duration: Number(row?.metricValues?.[1]?.value ?? 0),
    users: Number(row?.metricValues?.[2]?.value ?? 0),
  }));
}

/** 陽春 CSV 欄位切分：支援雙引號包欄位、欄位內逗號、"" 轉義引號。 */
export function splitCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.trim());
}

// 中文欄名候選字樣：這是我推測的 GA4 中文介面用詞，**沒有拿真實的中文 GA4 匯出檔驗證過**。
// 如果實際欄名跟這裡不符，請用 parseGa4Csv() 的 pathColumnName / viewsColumnName 參數
// （CLI 是 --path-col / --views-col）手動指定，不要相信這份清單一定正確。
// 比對方式是「欄名去空白後包含這個字串」，不分大小寫（中文沒有大小寫，但英文候選共用同一套比對函式）。
const CHINESE_PATH_CANDIDATES = ['網頁路徑', '頁面路徑', '網頁', '路徑'];
const CHINESE_VIEWS_CANDIDATES = ['觀看次數', '檢視次數', '瀏覽次數', '瀏覽量', '查看次數'];

/** 手動指定欄名的比對規則：去頭尾空白、不分大小寫、用「欄名是否包含這段字」比對。 */
function cellIncludes(cell, wanted) {
  if (!wanted) return false;
  return cell.trim().toLowerCase().includes(String(wanted).trim().toLowerCase());
}

/**
 * 依優先序找出符合的欄位索引：使用者指定 > 英文精確比對 > 中文候選（未驗證）> 英文寬鬆比對。
 * tiers 是「由高到低優先序」排列的比對函式陣列，回傳第一個「有任何欄位命中」的 tier 所命中的索引。
 */
function findColumnIndexByPriority(headerCells, tiers) {
  for (const tier of tiers) {
    const idx = headerCells.findIndex(tier);
    if (idx !== -1) return idx;
  }
  return -1;
}

/** 建立「路徑欄」的優先序比對 tiers。 */
function buildPathTiers(pathColumnName) {
  const tiers = [];
  if (pathColumnName) tiers.push((c) => cellIncludes(c, pathColumnName));
  tiers.push((c) => /^page path/i.test(c.trim())); // 英文精確：GA4 官方欄名固定以 "Page path" 開頭
  tiers.push((c) => CHINESE_PATH_CANDIDATES.some((k) => c.includes(k))); // 中文候選（未驗證，見檔案上方常數註解）
  tiers.push((c) => /path/i.test(c)); // 英文寬鬆比對：保底，涵蓋非標準命名但含 "path" 字樣的欄位
  return tiers;
}

/** 建立「瀏覽數欄」的優先序比對 tiers。 */
function buildViewsTiers(viewsColumnName) {
  const tiers = [];
  if (viewsColumnName) tiers.push((c) => cellIncludes(c, viewsColumnName));
  // 英文精確：欄名恰好是 "Views"。GA4 可能同時匯出 Views / Active users 等多欄，
  // 用精確比對可避免抓錯到別的欄位（例如「使用者參與度」「工作階段」這類容易被誤判成瀏覽數的欄位）。
  tiers.push((c) => /^views$/i.test(c.trim()));
  tiers.push((c) => CHINESE_VIEWS_CANDIDATES.some((k) => c.includes(k))); // 中文候選（未驗證，見檔案上方常數註解）
  tiers.push((c) => /view/i.test(c)); // 英文寬鬆比對：保底
  return tiers;
}

/**
 * 解析 GA4 後台「網頁和畫面」報表匯出的 CSV。
 *
 * 未實測：手上沒有 GA4 帳號可以真的匯出一份 CSV 來對，這段解析邏輯是照 GA4 匯出報表的一般已知格式
 * （開頭幾行 # 開頭或空白的 metadata、標題列位置不固定、逗號分隔、數字欄位可能有千分位逗號＋引號）寫的，
 * 沒有拿真實檔案驗證過。中文介面的欄名候選（CHINESE_PATH_CANDIDATES / CHINESE_VIEWS_CANDIDATES）
 * 更是純粹推測，沒有驗證過。
 *
 * 容錯策略：找「同時含路徑欄與瀏覽數欄可辨識欄名」的那一列當標題列，欄位比對依優先序
 * 使用者指定（pathColumnName / viewsColumnName）> 英文精確比對 > 中文候選（未驗證）> 英文寬鬆比對。
 * 全部都找不到就丟明確錯誤，並把檔案前 15 行原始內容印在錯誤訊息裡，讓使用者能自己判斷實際欄名、
 * 改用 pathColumnName / viewsColumnName 手動指定，不要用猜的欄位順序硬讀。
 *
 * @param {string} csvText
 * @param {object} [options]
 * @param {string} [options.pathColumnName] 手動指定「哪一欄是網頁路徑」，比對規則是欄名去空白後
 *        包含這個字串（不分大小寫）。對應 CLI 的 --path-col。優先序最高，蓋過所有自動偵測。
 * @param {string} [options.viewsColumnName] 手動指定「哪一欄是瀏覽數」，比對規則同上。
 *        對應 CLI 的 --views-col。優先序最高，蓋過所有自動偵測。
 */
export function parseGa4Csv(csvText, options = {}) {
  const { pathColumnName, viewsColumnName } = options ?? {};

  if (typeof csvText !== 'string' || csvText.trim() === '') {
    throw new Error('CSV 內容是空的。');
  }

  const lines = csvText.split(/\r\n|\n|\r/);
  const pathTiers = buildPathTiers(pathColumnName);
  const viewsTiers = buildViewsTiers(viewsColumnName);

  let headerIndex = -1;
  let headerCells = null;
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim() === '' || raw.trim().startsWith('#')) continue;
    const cells = splitCsvLine(raw);
    const hasPathCol = pathTiers.some((tier) => cells.some(tier));
    const hasViewsCol = viewsTiers.some((tier) => cells.some(tier));
    if (hasPathCol && hasViewsCol) {
      headerIndex = i;
      headerCells = cells;
      break;
    }
  }

  const rawPreview = lines
    .slice(0, 15)
    .map((l, idx) => `  ${idx + 1}: ${l}`)
    .join('\n');

  if (headerIndex === -1) {
    throw new Error(
      '找不到 CSV 標題列：這份檔案裡沒有任何一列同時出現可辨識的「網頁路徑」欄與「瀏覽數」欄欄名' +
        '（試過英文 path/view 字樣，以及內建但未驗證的中文候選字樣都比對不到）。\n' +
        '請從下面印出的檔案前 15 行原始內容裡，自己找出網頁路徑欄與瀏覽次數欄實際的欄名，' +
        '用 --path-col 與 --views-col 參數指定（例如：--path-col "頁面路徑" --views-col "瀏覽量"）。\n\n' +
        `${rawPreview}`,
    );
  }

  const pathColIdx = findColumnIndexByPriority(headerCells, pathTiers);
  const viewsColIdx = findColumnIndexByPriority(headerCells, viewsTiers);
  if (pathColIdx === -1 || viewsColIdx === -1) {
    throw new Error(
      '標題列找到了，但抓不到 path 欄或 views 欄的欄位索引，CSV 格式可能跟預期不同。' +
        '可以用 --path-col / --views-col 手動指定欄名。\n\n' +
        `檔案前 15 行內容：\n${rawPreview}`,
    );
  }

  const rows = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || raw.trim() === '' || raw.trim().startsWith('#')) continue;
    const cells = splitCsvLine(raw);
    if (cells.length <= Math.max(pathColIdx, viewsColIdx)) continue;

    const path = cells[pathColIdx];
    const viewsRaw = cells[viewsColIdx].replace(/,/g, '');
    const views = Number(viewsRaw);
    if (!path || Number.isNaN(views)) continue;

    rows.push({ path, views });
  }

  return rows;
}

/**
 * 把「GA4 依 slug 加總後的資料」對到 Directus 文章清單，組出同步計畫。
 *
 * 資料安全保護（詳見 docs/ga4-views-sync.md「未涵蓋資料與累積值保護」一節）：
 *
 *   1. GA4 來源資料裡沒有某篇文章的 slug，不代表這篇文章「真的是 0」——常見原因是這次匯出的
 *      CSV 只有前 N 列，或查詢日期區間沒涵蓋到這篇文章的流量。兩個欄位的預設行為刻意不同：
 *        - `views`（累積值）：預設**跳過**未涵蓋的 slug，不寫入該欄位、保留 Directus 現值。
 *          累積值不該因為一份不完整的匯出檔而被砍成 0。
 *        - `views_30d`（近 30 天滾動值）：預設**寫 0**。一篇文章近 30 天沒有任何列，本來就代表
 *          近 30 天沒流量，跳過反而會讓過期的舊數字繼續留著。
 *      兩者都能用 `zeroMissingTotal` / `zeroMissing30d` 參數整支覆蓋（undefined＝用上述預設、
 *      true＝強制寫 0、false＝強制跳過），對應 CLI 的 `--zero-missing` / `--no-zero-missing`。
 *
 *   2. `views` 是累積值，理論上只會增加。若這次算出的新值比 Directus 目前存的值還小，
 *      預設**跳過該篇並記錄進 `report.views.decreaseSkipped`**（不覆蓋、不寫入），因為變小幾乎
 *      必然代表這次的資料來源不完整或抓錯欄位，而不是真的流量倒退；帶 `allowDecrease: true`
 *      才會允許寫入變小的值（對應 CLI 的 `--allow-decrease`）。`views_30d` 是滾動值，本來就可能
 *      合理地變小（例如流量退燒），不做這項檢查。
 *      現值來源是 `currentViewsBySlug`；值為 `null`／`undefined`（欄位剛建立、從未同步過、
 *      或呼叫端根本沒有讀到現值）一律視為「沒有現值可比較」，不當作下降處理。
 *
 *   3. `avg_engagement_seconds_30d`（近 30 天平均停留秒數）未涵蓋的 slug 一律**跳過、保留現值**，
 *      沒有 `zeroMissing` 旗標可覆蓋。理由跟 `views_30d` 不同：這是平均值不是次數，「這次沒資料」
 *      沒辦法區分是「真的沒有使用者互動」還是「這次查詢/資料來源沒涵蓋到」，寫 0 秒會誤導成
 *      「使用者平均待了 0 秒」；不像 `views_30d` 缺資料時「0 次瀏覽」在語意上就是正確答案。
 *      也不需要 `allowDecrease` 這類保護，因為它是每次重算就整個覆蓋的滾動平均，不是累積值。
 *
 * @param {object} params
 * @param {Array<{id: number|string, slug: string, title?: string}>} params.articles Directus 文章清單
 * @param {Map<string, number>|null} params.totalBySlug 全期間資料（沒有這個資料來源就傳 null，完全不動 views 欄位）
 * @param {Map<string, number>|null} params.last30dBySlug 近 30 天資料（沒有就傳 null，完全不動 views_30d 欄位）
 * @param {Map<string, number>|null} [params.avgEngagementBySlug] 近 30 天平均停留秒數（見
 *        buildAvgEngagementSecondsBySlug），沒有這個資料來源就傳 null（或不傳），完全不動
 *        avg_engagement_seconds_30d 欄位。
 * @param {Map<string, number|null|undefined>|null} [params.currentViewsBySlug] Directus 目前的 views 值
 *        （slug → 現值）。傳 `null`（預設）代表沒有讀到現值（例如 views 欄位還不存在），
 *        此時完全不做累積值下降保護。Map 裡個別 slug 的值是 `null`／`undefined` 一樣視為沒有現值。
 * @param {boolean} [params.zeroMissingTotal] views 欄位遇到「來源未涵蓋的 slug」時的行為：
 *        `undefined`（預設）＝跳過、保留現值；`true`＝強制寫 0；`false`＝強制跳過。
 * @param {boolean} [params.zeroMissing30d] views_30d 欄位遇到「來源未涵蓋的 slug」時的行為：
 *        `undefined`（預設）＝寫 0；`true`＝強制寫 0；`false`＝強制跳過。
 * @param {boolean} [params.allowDecrease] `true` 時允許 views 寫入比 Directus 現值小的數字（預設 `false`）。
 * @returns {{
 *   updates: Array<{id, slug, title, views?: number, views_30d?: number, avg_engagement_seconds_30d?: number}>,
 *   report: {
 *     views: {
 *       updated: Array<{id, slug, title, value: number}>,
 *       keptExisting: Array<{id, slug, title}>,
 *       zeroed: Array<{id, slug, title}>,
 *       decreaseSkipped: Array<{id, slug, title, currentValue: number, newValue: number}>,
 *     },
 *     views_30d: {
 *       updated: Array<{id, slug, title, value: number}>,
 *       keptExisting: Array<{id, slug, title}>,
 *       zeroed: Array<{id, slug, title}>,
 *     },
 *     avg_engagement_seconds_30d: {
 *       updated: Array<{id, slug, title, value: number}>,
 *       keptExisting: Array<{id, slug, title}>,
 *       zeroed: Array<{id, slug, title}>,
 *       decreaseSkipped: Array<{id, slug, title, currentValue: number, newValue: number}>,
 *     },
 *   },
 * }}
 */
export function buildSyncPlan({
  articles,
  totalBySlug,
  last30dBySlug,
  avgEngagementBySlug = null,
  currentViewsBySlug = null,
  zeroMissingTotal,
  zeroMissing30d,
  allowDecrease = false,
}) {
  const updates = [];
  const report = {
    views: { updated: [], keptExisting: [], zeroed: [], decreaseSkipped: [] },
    views_30d: { updated: [], keptExisting: [], zeroed: [] },
    // zeroed／decreaseSkipped 這兩欄一直維持空陣列（見上方註解第 3 點：這個欄位未涵蓋一律跳過、
    // 不做下降保護），保留跟另外兩個欄位一致的形狀，方便呼叫端共用同一套報表列印邏輯。
    avg_engagement_seconds_30d: { updated: [], keptExisting: [], zeroed: [], decreaseSkipped: [] },
  };

  // 兩個欄位的「未涵蓋 slug」預設行為刻意不同，見函式上方註解。
  const effectiveZeroMissingTotal = zeroMissingTotal ?? false;
  const effectiveZeroMissing30d = zeroMissing30d ?? true;

  for (const article of articles ?? []) {
    const { id, slug, title } = article;
    const update = { id, slug, title };
    let touched = false;

    if (totalBySlug) {
      const hasData = totalBySlug.has(slug);
      if (hasData) {
        const newValue = totalBySlug.get(slug);
        const currentValueRaw = currentViewsBySlug ? currentViewsBySlug.get(slug) : undefined;
        const hasCurrentValue = currentValueRaw !== null && currentValueRaw !== undefined;

        if (hasCurrentValue && newValue < currentValueRaw && !allowDecrease) {
          report.views.decreaseSkipped.push({ id, slug, title, currentValue: currentValueRaw, newValue });
        } else {
          update.views = newValue;
          touched = true;
          report.views.updated.push({ id, slug, title, value: newValue });
        }
      } else if (effectiveZeroMissingTotal) {
        update.views = 0;
        touched = true;
        report.views.zeroed.push({ id, slug, title });
      } else {
        report.views.keptExisting.push({ id, slug, title });
      }
    }

    if (last30dBySlug) {
      const hasData = last30dBySlug.has(slug);
      if (hasData) {
        const newValue = last30dBySlug.get(slug);
        update.views_30d = newValue;
        touched = true;
        report.views_30d.updated.push({ id, slug, title, value: newValue });
      } else if (effectiveZeroMissing30d) {
        update.views_30d = 0;
        touched = true;
        report.views_30d.zeroed.push({ id, slug, title });
      } else {
        report.views_30d.keptExisting.push({ id, slug, title });
      }
    }

    if (avgEngagementBySlug) {
      const hasData = avgEngagementBySlug.has(slug);
      if (hasData) {
        const newValue = avgEngagementBySlug.get(slug);
        update.avg_engagement_seconds_30d = newValue;
        touched = true;
        report.avg_engagement_seconds_30d.updated.push({ id, slug, title, value: newValue });
      } else {
        report.avg_engagement_seconds_30d.keptExisting.push({ id, slug, title });
      }
    }

    if (touched) updates.push(update);
  }

  return { updates, report };
}

/**
 * 把「舊 slug → 現在的 slug」對應表套用到 bySlug 加總結果上（合併瀏覽數）。
 *
 * 用途：文章改過 slug 時，GA4 的歷史資料仍會用舊路徑記錄改版前的瀏覽數。若不處理，這些瀏覽數
 * 在比對 Directus 文章清單時會變成「對不到文章」而被漏算，但實際上應該算進現在這篇文章的總數。
 *
 * `tools/ga4-slug-aliases.json` 目前是空的 `{}`——唯一那組（meta-api-application →
 * threads-api-tutorial）已於 2026-07-31 依指示移除，連同該網址的轉址一起。機制保留備用。
 *
 * @param {Map<string, number>} bySlug aggregateViewsBySlug() 回傳的 bySlug
 * @param {Record<string, string>} [aliasMap] { 舊slug: 現在的slug }
 * @returns {{ bySlug: Map<string, number>, appliedFrom: Map<string, string[]> }}
 *   appliedFrom：現在的 slug → 被併入的舊 slug 清單（沒有套用別名就是空 Map），供輸出報表說明用
 */
export function remapSlugAliases(bySlug, aliasMap = {}) {
  const result = new Map();
  const appliedFrom = new Map();

  for (const [slug, views] of (bySlug ?? new Map()).entries()) {
    const canonical = aliasMap?.[slug] ?? slug;
    result.set(canonical, (result.get(canonical) ?? 0) + views);
    if (canonical !== slug) {
      const list = appliedFrom.get(canonical) ?? [];
      list.push(slug);
      appliedFrom.set(canonical, list);
    }
  }

  return { bySlug: result, appliedFrom };
}

/**
 * 找出「GA4 有資料、但 Directus 文章清單裡沒有對應 slug」的項目。
 * 用途：報表列出「對不到任何文章的路徑」，讓使用者判斷是否要補進 tools/ga4-slug-aliases.json，
 * 還是單純是已下架／從未發布過的頁面（例如已知的 404 頁面）產生的雜訊流量。
 *
 * @param {Map<string, number>} bySlug 已經套用過 remapSlugAliases 的加總結果
 * @param {Array<{slug: string}>} articles Directus 文章清單
 * @returns {string[]} 排序後的 slug 清單
 */
export function findUnmatchedSlugs(bySlug, articles) {
  const known = new Set((articles ?? []).map((a) => a.slug));
  return [...(bySlug ?? new Map()).keys()].filter((slug) => !known.has(slug)).sort();
}
