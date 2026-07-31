// 把 tools/lib/content-stats-lib.mjs 算出來、但 Directus Insights panel 自己算不出來的內容統計數字
// （字數、門檻判定、標籤/FAQ、內文結構、站內連結網絡、slug 檢查——理由見 docs/cms-insights-dashboard.md），
// 寫進兩個 Directus collection，供 Insights panel 讀：
//
//   content_stats_history　一天一列，站台彙總數字。用 run_date 當 upsert key：
//     同一天重跑會更新那一列（原地覆蓋），不會插入第二列，所以「重跑不會重複寫入」。
//     想要看每一天的變化，把這支腳本排程成每天跑一次（例如 cron 或 CI），時間久了自然累積出歷史序列。
//
//   content_stats　　　　　一篇文章一列，永遠只反映「這次跑的結果」。用 slug 當 upsert key：
//     已存在的 slug 用 PATCH 覆蓋、新文章用 POST 新增、這次資料裡已經沒有的 slug（文章被刪除／改了
//     slug）預設用 DELETE 清掉，避免這個 collection 裡留著查無此文章的死資料。
//     不想要自動刪除的話用 --no-delete-missing。
//
// 這兩個 collection 要先存在（見 tools/create-content-stats-collection.mjs），這支腳本不會自己建立它們。
//
// 用法：
//   node tools/write-content-stats.mjs                          # dry-run，只印出計畫，不寫入
//   DIRECTUS_TOKEN=xxx node tools/write-content-stats.mjs --apply       # 真的寫入
//   DIRECTUS_TOKEN=xxx node tools/write-content-stats.mjs --apply --no-delete-missing
//
// 沒有 DIRECTUS_TOKEN，這支腳本本身沒有真的打過 POST/PATCH/DELETE /items/content_stats*。

import { buildArticleRows, buildHistoryRow, buildStats, splitByStatus } from './lib/content-stats-lib.mjs';

const CMS = 'https://cms.aixwang.dev';
const ARTICLES_FIELDS = 'id,status,slug,title,description,body,pub_date,updated_date,tags,faqs,featured,sort';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const deleteMissing = !args.includes('--no-delete-missing');
const token = process.env.DIRECTUS_TOKEN;

if (apply && !token) {
  console.error('要 --apply 真的寫入，必須先設定 DIRECTUS_TOKEN 環境變數（Directus 使用者的 static token）。');
  console.error('token 怎麼拿、collection 怎麼先建立見 docs/cms-insights-dashboard.md。');
  process.exit(1);
}

// ── 讀 CMS：文章與現有的 content_stats* 資料 ────────────────────────────────

async function fetchArticles() {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${CMS}/items/articles?limit=-1&fields=${ARTICLES_FIELDS}`, { headers });
  if (!res.ok) throw new Error(`讀取 articles 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  return data;
}

async function fetchExistingHistoryRow(runDate) {
  const url = `${CMS}/items/content_stats_history?filter[run_date][_eq]=${runDate}&limit=1&fields=id,run_date`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403 || res.status === 404) return { found: false, unreadable: true };
  if (!res.ok) throw new Error(`讀取 content_stats_history 現況失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  return { found: data.length > 0, row: data[0] ?? null, unreadable: false };
}

async function fetchExistingArticleRows() {
  const url = `${CMS}/items/content_stats?limit=-1&fields=id,slug`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 403 || res.status === 404) return { rows: [], unreadable: true };
  if (!res.ok) throw new Error(`讀取 content_stats 現況失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  const { data } = await res.json();
  return { rows: data, unreadable: false };
}

// ── 寫 CMS ─────────────────────────────────────────────────────────────

async function postItem(collection, payload) {
  const res = await fetch(`${CMS}/items/${collection}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /items/${collection} 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function patchItem(collection, id, payload) {
  const res = await fetch(`${CMS}/items/${collection}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`PATCH /items/${collection}/${id} 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
  return res.json();
}

async function deleteItem(collection, id) {
  const res = await fetch(`${CMS}/items/${collection}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`DELETE /items/${collection}/${id} 失敗，HTTP ${res.status}：${(await res.text()).slice(0, 300)}`);
}

// ── 主流程 ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`Directus：${CMS}`);
  console.log(apply ? '模式：--apply（會真的寫入 content_stats / content_stats_history）' : '模式：dry-run（預設，只印出計畫，不會寫入）');
  console.log(deleteMissing ? '缺席文章處理：預設會 DELETE 掉 content_stats 裡查無此文章的舊列' : '缺席文章處理：--no-delete-missing，保留 content_stats 裡查無此文章的舊列');
  console.log('');

  const rawArticles = await fetchArticles();
  if (!token) {
    console.log(`（沒有 DIRECTUS_TOKEN，只能看到公開的已發布文章：${rawArticles.length} 篇，看不到草稿）`);
  }
  if (!rawArticles.length) {
    console.error('CMS 沒有回傳任何文章，無法統計，中止。');
    process.exit(1);
  }

  const { published, nonPublished, nonPublishedCounts } = splitByStatus(rawArticles);
  if (!published.length) {
    console.error('CMS 沒有回傳任何 published 文章，無法統計（草稿不列入計算），中止。');
    process.exit(1);
  }
  if (token && nonPublished.length) {
    console.log(`共讀到 ${rawArticles.length} 篇（published ${published.length} 篇、非 published ${nonPublished.length} 篇）；統計只計算 published，草稿不列入計算。`);
  }

  const source = token
    ? `帶 token 讀取（共 ${rawArticles.length} 篇，統計只含 ${published.length} 篇 published，${nonPublished.length} 篇草稿不列入計算）`
    : '公開讀取（未帶 token，只含 status=published，不含草稿）';
  const stats = buildStats(published, { source, nonPublishedCounts });
  const runDate = stats.meta.generatedAt.slice(0, 10);
  const historyRow = buildHistoryRow(stats, { runDate });
  const articleRows = buildArticleRows(stats, { runDate });

  console.log(`本次統計：${stats.meta.articleCount} 篇文章，run_date=${runDate}`);
  console.log('');

  // ── content_stats_history：單列 upsert（by run_date）──
  console.log('══ content_stats_history（站台彙總，一天一列）══');
  let historyPlan;
  if (token) {
    const existing = await fetchExistingHistoryRow(runDate);
    if (existing.unreadable) {
      console.log('（讀不到 content_stats_history，collection 可能還沒建立——先跑 tools/create-content-stats-collection.mjs --apply）');
      historyPlan = { action: 'skip' };
    } else if (existing.found) {
      console.log(`run_date=${runDate} 已有一列（id=${existing.row.id}），將會 PATCH 覆蓋。`);
      historyPlan = { action: 'update', id: existing.row.id };
    } else {
      console.log(`run_date=${runDate} 目前沒有資料，將會 POST 新增一列。`);
      historyPlan = { action: 'insert' };
    }
  } else {
    console.log('（沒有 DIRECTUS_TOKEN，無法查詢現況，只顯示這次算出的內容，不知道會是 insert 還是 update）');
    historyPlan = { action: 'skip' };
  }
  console.log('這次算出的內容：');
  console.log(JSON.stringify(historyRow, null, 2));
  console.log('');

  // ── content_stats：多列 upsert（by slug）──
  console.log('══ content_stats（文章明細，一篇一列，只留最新）══');
  let toInsert = articleRows;
  let toUpdate = [];
  let toDelete = [];
  if (token) {
    const existing = await fetchExistingArticleRows();
    if (existing.unreadable) {
      console.log('（讀不到 content_stats，collection 可能還沒建立——先跑 tools/create-content-stats-collection.mjs --apply）');
    } else {
      const existingBySlug = new Map(existing.rows.map((r) => [r.slug, r.id]));
      const currentSlugs = new Set(articleRows.map((r) => r.slug));

      toInsert = articleRows.filter((r) => !existingBySlug.has(r.slug));
      toUpdate = articleRows
        .filter((r) => existingBySlug.has(r.slug))
        .map((r) => ({ id: existingBySlug.get(r.slug), row: r }));
      toDelete = existing.rows.filter((r) => !currentSlugs.has(r.slug));

      console.log(`會新增：${toInsert.length} 篇；會更新：${toUpdate.length} 篇；` +
        (deleteMissing ? `會刪除（查無此文章）：${toDelete.length} 篇` : `查無此文章但保留不動：${toDelete.length} 篇`));
      if (toInsert.length) console.log('  新增：', toInsert.map((r) => r.slug).join('、'));
      if (toDelete.length) console.log('  ' + (deleteMissing ? '刪除' : '保留') + '：', toDelete.map((r) => r.slug).join('、'));
    }
  } else {
    console.log(`（沒有 DIRECTUS_TOKEN，無法查詢現況；這次算出 ${articleRows.length} 篇的明細，實際 apply 時才知道哪些是新增、哪些是更新）`);
  }
  console.log('');
  console.log(`每篇文章這次算出的內容（前 3 篇，完整內容見 --apply 時實際送出的 payload）：`);
  console.log(JSON.stringify(articleRows.slice(0, 3), null, 2));
  if (articleRows.length > 3) console.log(`  ……（其餘 ${articleRows.length - 3} 篇省略，欄位結構相同）`);
  console.log('');

  if (!apply) {
    console.log('這是 dry-run，沒有任何資料被寫入 Directus。要真的寫入，加 --apply 並帶 DIRECTUS_TOKEN。');
    return;
  }

  // ── --apply：真的寫 ──
  console.log('開始寫入……');

  if (historyPlan.action === 'insert') {
    await postItem('content_stats_history', historyRow);
    console.log('content_stats_history：新增成功。');
  } else if (historyPlan.action === 'update') {
    await patchItem('content_stats_history', historyPlan.id, historyRow);
    console.log('content_stats_history：更新成功。');
  } else {
    console.log('content_stats_history：略過（collection 不存在或沒有 token）。');
  }

  for (const row of toInsert) {
    process.stdout.write(`content_stats：新增 ${row.slug} … `);
    try {
      await postItem('content_stats', row);
      console.log('成功。');
    } catch (err) {
      console.log(`失敗：${err.message}`);
    }
  }
  for (const { id, row } of toUpdate) {
    process.stdout.write(`content_stats：更新 ${row.slug} … `);
    try {
      await patchItem('content_stats', id, row);
      console.log('成功。');
    } catch (err) {
      console.log(`失敗：${err.message}`);
    }
  }
  if (deleteMissing) {
    for (const row of toDelete) {
      process.stdout.write(`content_stats：刪除 ${row.slug}（查無此文章）… `);
      try {
        await deleteItem('content_stats', row.id);
        console.log('成功。');
      } catch (err) {
        console.log(`失敗：${err.message}`);
      }
    }
  }

  console.log('\n完成。到 Directus 後台的 Insights dashboard 確認數字是否更新。');
}

main().catch((err) => {
  console.error(`執行失敗：${err.message}`);
  process.exit(1);
});
