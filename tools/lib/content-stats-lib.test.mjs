// 跑法：node --test tools/lib/content-stats-lib.test.mjs
// （或用 package.json 的 npm run test:content-stats）
//
// 全部用寫死的假文章資料（fixture），不打真的 Directus API。
// buildStats() 的完整輸出已經有 docs/content-stats-20260731.md 這份真實跑出來的報告可以人工核對，
// 這裡的測試著重在：純函式的邊界情況、以及 buildHistoryRow / buildArticleRows 有沒有正確把
// buildStats() 的巢狀輸出攤平成 content_stats_history / content_stats 兩個 collection 要的列資料
// （這兩個攤平函式沒有被 content-stats.mjs 用到，只有 write-content-stats.mjs 用，所以格式正不正確
// 完全靠這裡的測試把關）。
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildArticleRows,
  buildHistoryRow,
  buildStats,
  countBodyChars,
  countCodeBlocks,
  extractHeadings,
  extractLinksAndImages,
  isoWeekKey,
  splitByStatus,
  stripMarkdown,
} from './content-stats-lib.mjs';

// ── stripMarkdown / countBodyChars ─────────────────────────────────────────

test('stripMarkdown：清掉 code block、圖片、連結、標題符號，保留純文字', () => {
  const body = [
    '# 標題',
    '這是**粗體**與*斜體*文字。',
    '![alt文字](https://example.com/a.png)',
    '[連結文字](https://example.com)',
    '```js',
    'const x = 1;',
    '```',
    '- 清單項目',
    '> 引言',
  ].join('\n');
  const stripped = stripMarkdown(body);
  assert.doesNotMatch(stripped, /```/);
  assert.doesNotMatch(stripped, /https:\/\/example\.com/);
  assert.match(stripped, /連結文字/);
  assert.match(stripped, /粗體/);
  assert.match(stripped, /斜體/);
});

test('countBodyChars：只算非空白字元，中英文標點都算', () => {
  assert.equal(countBodyChars('abc'), 3);
  assert.equal(countBodyChars('a b c'), 3); // 空白不算
  assert.equal(countBodyChars('中文字，測試。'), 7); // 逐字元計，含標點
  assert.equal(countBodyChars(''), 0);
  assert.equal(countBodyChars(undefined), 0);
});

test('countBodyChars：HTML 標籤本身不算，標籤內文字算', () => {
  assert.equal(countBodyChars('<a href="https://x.com">連結</a>'), 2);
});

// ── extractHeadings ─────────────────────────────────────────────────────

test('extractHeadings：計算 markdown ## / ### 與原生 <h2>/<h3>', () => {
  const body = ['## 一', '### 二', '<h2 id="x">三</h2>', '#### 四（不算，h4）'].join('\n');
  const { h2, h3 } = extractHeadings(body);
  assert.equal(h2, 2);
  assert.equal(h3, 1);
});

// ── countCodeBlocks ─────────────────────────────────────────────────────

test('countCodeBlocks：成對 fence 正常計數，奇數 fence 標記 unclosed', () => {
  assert.deepEqual(countCodeBlocks('```js\nx\n```\n```py\ny\n```'), { count: 2, unclosed: false });
  assert.deepEqual(countCodeBlocks('```js\nx\n```\n```py\ny'), { count: 1, unclosed: true });
  assert.deepEqual(countCodeBlocks(''), { count: 0, unclosed: false });
});

// ── extractLinksAndImages ────────────────────────────────────────────────

test('extractLinksAndImages：區分站內／站外連結，抽出站內文章 slug', () => {
  const body = [
    '![圖](https://example.com/a.png)',
    '[外部](https://other.com/page)',
    '[內部相對](/blog/some-slug/)',
    '[內部完整網域](https://aixwang.dev/blog/other-slug)',
    '<a href="/blog/some-slug/">重複連到同一篇</a>',
  ].join('\n');
  const r = extractLinksAndImages(body);
  assert.equal(r.imageCount, 1);
  assert.equal(r.externalLinkCount, 1);
  assert.equal(r.internalLinkCount, 3);
  assert.deepEqual(r.blogLinkSlugs.sort(), ['other-slug', 'some-slug', 'some-slug'].sort());
});

// ── isoWeekKey ───────────────────────────────────────────────────────────

test('isoWeekKey：同一週的日期算出同一個 ISO 週', () => {
  assert.equal(isoWeekKey('2026-07-22'), isoWeekKey('2026-07-24'));
});

// ── buildStats（整合，用假文章資料）──────────────────────────────────────

const FIXTURE_ARTICLES = [
  {
    id: 1,
    status: 'published',
    slug: 'article-one',
    title: '第一篇文章標題',
    description: '這是一段長度介於 40 到 80 字之間、剛好用來測試 description 達標判定的說明文字內容示範。', // 需視實際字數調整
    body: '## 段落一\n這篇文章連到 [另一篇](/blog/article-two/)。\n\n### 小節\n內容。',
    pub_date: '2026-07-01',
    updated_date: '2026-07-01',
    tags: ['共用標籤', '孤兒標籤A'],
    faqs: [{ question: 'Q1', answer: 'A1' }],
    featured: true,
  },
  {
    id: 2,
    status: 'published',
    slug: 'article-two',
    title: '第二篇',
    description: '', // 缺 description
    body: '沒有任何標題、連結或標籤的最簡單內文。',
    pub_date: '2026-07-05',
    updated_date: null,
    tags: ['共用標籤'],
    faqs: [],
    featured: false,
  },
];

test('buildStats：基本盤點數字正確', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試資料' });
  assert.equal(stats.basic.total, 2);
  assert.equal(stats.basic.statusCounts.published, 2);
  assert.equal(stats.basic.featuredCount, 1);
  assert.equal(stats.basic.earliestPubDate, '2026-07-01');
  assert.equal(stats.basic.latestPubDate, '2026-07-05');
  assert.equal(stats.meta.source, '測試資料');
});

test('buildStats：description 缺失與孤兒標籤判定正確', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  assert.equal(stats.thresholds.missingDescCount, 1);
  assert.deepEqual(stats.tags.orphanTags, ['孤兒標籤A']);
  assert.equal(stats.tags.uniqueCount, 2);
});

test('buildStats：站內連結網絡——article-two 被 article-one 連入，article-one 是孤島', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  const inbound = Object.fromEntries(stats.linkNetwork.inboundCounts);
  assert.equal(inbound['article-two'], 1);
  assert.equal(inbound['article-one'], 0);
  assert.deepEqual(stats.linkNetwork.islands, ['article-one']);
  // article-two 沒有連出任何站內文章 → 是死路
  assert.ok(stats.linkNetwork.deadEnds.includes('article-two'));
});

test('buildStats：faq 與 tags 的 per-article 明細存在，供 buildArticleRows 使用', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  const faqBySlug = Object.fromEntries(stats.faq.rows.map((r) => [r.slug, r.count]));
  assert.equal(faqBySlug['article-one'], 1);
  assert.equal(faqBySlug['article-two'], 0);
  const tagsBySlug = Object.fromEntries(stats.tags.perArticle.map((r) => [r.slug, r.count]));
  assert.equal(tagsBySlug['article-one'], 2);
  assert.equal(tagsBySlug['article-two'], 1);
});

// ── buildHistoryRow ──────────────────────────────────────────────────────

test('buildHistoryRow：把 buildStats 輸出攤平成單一列（不含巢狀物件）', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試資料' });
  const row = buildHistoryRow(stats, { runDate: '2026-07-31' });

  assert.equal(row.run_date, '2026-07-31');
  assert.equal(row.source, '測試資料');
  assert.equal(row.article_count, 2);
  assert.equal(row.featured_count, 1);
  assert.equal(row.desc_missing_count, 1);
  assert.equal(row.unique_tag_count, 2);
  assert.equal(row.orphan_tag_count, 1);
  assert.equal(row.island_count, 1);
  assert.equal(row.dead_end_count, 1);
  assert.deepEqual(row.status_counts, { published: 2 });

  // 每個值都要是純量或 JSON 可序列化的物件（status_counts 例外），不能是巢狀的 stats 子物件本身，
  // 否則寫進 Directus 一般欄位（非 json 型別）會失敗。
  for (const [key, value] of Object.entries(row)) {
    if (key === 'status_counts' || value === null) continue;
    assert.notEqual(typeof value, 'object', `欄位 ${key} 不應該是物件`);
  }
});

test('buildHistoryRow：沒給 runDate 時，用 stats.meta.generatedAt 的日期部分', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  const row = buildHistoryRow(stats);
  assert.equal(row.run_date, stats.meta.generatedAt.slice(0, 10));
});

// ── buildArticleRows ─────────────────────────────────────────────────────

test('buildArticleRows：每篇文章一列，欄位齊全且依 slug 排序', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  const rows = buildArticleRows(stats, { runDate: '2026-07-31' });

  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.slug), ['article-one', 'article-two']); // 排序

  const one = rows.find((r) => r.slug === 'article-one');
  assert.equal(one.run_date, '2026-07-31');
  assert.equal(one.h2_count, 1);
  assert.equal(one.h3_count, 1);
  assert.equal(one.internal_link_count, 1);
  assert.equal(one.inbound_link_count, 0);
  assert.equal(one.is_island, true);
  assert.equal(one.is_dead_end, false);
  assert.equal(one.tag_count, 2);
  assert.equal(one.faq_count, 1);
  assert.equal(one.desc_status, '達標');
  assert.equal(typeof one.word_count, 'number');

  const two = rows.find((r) => r.slug === 'article-two');
  assert.equal(two.desc_status, '缺 description');
  assert.equal(two.desc_len, null);
  assert.equal(two.is_dead_end, true);
  assert.equal(two.inbound_link_count, 1);
  assert.equal(two.updated_date_used, null); // updated_date 是 null，fallback 用 pub_date 但欄位本身仍記錄原始值
});

test('buildArticleRows：每一列都是純量欄位（可以直接當 Directus item PATCH/POST 的 body）', () => {
  const stats = buildStats(FIXTURE_ARTICLES, { source: '測試' });
  const rows = buildArticleRows(stats, { runDate: '2026-07-31' });
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (value === null) continue; // null 是合法的純量值（Directus 欄位可以是 null），不算物件
      assert.notEqual(typeof value, 'object', `欄位 ${key} 不應該是物件（實際值：${JSON.stringify(value)}）`);
    }
  }
});

test('buildArticleRows：空文章清單回傳空陣列', () => {
  const stats = buildStats([], { source: '測試' });
  assert.deepEqual(buildArticleRows(stats), []);
});

// ── splitByStatus 與「草稿不污染統計」──────────────────────────────────────
//
// 背景：帶 DIRECTUS_TOKEN 讀取時，Directus 會連草稿一起回傳。草稿在線上沒有對應頁面
// （連過去是 404），使用者明確要求「草稿的數據不要算」。這裡驗證：
//   1. splitByStatus() 正確切分 published／nonPublished，並統計 nonPublished 各狀態篇數。
//   2. buildStats() 只吃 splitByStatus() 切出來的 published，草稿完全不影響任何指標
//      （字數、標籤、FAQ、featured 等）——跟「一開始就沒有草稿」算出來的結果要一致。
//   3. buildStats()／buildHistoryRow() 能從 opts.nonPublishedCounts 算出 draftCount／draft_count，
//      同時 status_counts 仍保留完整分布（含草稿），讓人看得到組成。

const DRAFT_ARTICLE = {
  id: 3,
  status: 'draft',
  slug: 'draft-only-slug',
  title: '草稿：尚未發佈',
  description: '這是一篇還沒發佈的草稿，內容與標籤都不應該被算進任何 published 限定的統計指標。',
  body: '## 草稿段落\n草稿內文，字數不該被算進平均值、中位數或任何字數統計。',
  pub_date: '2026-07-10',
  updated_date: '2026-07-10',
  tags: ['共用標籤', '草稿專屬標籤'],
  faqs: [{ question: 'DQ1', answer: 'DA1' }],
  featured: true,
};

const MIXED_ARTICLES = [...FIXTURE_ARTICLES, DRAFT_ARTICLE];

test('splitByStatus：依 status 切成 published／nonPublished，並統計 nonPublished 各狀態篇數', () => {
  const { published, nonPublished, nonPublishedCounts } = splitByStatus(MIXED_ARTICLES);
  assert.deepEqual(published.map((a) => a.slug), ['article-one', 'article-two']);
  assert.equal(nonPublished.length, 1);
  assert.equal(nonPublished[0].slug, 'draft-only-slug');
  assert.deepEqual(nonPublishedCounts, { draft: 1 });
});

test('splitByStatus：沒有非 published 文章時，nonPublished 是空陣列、nonPublishedCounts 是空物件', () => {
  const { published, nonPublished, nonPublishedCounts } = splitByStatus(FIXTURE_ARTICLES);
  assert.equal(published.length, 2);
  assert.deepEqual(nonPublished, []);
  assert.deepEqual(nonPublishedCounts, {});
});

test('buildStats：只吃 splitByStatus() 切出來的 published，混入草稿不會改變任何統計指標', () => {
  const { published, nonPublishedCounts } = splitByStatus(MIXED_ARTICLES);
  const withDraft = buildStats(published, { source: '測試', nonPublishedCounts });
  const withoutDraft = buildStats(FIXTURE_ARTICLES, { source: '測試' });

  assert.equal(withDraft.basic.total, withoutDraft.basic.total);
  assert.equal(withDraft.basic.featuredCount, withoutDraft.basic.featuredCount);
  assert.equal(withDraft.wordCount.avg, withoutDraft.wordCount.avg);
  assert.equal(withDraft.wordCount.median, withoutDraft.wordCount.median);
  assert.equal(withDraft.tags.uniqueCount, withoutDraft.tags.uniqueCount);
  assert.equal(withDraft.faq.avgPerArticle, withoutDraft.faq.avgPerArticle);
  assert.deepEqual(withDraft.linkNetwork.islands, withoutDraft.linkNetwork.islands);
  // 草稿專屬標籤不該出現在任何標籤統計裡
  assert.ok(!withDraft.tags.counts.some(([tag]) => tag === '草稿專屬標籤'));
  assert.ok(!withDraft.tags.orphanTags.includes('草稿專屬標籤'));
});

test('buildStats／buildHistoryRow：status_counts 保留完整分布（含草稿），draftCount／draft_count 只算非 published', () => {
  const { published, nonPublishedCounts } = splitByStatus(MIXED_ARTICLES);
  const stats = buildStats(published, { source: '測試', nonPublishedCounts });

  assert.equal(stats.basic.total, 2); // article_count 仍是 published 篇數，草稿不計入
  assert.equal(stats.basic.draftCount, 1);
  assert.deepEqual(stats.basic.statusCounts, { published: 2, draft: 1 });

  const row = buildHistoryRow(stats, { runDate: '2026-07-31' });
  assert.equal(row.article_count, 2);
  assert.equal(row.draft_count, 1);
  assert.deepEqual(row.status_counts, { published: 2, draft: 1 });
});

// ── 站內連結網絡：連到「只存在於草稿」的 slug 要判定為無效連結（線上是 404）──────

const LINK_TO_DRAFT_FIXTURE = [
  {
    id: 10,
    status: 'published',
    slug: 'pub-links-to-draft',
    title: '連到草稿的已發佈文章',
    description: '這篇文章內文有一條連結指向一篇只存在於草稿的 slug，用來測試草稿 slug 不能被當成有效連結目標。',
    body: '內文連到 [草稿文章](/blog/only-in-draft/)。',
    pub_date: '2026-07-15',
    updated_date: '2026-07-15',
    tags: ['測試'],
    faqs: [],
    featured: false,
  },
  {
    id: 11,
    status: 'draft',
    slug: 'only-in-draft',
    title: '只存在草稿的文章',
    description: '',
    body: '草稿內文，這篇在線上沒有對應頁面。',
    pub_date: '2026-07-16',
    updated_date: null,
    tags: [],
    faqs: [],
    featured: false,
  },
];

test('buildStats：published 文章連到只存在於草稿的 slug，判定為無效連結（草稿在線上是 404，不算已解析目標）', () => {
  const { published, nonPublishedCounts } = splitByStatus(LINK_TO_DRAFT_FIXTURE);
  const stats = buildStats(published, { source: '測試', nonPublishedCounts });

  // 草稿的 slug 不在比對基準（inboundCounts）裡，因為 buildStats 只拿到 published 陣列
  const inboundSlugs = stats.linkNetwork.inboundCounts.map(([slug]) => slug);
  assert.ok(!inboundSlugs.includes('only-in-draft'));

  // 連到的草稿 slug 要被列進「找不到對應文章」的清單
  assert.ok(stats.linkNetwork.unresolvedTargets.includes('only-in-draft'));

  // 沒有任何 published 文章的 inbound 連入數因此篇連結而增加（因為目標不存在於 published 集合）
  const inbound = Object.fromEntries(stats.linkNetwork.inboundCounts);
  assert.deepEqual(inbound, { 'pub-links-to-draft': 0 });
});
