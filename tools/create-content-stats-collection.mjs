// 在 Directus 建立兩個 collection，給 Insights panel 讀「panel 自己算不出來」的內容統計數字
// （字數、門檻判定、標籤/FAQ 統計、內文結構、站內連結網絡、slug 檢查——這些要解析 markdown body
// 或跨篇比對，Directus panel 的 aggregate function 做不到，見 docs/cms-insights-dashboard.md）：
//
//   content_stats_history　一天一列，站台彙總數字。給 metric / time-series panel 畫「歷史趨勢」。
//     idempotent key：run_date（同一天重跑會更新那一列，不會累積出重複列——見 write-content-stats.mjs）
//   content_stats　　　　　一篇文章一列，永遠只反映「最新一次跑的結果」（不留歷史）。
//     給 list / bar-chart / pie-chart panel 顯示「目前」的明細與分布，不用篩「最新一批」，
//     因為每次重跑都是原地更新，collection 裡本來就只有最新資料。
//     idempotent key：slug
//
// 依據：Directus Collections API（POST /collections，body 為 {collection, meta, schema, fields}，
// 可以在同一次請求裡帶 fields 陣列一起建立）與 Fields API（POST /fields/:collection）：
//   - https://directus.com/docs/api/collections（POST /collections 的 request body 形狀）
//   - https://directus.com/docs/api/fields（POST /fields/:collection 的 request body 形狀）
//   - 欄位型別字串（'string'/'text'/'integer'/'float'/'boolean'/'date'/'timestamp'/'json'）
//     已對照 Directus 原始碼確認：
//     https://github.com/directus/directus/blob/main/packages/constants/src/fields.ts（TYPES 列舉）
// 這台 cms.aixwang.dev 沒有公開版本號（/server/info 在沒有 admin token 時不會回傳 directus.version，
// 這是 Directus 本身的行為，見 docs/cms-insights-dashboard.md「查不到的事實」），所以以上文件與原始碼
// 對照的是 Directus GitHub main 分支，不保證跟這台實際跑的版本完全一致；--apply 前建議先在 Directus
// 後台手動確認一次欄位型別選單裡有這些型別。
//
// 沒有 DIRECTUS_TOKEN，這支腳本本身沒有真的打過 POST /collections 或 POST /fields。
//
// 用法：
//   node tools/create-content-stats-collection.mjs                  # dry-run，印出要送的 payload
//   DIRECTUS_TOKEN=xxx node tools/create-content-stats-collection.mjs --apply   # 真的建立

const CMS = 'https://cms.aixwang.dev';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 真的建立 collection，必須先設定 DIRECTUS_TOKEN 環境變數（Directus 使用者的 static token）。');
  console.error('token 怎麼拿見 docs/cms-insights-dashboard.md。');
  process.exit(1);
}

// ── 欄位定義 ────────────────────────────────────────────────────────────
// meta.interface 用最平常的選擇（input / input-multiline / toggle / datetime / input-code），
// 這兩個 collection 主要是給程式寫、給 panel 讀，後台手動編輯的情境很少，故沒有特別講究互動細節。

/** @type {Array<{field: string, type: string, schema?: object, meta?: object}>} */
const HISTORY_FIELDS = [
  { field: 'run_date', type: 'date', schema: { is_nullable: false, is_unique: true }, meta: { interface: 'datetime', note: '這一列代表哪一天跑的統計；同一天重跑會更新這一列（見 write-content-stats.mjs 的 upsert 邏輯），不會插入重複列。', width: 'half' } },
  { field: 'generated_at', type: 'timestamp', meta: { interface: 'datetime', note: '實際執行統計的時間戳（可能跟 run_date 同一天但時間更精確）。', width: 'half' } },
  { field: 'source', type: 'string', meta: { interface: 'input', note: '這批資料的來源說明（有沒有帶 token、含不含草稿）。', width: 'full' } },
  { field: 'article_count', type: 'integer', meta: { interface: 'input', note: '總篇數（只計 published；非 published 篇數見 draft_count）。', width: 'half' } },
  { field: 'draft_count', type: 'integer', meta: { interface: 'input', note: '非 published（草稿等狀態）的總篇數；不列入 article_count 或任何其他統計指標，只是讓人看得到組成。', width: 'half' } },
  { field: 'status_counts', type: 'json', meta: { interface: 'input-code', note: '依 status 分組的篇數，例如 {"published": 9}。用 JSON 存是因為目前無法從公開 API 查到 status 欄位完整的列舉值，用固定欄位可能漏掉未來新增的狀態值。', width: 'full' } },
  { field: 'featured_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'featured_ratio', type: 'float', meta: { interface: 'input', note: '百分比數字（例如 66.7 代表 66.7%）。', width: 'half' } },
  { field: 'avg_word_count', type: 'float', meta: { interface: 'input', note: '正文字數定義見 tools/lib/content-stats-lib.mjs 的 stripMarkdown 註解。', width: 'half' } },
  { field: 'median_word_count', type: 'float', meta: { interface: 'input', width: 'half' } },
  { field: 'min_word_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'max_word_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'desc_pass_count', type: 'integer', meta: { interface: 'input', note: `description 40–80 字達標篇數，門檻來源見 tools/lib/content-stats-lib.mjs 的 DESC_MIN/DESC_MAX。`, width: 'half' } },
  { field: 'desc_fail_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'desc_missing_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'title_len_avg', type: 'float', meta: { interface: 'input', width: 'half' } },
  { field: 'unique_tag_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'orphan_tag_count', type: 'integer', meta: { interface: 'input', note: '只被用過一次的標籤數。', width: 'half' } },
  { field: 'avg_tags_per_article', type: 'float', meta: { interface: 'input', width: 'half' } },
  { field: 'avg_faq_per_article', type: 'float', meta: { interface: 'input', width: 'half' } },
  { field: 'no_faq_count', type: 'integer', meta: { interface: 'input', note: '完全沒有 FAQ 的文章數。', width: 'half' } },
  { field: 'island_count', type: 'integer', meta: { interface: 'input', note: '零站內連結指向它的孤島文章數。', width: 'half' } },
  { field: 'dead_end_count', type: 'integer', meta: { interface: 'input', note: '沒有連出任何站內文章的死路文章數。', width: 'half' } },
  { field: 'unresolved_link_target_count', type: 'integer', meta: { interface: 'input', note: '文章內連到的 slug，在目前文章清單裡查無此文章的數量。', width: 'half' } },
  { field: 'max_gap_days', type: 'integer', meta: { interface: 'input', note: '相鄰兩篇發文間隔最長的天數；篇數不足 2 篇時為 null。', width: 'half' } },
];

/** @type {Array<{field: string, type: string, schema?: object, meta?: object}>} */
const ARTICLE_FIELDS = [
  { field: 'slug', type: 'string', schema: { is_nullable: false, is_unique: true }, meta: { interface: 'input', note: '對應 articles.slug；同一篇文章重跑會原地更新這一列，不會插入重複列（見 write-content-stats.mjs）。', width: 'half' } },
  { field: 'run_date', type: 'date', meta: { interface: 'datetime', note: '這一列最後一次被更新的日期。', width: 'half' } },
  { field: 'title', type: 'string', meta: { interface: 'input', width: 'full' } },
  { field: 'word_count', type: 'integer', meta: { interface: 'input', note: '正文字數，定義見 tools/lib/content-stats-lib.mjs。', width: 'half' } },
  { field: 'title_len', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'desc_len', type: 'integer', meta: { interface: 'input', note: '缺 description 時為 null。', width: 'half' } },
  { field: 'desc_status', type: 'string', meta: { interface: 'input', note: `值為「達標」／「未達標（少於/超過 N 字）」／「缺 description」之一。`, width: 'half' } },
  { field: 'h2_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'h3_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'code_block_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'image_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'external_link_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'internal_link_count', type: 'integer', meta: { interface: 'input', note: '這篇文章連出去的站內 /blog/ 連結數（去重後）。', width: 'half' } },
  { field: 'inbound_link_count', type: 'integer', meta: { interface: 'input', note: '有多少篇其他文章連到這篇（去重後）。', width: 'half' } },
  { field: 'is_island', type: 'boolean', schema: { default_value: false }, meta: { interface: 'boolean', note: 'inbound_link_count = 0。', width: 'half' } },
  { field: 'is_dead_end', type: 'boolean', schema: { default_value: false }, meta: { interface: 'boolean', note: '沒有連出任何站內文章。', width: 'half' } },
  { field: 'days_since_update', type: 'integer', meta: { interface: 'input', note: '距今天數；用 updated_date，沒有的話 fallback 用 pub_date。', width: 'half' } },
  { field: 'updated_date_used', type: 'date', meta: { interface: 'datetime', note: '這篇文章的 updated_date 原始值（可能是 null，此時上面的 days_since_update 是用 pub_date 算的）。', width: 'half' } },
  { field: 'slug_length', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'slug_has_non_ascii', type: 'boolean', schema: { default_value: false }, meta: { interface: 'boolean', width: 'half' } },
  { field: 'tag_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
  { field: 'faq_count', type: 'integer', meta: { interface: 'input', width: 'half' } },
];

const COLLECTIONS = [
  {
    collection: 'content_stats_history',
    meta: {
      icon: 'timeline',
      note: '內容統計歷史快照，一天一列（站台彙總數字）。由 tools/write-content-stats.mjs 自動寫入，不建議手動編輯。',
      sort_field: 'run_date',
    },
    fields: HISTORY_FIELDS,
  },
  {
    collection: 'content_stats',
    meta: {
      icon: 'analytics',
      note: '內容統計目前快照，一篇文章一列（永遠是最新一次跑的結果，不留歷史）。由 tools/write-content-stats.mjs 自動寫入，不建議手動編輯。',
      sort_field: 'slug',
    },
    fields: ARTICLE_FIELDS,
  },
];

// ── Directus API 呼叫 ──────────────────────────────────────────────────────

async function collectionExists(name) {
  const res = await fetch(`${CMS}/collections/${name}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403 || res.status === 404) return false;
  if (res.ok) return true;
  const text = await res.text();
  throw new Error(`檢查 collection ${name} 是否存在時失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
}

async function fieldExists(collection, field) {
  const res = await fetch(`${CMS}/fields/${collection}/${field}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok) return true;
  // Directus 11 對「欄位不存在」回的是 403 FORBIDDEN，不是 404
  // （訊息本身就寫成「You don't have permission to access this.」）。
  // 只認 404 的話，補新欄位這條路永遠走不通——實測 2026-07-31 補 draft_count 就是卡在這裡。
  if (res.status === 404 || res.status === 403) return false;
  const text = await res.text();
  throw new Error(`檢查欄位 ${collection}.${field} 是否存在時失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
}

async function createCollection(def) {
  const res = await fetch(`${CMS}/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(def),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`建立 collection ${def.collection} 失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  return JSON.parse(text);
}

async function createField(collection, def) {
  const res = await fetch(`${CMS}/fields/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(def),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`建立欄位 ${collection}.${def.field} 失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  return JSON.parse(text);
}

// ── 主流程 ──────────────────────────────────────────────────────────────

console.log(`目標 Directus：${CMS}`);
console.log(apply ? '模式：--apply（會真的呼叫 Directus API）' : '模式：dry-run（預設，不會真的打 API）');
console.log('');

async function run() {
  for (const { collection, meta, fields } of COLLECTIONS) {
    console.log(`══ collection: ${collection} ══`);

    if (!apply) {
      // dry-run：有 token 就順便查現況，沒 token 就只印計畫。
      if (token) {
        try {
          const exists = await collectionExists(collection);
          console.log(exists ? '目前狀態：已存在（實際執行時只會補缺少的欄位，不會重建 collection）' : '目前狀態：不存在（實際執行時會新建，並一次帶入下列所有欄位）');
        } catch (err) {
          console.log(`目前狀態：查不到（${err.message}）`);
        }
      } else {
        console.log('目前狀態：未檢查（沒有 DIRECTUS_TOKEN，無法呼叫 GET /collections 確認是否已存在）');
      }
      console.log(`將送出的 POST /collections payload（若 collection 不存在時）：`);
      console.log(JSON.stringify({ collection, meta, schema: {}, fields }, null, 2));
      console.log('');
      continue;
    }

    // --apply
    const exists = await collectionExists(collection);
    if (!exists) {
      process.stdout.write(`建立 collection ${collection}（含 ${fields.length} 個欄位）… `);
      try {
        await createCollection({ collection, meta, schema: {}, fields });
        console.log('成功。');
      } catch (err) {
        console.log(`失敗：${err.message}`);
        console.log('（這個 collection 這次略過，其他 collection 繼續處理）');
      }
      console.log('');
      continue;
    }

    console.log('已存在，逐一檢查欄位是否齊全：');
    for (const def of fields) {
      process.stdout.write(`  ${collection}.${def.field} … `);
      try {
        const fieldAlreadyExists = await fieldExists(collection, def.field);
        if (fieldAlreadyExists) {
          console.log('已存在，跳過。');
          continue;
        }
        await createField(collection, def);
        console.log('建立成功。');
      } catch (err) {
        console.log(`失敗：${err.message}`);
      }
    }
    console.log('');
  }

  if (!apply) {
    console.log('這是 dry-run，沒有任何 collection／欄位被建立。要真的建立，加 --apply 並帶 DIRECTUS_TOKEN。');
  } else {
    console.log('完成。到 Directus 後台確認兩個 collection 的欄位是否符合預期。');
    console.log('下一步：跑 tools/write-content-stats.mjs 把統計數字寫進去，再跑 tools/create-insights-dashboard.mjs 建立 dashboard。');
  }
}

run().catch((err) => {
  console.error(`執行失敗：${err.message}`);
  process.exit(1);
});
