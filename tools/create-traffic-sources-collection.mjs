const CMS = 'https://cms.aixwang.dev'; const COLLECTION = 'traffic_sources'; const apply = process.argv.slice(2).includes('--apply'); const token = process.env.DIRECTUS_TOKEN;
if (apply && !token) throw new Error('要 --apply 必須設定 DIRECTUS_TOKEN。');
const FIELDS = [
  { field: 'source_key', type: 'string', schema: { is_nullable: false, is_unique: true }, meta: { interface: 'input', readonly: true, hidden: true } },
  { field: 'channel', type: 'string', meta: { interface: 'input', readonly: true, width: 'half', note: '入口分類，共 9 類。依造訪次數由多到少：Google 搜尋、Facebook、Threads、Instagram、AI 助理、LINE（只有連結帶 utm_source=line 或 GA4 來源為 line 才算）、站內換頁；最後固定為其他、疑似自動程式。「其他」滑鼠移上去可看細項（Bing 搜尋、Yahoo 搜尋、各推薦連結網域、YouTube、App 內建瀏覽器、回訪讀者、查不出來源）。「Facebook」含從 IG、Threads 點出、帶 fbclid 的連結。GA4 查無來源（直接）的造訪才會細分，判斷順序：網址帶 fbclid → Facebook；疑似自動程式（推論，非 GA4 官方標記：螢幕解析度 800x600，或美國來源且完全沒有互動）；進站頁的上一頁是本站 → 站內換頁；其餘 → 其他（含查不到來源者與未列名的來源）。' } },
  { field: 'channel_detail', type: 'string', meta: { interface: 'input', readonly: true, width: 'half', note: '「其他」底下的細項，例如 Bing 搜尋、Yahoo 搜尋、各推薦連結網域、YouTube、App 內建瀏覽器、回訪讀者、查不出來源；其他分類為空。' } },
  { field: 'sessions', type: 'integer', meta: { interface: 'input', readonly: true, width: 'half', note: '造訪次數（GA4 工作階段數）。' } },
  { field: 'views', type: 'integer', meta: { interface: 'input', readonly: true, width: 'half', note: '觀看數。' } },
  { field: 'source', type: 'string', meta: { interface: 'input', readonly: true, width: 'half' } },
  { field: 'medium', type: 'string', meta: { interface: 'input', readonly: true, width: 'half' } },
  { field: 'campaign', type: 'string', meta: { interface: 'input', readonly: true, width: 'half' } },
  { field: 'landing_page', type: 'string', meta: { interface: 'input', readonly: true, width: 'full', note: '使用者第一個進入的頁面。' } },
  { field: 'views_synced_at', type: 'timestamp', meta: { interface: 'datetime', display: 'datetime', display_options: { relative: false, format: 'short', use24: true }, readonly: true, width: 'half' } },
];
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }; async function req(path, init = {}) { const r = await fetch(`${CMS}${path}`, { ...init, headers: { ...headers, ...(init.headers ?? {}) } }); const t = await r.text(); if (!r.ok) throw new Error(`HTTP ${r.status}：${t.slice(0, 300)}`); return t ? JSON.parse(t).data : null; }
const check = await fetch(`${CMS}/collections/${COLLECTION}`, { headers }); console.log(`${apply ? '套用' : '預覽'}：${COLLECTION}`); if (!apply) { console.log(JSON.stringify({ collection: COLLECTION, fields: FIELDS }, null, 2)); process.exit(0); }
if (!check.ok) { await req('/collections', { method: 'POST', body: JSON.stringify({ collection: COLLECTION, meta: { icon: 'alt_route', note: 'GA4 新站流量入口統計。' }, schema: {}, fields: FIELDS }) }); console.log('已建立 traffic_sources。'); }
else { const existing = new Set((await req(`/fields/${COLLECTION}`)).map((f) => f.field)); for (const f of FIELDS) if (!existing.has(f.field)) await req(`/fields/${COLLECTION}`, { method: 'POST', body: JSON.stringify(f) }); console.log('traffic_sources 已存在，欄位檢查完成。'); }
