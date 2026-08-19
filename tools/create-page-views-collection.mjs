// 建立 GA4 全站路徑觀看統計 collection；冪等，可重跑補欄位。
const CMS = 'https://cms.aixwang.dev';
const COLLECTION = 'page_views';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

const FIELDS = [
  { field: 'path', type: 'string', schema: { is_nullable: false, is_unique: true }, meta: { interface: 'input', readonly: true, width: 'full', note: 'GA4 正規化後的網址路徑；同一路徑只保留一列。' } },
  { field: 'name', type: 'string', meta: { interface: 'input', readonly: true, width: 'full', note: '頁面名稱；文章會使用 Directus 文章標題。' } },
  { field: 'content_type', type: 'string', meta: { interface: 'select-dropdown', readonly: true, width: 'half', choices: [{ text: '頁面', value: '頁面' }, { text: '文章', value: '文章' }, { text: '舊站頁面', value: '舊站頁面' }, { text: '舊文章／未收錄文章', value: '舊文章／未收錄文章' }, { text: '系統／其他', value: '系統／其他' }] } },
  { field: 'is_current', type: 'boolean', schema: { default_value: false }, meta: { interface: 'boolean', readonly: true, width: 'half', note: '是否仍是目前網站已知的正式頁面或 CMS 文章。' } },
  { field: 'views', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '目前 Astro 新站自 2026-07-22 上線後的累積觀看次數；不包含 StarJobTW 舊站。' } },
  { field: 'views_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: 'GA4 近 30 天觀看次數。' } },
  { field: 'avg_engagement_seconds_30d', type: 'integer', schema: { is_nullable: true }, meta: { interface: 'input', readonly: true, width: 'half', note: '近 30 天平均停留秒數（userEngagementDuration ÷ activeUsers，四捨五入）。沒有使用者資料時是 null，不是 0。' } },
  { field: 'views_synced_at', type: 'timestamp', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short', use24: true }, readonly: true, width: 'half', note: '最後一次同步時間。' } },
];

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function request(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}：${text.slice(0, 300)}`);
  return text ? JSON.parse(text).data : null;
}

async function exists() {
  const res = await fetch(`${CMS}/collections/${COLLECTION}`, { headers });
  return res.ok;
}

console.log(`${apply ? '套用' : '預覽'}：${COLLECTION}（${FIELDS.length} 個資料欄位）`);
if (!apply) {
  console.log(JSON.stringify({ collection: COLLECTION, fields: FIELDS }, null, 2));
  process.exit(0);
}

if (!(await exists())) {
  await request('/collections', { method: 'POST', body: JSON.stringify({ collection: COLLECTION, meta: { icon: 'table_view', note: 'GA4 全站頁面與文章觀看統計，由背景排程自動同步。' }, schema: {}, fields: FIELDS }) });
  console.log('已建立 collection 與欄位。');
} else {
  const existing = new Set((await request(`/fields/${COLLECTION}`)).map((field) => field.field));
  for (const field of FIELDS) {
    if (existing.has(field.field)) continue;
    await request(`/fields/${COLLECTION}`, { method: 'POST', body: JSON.stringify(field) });
    console.log(`已補上欄位 ${field.field}。`);
  }
  console.log('collection 已存在，欄位檢查完成。');
}
