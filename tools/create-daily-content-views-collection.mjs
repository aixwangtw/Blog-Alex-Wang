// 建立逐篇文章／逐頁面的每日流量 collection；只保存當日有觀看的內容。
const CMS = 'https://cms.aixwang.dev';
const COLLECTION = 'daily_content_views';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

const FIELDS = [
  { field: 'record_key', type: 'string', schema: { is_nullable: false, is_unique: true, max_length: 255 }, meta: { interface: 'input', hidden: true, readonly: true, note: '日期與路徑組成的同步鍵。' } },
  { field: 'date', type: 'date', schema: { is_nullable: false }, meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short' }, readonly: true, width: 'half', note: '流量日期。' } },
  { field: 'content_type', type: 'string', schema: { is_nullable: false, max_length: 20 }, meta: { interface: 'select-dropdown', options: { choices: [{ text: '文章', value: '文章' }, { text: '頁面', value: '頁面' }] }, readonly: true, width: 'half', note: '文章或一般頁面。' } },
  { field: 'name', type: 'string', schema: { is_nullable: false, max_length: 255 }, meta: { interface: 'input', readonly: true, width: 'full', note: '文章標題或頁面名稱。' } },
  { field: 'views', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '這項內容當日的觀看數。' } },
  { field: 'active_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '這項內容當日的活躍使用者。' } },
  { field: 'total_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '這項內容當日的總使用者。' } },
  { field: 'path', type: 'string', schema: { is_nullable: false, max_length: 255 }, meta: { interface: 'input', readonly: true, width: 'full', note: '網站路徑。' } },
  { field: 'views_synced_at', type: 'timestamp', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short', use24: true }, readonly: true, width: 'half', note: '最後同步時間。' } },
];

const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function request(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}：${text.slice(0, 300)}`);
  return text ? JSON.parse(text).data : null;
}

const check = await fetch(`${CMS}/collections/${COLLECTION}`, { headers });
console.log(`${apply ? '套用' : '預覽'}：${COLLECTION}`);
if (!apply) {
  console.log(JSON.stringify({ collection: COLLECTION, fields: FIELDS }, null, 2));
  process.exit(0);
}

if (!check.ok) {
  await request('/collections', {
    method: 'POST',
    body: JSON.stringify({
      collection: COLLECTION,
      meta: { icon: 'query_stats', note: '每篇文章與每個一般頁面的每日 GA4 流量；只保存有觀看的日期。', display_template: '{{name}}｜{{date}}｜{{views}} 次' },
      schema: {},
      fields: FIELDS,
    }),
  });
  console.log(`已建立 ${COLLECTION}。`);
} else {
  const existing = new Set((await request(`/fields/${COLLECTION}`)).map((field) => field.field));
  for (const field of FIELDS) {
    if (!existing.has(field.field)) await request(`/fields/${COLLECTION}`, { method: 'POST', body: JSON.stringify(field) });
  }
  console.log(`${COLLECTION} 已存在，欄位檢查完成。`);
}
