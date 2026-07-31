// 在 Directus 的 articles collection 建立 GA4 瀏覽數同步要用的三個欄位：
//   views          integer  預設 0   ── 累積（全期間）瀏覽數
//   views_30d      integer  預設 0   ── 近 30 天瀏覽數
//   views_synced_at timestamp        ── 最後一次同步時間
// 三個欄位都設成後台唯讀（meta.readonly=true），並附中文 note 說明是自動同步、手改會被覆蓋。
//
// 依據：Directus Fields API（POST /fields/:collection，body 為 {field, type, schema, meta}）
// 與欄位型別字串（'integer' / 'timestamp'）皆已對照官方文件與原始碼確認：
//   - https://directus.com/docs/guides/data-model/fields（Create Field in Collection：POST /fields/:collection）
//   - https://github.com/directus/directus/blob/main/packages/constants/src/fields.ts（TYPES 列舉，含 'integer'、'timestamp'）
//   - https://github.com/directus/directus/blob/main/packages/types/src/fields.ts（FieldMeta.readonly / note）
// 沒有 DIRECTUS_TOKEN，所以這支腳本本身沒有真的打過 POST /fields 建立過欄位，只用 GET /fields/:collection/:field
// 讀過既有欄位清單做交叉核對（見專案已知的 articles 欄位：id, status, slug, title, description, body,
// pub_date, updated_date, tags, faqs, featured, sort）。
//
// 用法：
//   node tools/create-views-fields.mjs                    # 預設 dry-run，只印出要送的 payload
//   node tools/create-views-fields.mjs --dry-run           # 同上，明示寫法
//   DIRECTUS_TOKEN=xxx node tools/create-views-fields.mjs --apply   # 真的建立（已存在的欄位會跳過，不報錯）

const CMS = 'https://cms.aixwang.dev';
const COLLECTION = 'articles';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 真的建立欄位，必須先設定 DIRECTUS_TOKEN 環境變數（Directus 使用者的 static token）。');
  console.error('token 怎麼拿見 docs/ga4-views-sync.md。');
  process.exit(1);
}

/** @type {Array<{field: string, type: string, schema: object, meta: object}>} */
const FIELD_DEFS = [
  {
    field: 'views',
    type: 'integer',
    schema: { default_value: 0, is_nullable: true },
    meta: {
      interface: 'input',
      readonly: true,
      hidden: false,
      note: '累積（全期間）瀏覽數，由 GA4 自動同步（tools/sync-ga4-views.mjs）。手動修改會在下次同步時被覆蓋。',
      sort: 100,
      width: 'half',
    },
  },
  {
    field: 'views_30d',
    type: 'integer',
    schema: { default_value: 0, is_nullable: true },
    meta: {
      interface: 'input',
      readonly: true,
      hidden: false,
      note: '近 30 天瀏覽數，由 GA4 自動同步（tools/sync-ga4-views.mjs）。手動修改會在下次同步時被覆蓋。',
      sort: 101,
      width: 'half',
    },
  },
  {
    field: 'views_synced_at',
    type: 'timestamp',
    schema: { is_nullable: true },
    meta: {
      interface: 'datetime',
      readonly: true,
      hidden: false,
      note: '最後一次從 GA4 同步瀏覽數的時間，由 tools/sync-ga4-views.mjs 自動寫入。',
      sort: 102,
      width: 'half',
    },
  },
];

async function fieldExists(field) {
  const res = await fetch(`${CMS}/fields/${COLLECTION}/${field}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return false;
  if (res.ok) return true;
  const text = await res.text();
  throw new Error(`檢查欄位 ${field} 是否存在時失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
}

async function createField(def) {
  const res = await fetch(`${CMS}/fields/${COLLECTION}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(def),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`建立欄位 ${def.field} 失敗，HTTP ${res.status}：${text.slice(0, 300)}`);
  }
  return JSON.parse(text);
}

console.log(`目標 collection：${COLLECTION}（${CMS}）`);
console.log(apply ? '模式：--apply（會真的呼叫 Directus API）' : '模式：dry-run（預設，不會真的打 API）');
console.log('');

if (!apply) {
  // dry-run：有 token 就順便查詢是否已存在，沒 token 就只印 payload。
  for (const def of FIELD_DEFS) {
    console.log(`── ${def.field} ──`);
    if (token) {
      try {
        const exists = await fieldExists(def.field);
        console.log(exists ? '目前狀態：已存在（實際執行時會跳過）' : '目前狀態：不存在（實際執行時會新建）');
      } catch (err) {
        console.log(`目前狀態：查不到（${err.message}）`);
      }
    } else {
      console.log('目前狀態：未檢查（沒有 DIRECTUS_TOKEN，無法呼叫 GET /fields 確認是否已存在）');
    }
    console.log('將送出的 payload：');
    console.log(JSON.stringify(def, null, 2));
    console.log('');
  }
  console.log('這是 dry-run，沒有任何欄位被建立。要真的建立，加 --apply 並帶 DIRECTUS_TOKEN。');
  process.exit(0);
}

// --apply：真的檢查＋建立
for (const def of FIELD_DEFS) {
  process.stdout.write(`${def.field} … `);
  try {
    const exists = await fieldExists(def.field);
    if (exists) {
      console.log('已存在，跳過。');
      continue;
    }
    await createField(def);
    console.log('建立成功。');
  } catch (err) {
    console.log(`失敗：${err.message}`);
  }
}
console.log('\n完成。到 Directus 後台確認欄位是否符合預期（唯讀、note 顯示正確）。');
