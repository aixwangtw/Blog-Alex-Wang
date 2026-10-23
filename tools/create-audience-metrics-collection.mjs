// 建立流量統計置頂數字 collection；固定只有 key=site 一列。
const CMS = 'https://cms.aixwang.dev';
const COLLECTION = 'audience_metrics';
const apply = process.argv.slice(2).includes('--apply');
const token = process.env.DIRECTUS_TOKEN;
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');

const FIELDS = [
  { field: 'key', type: 'string', schema: { is_nullable: false, is_unique: true, max_length: 30 }, meta: { interface: 'input', hidden: true, readonly: true, note: '固定為 site，確保 collection 只有一筆網站統計。' } },
  { field: 'total_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '新站上線至今的去重總使用者。' } },
  { field: 'active_users_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '最近 30 天區間內的去重活躍使用者。' } },
  { field: 'active_users_today', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: 'GA4 Property 時區今天的活躍使用者。' } },
  { field: 'desktop_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '新站上線至今，GA4 deviceCategory=desktop 的去重使用者，區間與 total_users 相同。' } },
  { field: 'mobile_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '新站上線至今，GA4 deviceCategory=mobile 的去重使用者，區間與 total_users 相同。' } },
  { field: 'tablet_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '新站上線至今，GA4 deviceCategory=tablet 的去重使用者，區間與 total_users 相同。' } },
  { field: 'other_users', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '新站上線至今，GA4 deviceCategory 不是 desktop/mobile/tablet 的去重使用者（例如 smart tv、(not set)），避免這幾類被靜默漏計。' } },
  { field: 'desktop_users_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '近 30 天，GA4 deviceCategory=desktop 的活躍使用者，區間與指標與 active_users_30d 相同。' } },
  { field: 'mobile_users_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '近 30 天，GA4 deviceCategory=mobile 的活躍使用者，區間與指標與 active_users_30d 相同。' } },
  { field: 'tablet_users_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '近 30 天，GA4 deviceCategory=tablet 的活躍使用者，區間與指標與 active_users_30d 相同。' } },
  { field: 'other_users_30d', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input', readonly: true, width: 'half', note: '近 30 天，GA4 deviceCategory 不是 desktop/mobile/tablet 的活躍使用者，避免這幾類被靜默漏計。' } },
  { field: 'today_sources', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, readonly: true, width: 'full', note: 'GA4 Property 時區今天各入口的活躍使用者，格式 [{channel, users}]，人數多的在前、最多 20 筆；入口分類與 traffic_sources.channel 同一套。同一人從多個入口進站會各算一次。' } },
  { field: 'synced_at', type: 'timestamp', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short', use24: true }, readonly: true, width: 'half', note: '最後同步時間。' } },
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
      meta: { icon: 'groups', note: 'GA4 全站去重使用者摘要，供流量統計置頂數字使用。', display_template: '網站使用者摘要' },
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
