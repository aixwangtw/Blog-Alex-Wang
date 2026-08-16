// 建立每日流量趨勢 collection；每天一列，由 sync-ga4-daily-views.mjs 更新。
const CMS = 'https://cms.aixwang.dev';
const COLLECTION = 'daily_views';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

const FIELDS = [
  { field: 'date', type: 'date', schema: { is_nullable: false, is_unique: true }, meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short' }, readonly: true, width: 'half', note: '流量日期。' } },
  { field: 'total_views', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '當日新站總觀看數。' } },
  { field: 'article_views', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '當日單篇文章觀看數。' } },
  { field: 'page_views', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '當日一般頁面觀看數。' } },
  { field: 'views_synced_at', type: 'timestamp', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short', use24: true }, readonly: true, width: 'half', note: '最後同步時間。' } },
];
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function request(path, init = {}) { const res = await fetch(`${CMS}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } }); const text = await res.text(); if (!res.ok) throw new Error(`HTTP ${res.status}：${text.slice(0, 300)}`); return text ? JSON.parse(text).data : null; }
const check = await fetch(`${CMS}/collections/${COLLECTION}`, { headers });
console.log(`${apply ? '套用' : '預覽'}：${COLLECTION}`);
if (!apply) { console.log(JSON.stringify({ collection: COLLECTION, fields: FIELDS }, null, 2)); process.exit(0); }
if (!check.ok) {
  await request('/collections', { method: 'POST', body: JSON.stringify({ collection: COLLECTION, meta: { icon: 'show_chart', note: '新站每日流量，由 GA4 背景同步。' }, schema: {}, fields: FIELDS }) });
  console.log('已建立 daily_views。');
} else {
  const existing = new Set((await request(`/fields/${COLLECTION}`)).map((field) => field.field));
  for (const field of FIELDS) if (!existing.has(field.field)) await request(`/fields/${COLLECTION}`, { method: 'POST', body: JSON.stringify(field) });
  console.log('daily_views 已存在，欄位檢查完成。');
}
