// 統計 Directus CMS（cms.aixwang.dev, collection = articles）目前「算得出來」的數字，
// 產出一份 markdown 報告，供內容盤點與品質檢查使用。
//
// 用法：
//   node tools/content-stats.mjs                    印出 markdown 報告（只含 published，公開讀取）
//   node tools/content-stats.mjs --json              印出原始統計資料（JSON，不排版成報告）
//   DIRECTUS_TOKEN=xxx node tools/content-stats.mjs  帶 token 讀取（連草稿一起讀回來），
//                                                     但所有統計指標仍只算 published，草稿只列篇數
//
// 只讀 CMS，不寫入、不改 src/ 任何檔案。

import { buildStats, splitByStatus } from './lib/content-stats-lib.mjs';

const CMS = 'https://cms.aixwang.dev';
const TOKEN = process.env.DIRECTUS_TOKEN;
const FIELDS = 'id,status,slug,title,description,body,pub_date,updated_date,tags,faqs,featured,sort';

// ────────────────────────── 讀取 CMS ──────────────────────────

async function fetchArticles() {
  const headers = TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {};
  const res = await fetch(`${CMS}/items/articles?limit=-1&fields=${FIELDS}`, { headers });
  if (!res.ok) throw new Error(`Directus 讀取失敗：HTTP ${res.status}`);
  const { data } = await res.json();
  return data;
}

// ────────────────────────── Markdown 報告 ──────────────────────────

function fmtPct(n) {
  return n === null || n === undefined ? '無法計算' : `${n}%`;
}

function renderMarkdown(stats) {
  const lines = [];
  const push = (s = '') => lines.push(s);

  push(`# Blog 內容統計報告`);
  push();
  push(`產生時間：${stats.meta.generatedAt}`);
  push(`資料來源：${stats.meta.source}`);
  push(`統計篇數：${stats.meta.articleCount} 篇`);
  push();

  // 1. 基本盤點
  push(`## 1. 基本盤點`);
  push();
  push(`- 總篇數：${stats.basic.total}`);
  push(`- status 分布：${Object.entries(stats.basic.statusCounts).map(([k, v]) => `${k}=${v}`).join('、') || '無資料'}`);
  push(`- 草稿（非 published）篇數：${stats.basic.draftCount}（不計入下列任何統計指標）`);
  push(`- featured 篇數：${stats.basic.featuredCount}（占 ${fmtPct(stats.basic.featuredRatio)}）`);
  push(`- 最早發佈：${stats.basic.earliestPubDate ?? '無資料'}`);
  push(`- 最新發佈：${stats.basic.latestPubDate ?? '無資料'}`);
  push();

  // 2. 產出節奏
  push(`## 2. 產出節奏`);
  push();
  push(`### 每日發文數`);
  push();
  for (const [date, count] of Object.entries(stats.cadence.byDate).sort()) push(`- ${date}：${count} 篇`);
  push();
  push(`### 每週發文數（ISO 週）`);
  push();
  for (const [week, count] of Object.entries(stats.cadence.byWeek).sort()) push(`- ${week}：${count} 篇`);
  push();
  push(`### 相鄰兩篇發文間隔（依發佈日排序，同日發文間隔記為 0 天）`);
  push();
  if (stats.cadence.gaps.length) {
    for (const g of stats.cadence.gaps) push(`- ${g.fromDate} \`${g.from}\` → ${g.toDate} \`${g.to}\`：${g.days} 天`);
  } else {
    push('- 篇數不足以計算間隔（少於 2 篇）');
  }
  push();
  if (stats.cadence.maxGap) {
    push(`最長空窗：${stats.cadence.maxGap.days} 天（${stats.cadence.maxGap.fromDate} \`${stats.cadence.maxGap.from}\` → ${stats.cadence.maxGap.toDate} \`${stats.cadence.maxGap.to}\`）`);
  } else {
    push('最長空窗：無法計算（篇數不足）');
  }
  push();

  // 3. 更新狀態
  push(`## 3. 更新狀態（距今天數，由久到近排序）`);
  push();
  push(`| slug | updated_date | 距今天數 | 備註 |`);
  push(`|---|---|---|---|`);
  for (const f of stats.freshness) {
    const note = f.updatedDate === null ? '' : f.usedPubDateAsFallback ? '（無 updated_date，改用 pub_date 估算）' : '';
    push(`| ${f.slug} | ${f.updatedDate ?? '（無資料，改用 pub_date）'} | ${f.daysSinceUpdate ?? '無法計算'} | ${note} |`);
  }
  push();

  // 4. 字數
  push(`## 4. 正文字數`);
  push();
  push('定義：body 依序移除 fenced code block、inline code、圖片語法（含 alt 與 url）、連結語法（僅留文字）、');
  push('HTML 標籤本身、標題／清單／引言／表格／水平線等 markdown 標記與粗體斜體符號，剩餘文字以「非空白字元」逐字計數。');
  push();
  push(`- 平均：${stats.wordCount.avg ?? '無法計算'} 字`);
  push(`- 中位數：${stats.wordCount.median ?? '無法計算'} 字`);
  push(`- 最短：${stats.wordCount.min ?? '無法計算'} 字`);
  push(`- 最長：${stats.wordCount.max ?? '無法計算'} 字`);
  push();
  push(`| slug | 字數 |`);
  push(`|---|---|`);
  for (const w of stats.wordCount.perArticle) push(`| ${w.slug} | ${w.chars} |`);
  push();

  // 5. 門檻檢查
  push(`## 5. 門檻檢查`);
  push();
  push(`- description 規則：${stats.thresholds.descRule}`);
  push(`- title 規則：${stats.thresholds.titleRule}`);
  push(`- description 達標：${stats.thresholds.descPassCount} 篇；未達標：${stats.thresholds.descFailCount} 篇；缺 description：${stats.thresholds.missingDescCount} 篇`);
  push(`- title 長度分布：最短 ${stats.thresholds.titleLenMin ?? '無法計算'} 字、最長 ${stats.thresholds.titleLenMax ?? '無法計算'} 字、平均 ${stats.thresholds.titleLenAvg ?? '無法計算'} 字`);
  push();
  push(`| slug | title 長度 | description 長度 | description 狀態 |`);
  push(`|---|---|---|---|`);
  for (const r of stats.thresholds.rows) {
    push(`| ${r.slug} | ${r.titleLen} | ${r.hasDescription ? r.descLen : '（缺）'} | ${r.descStatus} |`);
  }
  push();
  if (stats.thresholds.descFailCount + stats.thresholds.missingDescCount > 0) {
    push(`> 注意：description 40–80 字的門檻來自 \`src/content.config.ts\` schema 註解，並非 \`SKILL.md\` 本文；`);
    push(`> 目前有 ${stats.thresholds.descFailCount + stats.thresholds.missingDescCount} / ${stats.thresholds.rows.length} 篇不在此範圍內，未達標比例偏高，`);
    push(`> 建議跟人工確認這個門檻是否仍在使用、或需要更新（本報告只如實列出差異，不代表門檻本身有誤）。`);
    push();
  }

  // 6. 標籤
  push(`## 6. 標籤`);
  push();
  push(`- 不重複標籤總數：${stats.tags.uniqueCount}`);
  push(`- 平均每篇標籤數：${stats.tags.avgPerArticle ?? '無法計算'}`);
  push(`- 孤兒標籤（只出現 1 次）：${stats.tags.orphanTags.length ? stats.tags.orphanTags.join('、') : '無'}`);
  push();
  push(`| 標籤 | 篇數 |`);
  push(`|---|---|`);
  for (const [tag, count] of stats.tags.counts) push(`| ${tag} | ${count} |`);
  push();

  // 7. FAQ
  push(`## 7. FAQ`);
  push();
  push(`- 平均每篇 FAQ 題數：${stats.faq.avgPerArticle ?? '無法計算'}`);
  push(`- 完全沒有 FAQ 的文章：${stats.faq.noFaqArticles.length ? stats.faq.noFaqArticles.join('、') : '無'}`);
  push();
  push(`| slug | FAQ 題數 |`);
  push(`|---|---|`);
  for (const r of stats.faq.rows) push(`| ${r.slug} | ${r.count} |`);
  push();

  // 8. 內文結構
  push(`## 8. 內文結構`);
  push();
  push(`| slug | H2 | H3 | 程式碼區塊 | 圖片 | 外部連結 | 站內連結 |`);
  push(`|---|---|---|---|---|---|---|`);
  for (const r of stats.structure.rows) {
    const codeCell = r.codeBlocksUnclosed ? `${r.codeBlocks}（⚠ 有未成對的 \`\`\`，數字可能不準）` : r.codeBlocks;
    push(`| ${r.slug} | ${r.h2} | ${r.h3} | ${codeCell} | ${r.images} | ${r.externalLinks} | ${r.internalLinks} |`);
  }
  push();

  // 9. 站內連結網絡
  push(`## 9. 站內連結網絡`);
  push();
  push('只統計 body 內指向 `/blog/<slug>` 的連結（markdown 連結與 HTML `<a href>` 皆算），同一篇文章重複連到同一個目標只算一次入連，自我連結不計入。');
  push();
  push(`| slug | 被連入次數 |`);
  push(`|---|---|`);
  for (const [slug, count] of stats.linkNetwork.inboundCounts) push(`| ${slug} | ${count} |`);
  push();
  push(`- 零連入的孤島文章：${stats.linkNetwork.islands.length ? stats.linkNetwork.islands.join('、') : '無'}`);
  push(`- 沒有連出任何站內文章的死路文章：${stats.linkNetwork.deadEnds.length ? stats.linkNetwork.deadEnds.join('、') : '無'}`);
  if (stats.linkNetwork.unresolvedTargets.length) {
    push(`- 連到的 slug 在目前 published 文章清單中找不到對應文章（可能是草稿、已下架或 slug 打錯——草稿故意不列入比對基準，因為草稿在線上沒有頁面，連過去就是 404）：${stats.linkNetwork.unresolvedTargets.join('、')}`);
  }
  push();

  // 10. slug
  push(`## 10. slug`);
  push();
  push(`| slug | 長度 | 含非 ASCII 字元 |`);
  push(`|---|---|---|`);
  for (const r of stats.slugRows) push(`| ${r.slug} | ${r.length} | ${r.hasNonAscii ? '是' : '否'} |`);
  push();

  return lines.join('\n');
}

// ────────────────────────── 入口 ──────────────────────────

async function main() {
  const asJson = process.argv.includes('--json');
  const rawArticles = await fetchArticles();
  if (!rawArticles.length) {
    console.error('CMS 沒有回傳任何文章，無法統計。');
    process.exit(1);
  }
  const { published, nonPublished, nonPublishedCounts } = splitByStatus(rawArticles);
  if (!published.length) {
    console.error('CMS 沒有回傳任何 published 文章，無法統計（草稿不列入計算）。');
    process.exit(1);
  }
  const source = TOKEN
    ? `帶 token 讀取（共 ${rawArticles.length} 篇，統計只含 ${published.length} 篇 published，${nonPublished.length} 篇草稿不列入計算）`
    : '公開讀取（未帶 token，只含 status=published，不含草稿）';
  const stats = buildStats(published, { source, nonPublishedCounts });
  if (asJson) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    console.log(renderMarkdown(stats));
  }
}

main().catch((err) => {
  console.error(`統計失敗：${err.message}`);
  process.exit(1);
});
