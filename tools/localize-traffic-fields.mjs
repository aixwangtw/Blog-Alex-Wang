// 把流量統計欄位的後台標題改成中文（meta.translations, zh-TW），並把時間欄位顯示改成台灣寫法
// （日期時間 2026/10/22 20:17、日期 2026/10/22，台北時間）。只合併 translations / display，不動其他 meta。
//
// 用法：
//   node tools/localize-traffic-fields.mjs                          # dry-run，列出會改的欄位
//   DIRECTUS_TOKEN=xxx node tools/localize-traffic-fields.mjs --apply
//   ... --apply --only articles.avg_engagement_seconds_30d          # 只改一欄（先驗證用）
//   ... --apply --skip-display                                      # 只改標題、不改時間顯示
import { FIELD_LABELS, buildMetaPatch } from './lib/traffic-field-labels.mjs';

const CMS = process.env.DIRECTUS_URL ?? 'https://cms.aixwang.dev';
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const skipDisplay = args.includes('--skip-display');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const token = process.env.DIRECTUS_TOKEN;
if (!token) { console.error('需要設定 DIRECTUS_TOKEN。'); process.exit(1); }

async function request(path, init = {}) {
  const res = await fetch(`${CMS}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}：${text.slice(0, 200)}`);
  return text ? JSON.parse(text).data : null;
}

let changed = 0, same = 0, failed = 0;
for (const [collection, fields] of Object.entries(FIELD_LABELS)) {
  for (const [field, spec] of Object.entries(fields)) {
    if (only && only !== `${collection}.${field}`) continue;
    try {
      const current = await request(`/fields/${collection}/${field}`);
      const entry = skipDisplay ? [spec[0], undefined, spec[2]] : spec;
      const patch = buildMetaPatch(current.meta, entry);
      if (JSON.stringify(patch.translations) === JSON.stringify(current.meta?.translations)
        && (!patch.note || patch.note === current.meta?.note)
        && (!patch.display || JSON.stringify(patch.display_options) === JSON.stringify(current.meta?.display_options))) { same++; continue; }
      console.log(`${apply ? '更新' : '將更新'} ${collection}.${field} → ${spec[0]}${patch.display ? `（${JSON.stringify(patch.display_options)}）` : ''}`);
      if (apply) await request(`/fields/${collection}/${field}`, { method: 'PATCH', body: JSON.stringify({ meta: patch }) });
      changed++;
    } catch (error) {
      failed++;
      console.error(`失敗 ${collection}.${field}：${error.message}`);
    }
  }
}
console.log(`${apply ? '完成' : 'dry-run'}：${changed} 欄${apply ? '已更新' : '需更新'}、${same} 欄已是目標值、${failed} 欄失敗。`);
if (failed) process.exitCode = 1;
