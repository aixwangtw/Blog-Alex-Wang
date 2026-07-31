// 內容統計的純計算邏輯（不做網路請求、不讀環境變數、不呼叫 process.exit）。
// 從 tools/content-stats.mjs 抽出來，讓「印 markdown 報告」（content-stats.mjs）跟
// 「寫進 Directus content_stats / content_stats_history collection」（write-content-stats.mjs）
// 共用同一份計算邏輯，不要各自維護一份、算出不一樣的數字。
//
// 對應關係：
//   fetchArticles()（各 CLI 腳本自己的網路請求）→ buildStats(articles) → 這裡
//     ├─ content-stats.mjs：renderMarkdown(stats) 印成 markdown 報告
//     └─ write-content-stats.mjs：buildHistoryRow(stats) / buildArticleRows(stats) 轉成
//        content_stats_history（一天一列的站台彙總）與 content_stats（一篇文章一列的目前快照）
//        兩個 Directus collection 要寫入的列資料

// ── 已查證的門檻來源 ──
// description 40–80 字：來源 src/content.config.ts schema 註解（非 SKILL.md 本文，
//   SKILL.md 沒有訂 description／title 長度規則，只有粗體 ≤8 組這類格式規則，
//   跟本次要統計的項目無關，所以不列入）。
export const DESC_MIN = 40;
export const DESC_MAX = 80;

// ────────────────────────── 共用小工具 ──────────────────────────

const charLen = (s) => (s ? [...s].length : 0);

const average = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

const median = (nums) => {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const round1 = (n) => (n === null || n === undefined ? null : Math.round(n * 10) / 10);

// pub_date / updated_date 都是「日期字串」（無時間），一律當 UTC 午夜比較，避免時區位移
const toUTCDate = (dateStr) => new Date(`${dateStr}T00:00:00Z`);
const daysBetween = (a, b) => Math.round((toUTCDate(b) - toUTCDate(a)) / 86400000);

export function isoWeekKey(dateStr) {
  const d = toUTCDate(dateStr);
  // 移到當週週四，年份以週四所在年份為準（ISO 8601 標準作法）
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

// ────────────────────────── 依 status 切分 published／非 published ──────────────────────────
//
// 帶 DIRECTUS_TOKEN 讀取時，Directus 會連草稿一起回傳。草稿在線上沒有對應頁面（連過去是 404），
// 所有品質指標（字數、門檻、標籤、FAQ、內文結構、站內連結網絡、發文節奏、slug）都只該算 published；
// 草稿只留「篇數」這一個數字（見 buildHistoryRow 的 draft_count）。這裡只做切分，不做任何統計計算，
// 呼叫端（content-stats.mjs／write-content-stats.mjs）在拿到 fetchArticles() 的原始結果後，
// 第一件事就是呼叫這個函式，把 published 陣列丟給 buildStats()。
//
// @param {Array<object>} articles 未過濾的 Directus articles items（可能含 published 與其他狀態）
// @returns {{ published: object[], nonPublished: object[], nonPublishedCounts: Record<string, number> }}
export function splitByStatus(articles) {
  const published = [];
  const nonPublished = [];
  const nonPublishedCounts = {};
  for (const a of articles) {
    if (a.status === 'published') {
      published.push(a);
    } else {
      nonPublished.push(a);
      nonPublishedCounts[a.status] = (nonPublishedCounts[a.status] || 0) + 1;
    }
  }
  return { published, nonPublished, nonPublishedCounts };
}

// ────────────────────────── 正文字數（定義寫死在這裡，報告會照抄這段說明）──────────────────────────
//
// 定義：body 依序做以下清除，剩下的內容統計「非空白字元數」（逐字元計，中英文標點皆算）：
//   1. 移除 fenced code blocks（``` ... ```）
//   2. 移除 inline code（`...`）
//   3. 移除圖片語法 ![alt](url)（alt 文字與網址都不算正文）
//   4. 連結語法 [文字](url) 只保留文字，網址不算
//   5. 移除所有 HTML 標籤本身，保留標籤內文字（例如 <a href="...">連結文字</a> 只留「連結文字」）
//   6. 移除標題井號（#、##…）、清單標記（-、*、1.）、引言標記（>）、表格分隔線與豎線、水平線
//   7. 移除粗體 **、斜體 * _、粗斜體標記本身，保留文字
//   8. 剩餘文字用 [...非空白字元] 計數（用展開運算子逐字元，不是用 length，避免多位元組字元被算成 2）

export function stripMarkdown(body) {
  let t = body || '';
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`[^`]*`/g, ' ');
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/<[^>]+>/g, '');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/gm, ' ');
  t = t.replace(/\|/g, ' ');
  t = t.replace(/^>\s?/gm, '');
  t = t.replace(/^\s*[-*+]\s+/gm, '');
  t = t.replace(/^\s*\d+\.\s+/gm, '');
  t = t.replace(/\*\*([^*]*)\*\*/g, '$1');
  t = t.replace(/\*([^*]*)\*/g, '$1');
  t = t.replace(/__([^_]*)__/g, '$1');
  t = t.replace(/^-{3,}$/gm, ' ');
  return t;
}

export function countBodyChars(body) {
  const stripped = stripMarkdown(body);
  return [...stripped].filter((ch) => !/\s/.test(ch)).length;
}

// ────────────────────────── 內文結構解析 ──────────────────────────

export function extractHeadings(body) {
  let h2 = 0;
  let h3 = 0;
  for (const line of (body || '').split('\n')) {
    const m = line.match(/^(#{1,6})\s+/);
    if (m) {
      if (m[1].length === 2) h2++;
      else if (m[1].length === 3) h3++;
    }
    // longform-lookup skill 提到查詢型長文可能改用原生 <h2 id="...">文字</h2>，一併算入
    if (/^<h2\b/.test(line.trim())) h2++;
    if (/^<h3\b/.test(line.trim())) h3++;
  }
  return { h2, h3 };
}

export function countCodeBlocks(body) {
  const fences = ((body || '').match(/^```/gm) || []).length;
  // 正常應成對出現；若為奇數代表 markdown 沒寫完整的 fence，無法確定區塊數
  return { count: Math.floor(fences / 2), unclosed: fences % 2 !== 0 };
}

export function extractLinksAndImages(body) {
  const b = body || '';
  const mdMatches = [...b.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => ({
    isImage: m[1] === '!',
    url: m[2],
  }));
  const htmlLinks = [...b.matchAll(/<a\s+[^>]*href=["']([^"']+)["']/gi)].map((m) => ({
    isImage: false,
    url: m[1],
  }));
  const htmlImages = [...b.matchAll(/<img\s+[^>]*src=["']([^"']+)["']/gi)].map((m) => ({
    isImage: true,
    url: m[1],
  }));
  const all = [...mdMatches, ...htmlLinks, ...htmlImages];

  const images = all.filter((x) => x.isImage);
  const links = all.filter((x) => !x.isImage);

  const isInternal = (url) =>
    url.startsWith('/') || /^https?:\/\/(www\.)?aixwang\.dev\//.test(url);
  const blogSlugFromUrl = (url) => {
    const m = url.match(/^(?:https?:\/\/(?:www\.)?aixwang\.dev)?\/blog\/([a-zA-Z0-9_-]+)\/?(?:[?#].*)?$/);
    return m ? m[1] : null;
  };

  const internalLinks = links.filter((l) => isInternal(l.url));
  const externalLinks = links.filter((l) => !isInternal(l.url));
  const blogLinkSlugs = internalLinks.map((l) => blogSlugFromUrl(l.url)).filter(Boolean);

  return {
    imageCount: images.length,
    internalLinkCount: internalLinks.length,
    externalLinkCount: externalLinks.length,
    blogLinkSlugs, // 這篇連到的其他文章 slug（可能重複，代表同一篇連了多次）
  };
}

// ────────────────────────── 主計算 ──────────────────────────

/**
 * @param {Array<object>} articles 只該傳 published 文章（呼叫端先用 splitByStatus() 切分好）。
 *        欄位需求見各 CLI 腳本的 FIELDS 常數。這裡不會再依 status 過濾，草稿混進來就會污染
 *        所有指標——這是呼叫端的責任，不是這個函式的責任。
 * @param {{ source?: string, nonPublishedCounts?: Record<string, number> }} [opts]
 *        source：這批 articles 資料的來源說明（例如有沒有帶 token、含不含草稿），純字串直接放進
 *          meta.source，這裡不讀 process.env，由呼叫端（CLI 腳本）決定。
 *        nonPublishedCounts：splitByStatus() 回傳的非 published 篇數分布（例如 { draft: 6 }），
 *          純粹用來讓 basic.statusCounts 顯示完整組成、basic.draftCount 算出草稿篇數；
 *          不會被算進任何其他指標。
 */
export function buildStats(articles, opts = {}) {
  const now = new Date();
  const todayISO = now.toISOString().slice(0, 10);
  const source = opts.source ?? '未標示來源';
  const nonPublishedCounts = opts.nonPublishedCounts ?? {};

  // 1. 基本盤點
  // statusCounts 是「完整組成」，含 nonPublishedCounts（草稿等）——只給人看分布，
  // 不代表這些篇數有被算進 total 或任何其他指標。
  const statusCounts = {};
  for (const a of articles) statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  for (const [status, count] of Object.entries(nonPublishedCounts)) {
    statusCounts[status] = (statusCounts[status] || 0) + count;
  }
  const draftCount = Object.values(nonPublishedCounts).reduce((a, b) => a + b, 0);
  const featuredCount = articles.filter((a) => a.featured).length;
  const pubDates = articles.map((a) => a.pub_date).filter(Boolean).sort();
  const basic = {
    total: articles.length, // published 篇數（articles 只該含 published，見函式頂端說明）
    statusCounts,
    draftCount, // 非 published 的總篇數，不列入 total 或任何其他指標
    featuredCount,
    featuredRatio: articles.length ? round1((featuredCount / articles.length) * 100) : null,
    earliestPubDate: pubDates[0] ?? null,
    latestPubDate: pubDates[pubDates.length - 1] ?? null,
  };

  // 2. 產出節奏
  const byDate = {};
  const byWeek = {};
  for (const a of articles) {
    if (!a.pub_date) continue;
    byDate[a.pub_date] = (byDate[a.pub_date] || 0) + 1;
    const wk = isoWeekKey(a.pub_date);
    byWeek[wk] = (byWeek[wk] || 0) + 1;
  }
  const sortedByPubDate = [...articles]
    .filter((a) => a.pub_date)
    .sort((a, b) => a.pub_date.localeCompare(b.pub_date) || a.id - b.id);
  const gaps = [];
  for (let i = 1; i < sortedByPubDate.length; i++) {
    const prev = sortedByPubDate[i - 1];
    const cur = sortedByPubDate[i];
    gaps.push({
      from: prev.slug,
      to: cur.slug,
      fromDate: prev.pub_date,
      toDate: cur.pub_date,
      days: daysBetween(prev.pub_date, cur.pub_date),
    });
  }
  const maxGap = gaps.length ? gaps.reduce((max, g) => (g.days > max.days ? g : max), gaps[0]) : null;
  const cadence = { byDate, byWeek, gaps, maxGap };

  // 3. 更新狀態
  const freshness = articles
    .map((a) => {
      const ref = a.updated_date || a.pub_date;
      if (!ref) return { slug: a.slug, title: a.title, updatedDate: null, usedPubDateAsFallback: false, daysSinceUpdate: null };
      return {
        slug: a.slug,
        title: a.title,
        updatedDate: a.updated_date || null,
        usedPubDateAsFallback: !a.updated_date,
        daysSinceUpdate: daysBetween(ref, todayISO),
      };
    })
    .sort((a, b) => (b.daysSinceUpdate ?? -1) - (a.daysSinceUpdate ?? -1));

  // 4. 字數
  const wordCountList = articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    chars: countBodyChars(a.body || ''),
  }));
  const wcNums = wordCountList.map((w) => w.chars);
  const wordCount = {
    perArticle: [...wordCountList].sort((a, b) => b.chars - a.chars),
    avg: round1(average(wcNums)),
    median: median(wcNums),
    min: wcNums.length ? Math.min(...wcNums) : null,
    max: wcNums.length ? Math.max(...wcNums) : null,
  };

  // 5. 門檻檢查
  const thresholdRows = articles.map((a) => {
    const titleLen = charLen(a.title);
    const hasDescription = !!(a.description && a.description.trim());
    const descLen = hasDescription ? charLen(a.description) : 0;
    let descStatus;
    if (!hasDescription) descStatus = '缺 description';
    else if (descLen < DESC_MIN) descStatus = `未達標（少於 ${DESC_MIN} 字）`;
    else if (descLen > DESC_MAX) descStatus = `未達標（超過 ${DESC_MAX} 字）`;
    else descStatus = '達標';
    return { slug: a.slug, title: a.title, titleLen, hasDescription, descLen, descStatus };
  });
  const missingDescCount = thresholdRows.filter((r) => !r.hasDescription).length;
  const descPassCount = thresholdRows.filter((r) => r.descStatus === '達標').length;
  const titleLens = thresholdRows.map((r) => r.titleLen);
  const thresholds = {
    rows: thresholdRows,
    missingDescCount,
    descPassCount,
    descFailCount: thresholdRows.length - descPassCount - missingDescCount,
    titleLenMin: titleLens.length ? Math.min(...titleLens) : null,
    titleLenMax: titleLens.length ? Math.max(...titleLens) : null,
    titleLenAvg: round1(average(titleLens)),
    descRule: `${DESC_MIN}–${DESC_MAX} 字（來源：src/content.config.ts schema 註解，SKILL.md 本文未訂 description 長度規則）`,
    titleRule: '未找到任何文件訂定 title 長度門檻（SKILL.md、content.config.ts 皆無），僅列分布，不做達標判定',
  };

  // 6. 標籤
  const tagCounts = {};
  for (const a of articles) {
    for (const tag of a.tags || []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const orphanTags = Object.entries(tagCounts)
    .filter(([, count]) => count === 1)
    .map(([tag]) => tag)
    .sort();
  const tagsPerArticle = articles.map((a) => ({ slug: a.slug, title: a.title, count: (a.tags || []).length }));
  const tags = {
    uniqueCount: Object.keys(tagCounts).length,
    counts: Object.entries(tagCounts).sort((a, b) => b[1] - a[1]),
    avgPerArticle: round1(average(tagsPerArticle.map((r) => r.count))),
    orphanTags,
    perArticle: tagsPerArticle,
  };

  // 7. FAQ
  const faqRows = articles.map((a) => ({ slug: a.slug, title: a.title, count: (a.faqs || []).length }));
  const faq = {
    rows: [...faqRows].sort((a, b) => a.count - b.count),
    noFaqArticles: faqRows.filter((r) => r.count === 0).map((r) => r.slug),
    avgPerArticle: round1(average(faqRows.map((r) => r.count))),
  };

  // 8. 內文結構
  const structureRows = articles.map((a) => {
    const headings = extractHeadings(a.body || '');
    const code = countCodeBlocks(a.body || '');
    const links = extractLinksAndImages(a.body || '');
    return {
      slug: a.slug,
      title: a.title,
      h2: headings.h2,
      h3: headings.h3,
      codeBlocks: code.count,
      codeBlocksUnclosed: code.unclosed,
      images: links.imageCount,
      externalLinks: links.externalLinkCount,
      internalLinks: links.internalLinkCount,
      blogLinkSlugs: links.blogLinkSlugs,
    };
  });
  const structure = { rows: structureRows };

  // 9. 站內連結網絡（只算指向 /blog/<slug> 的連結）
  const inboundCounts = new Map(articles.map((a) => [a.slug, 0]));
  const unresolvedTargets = new Set(); // 連到不存在（未發佈或已改 slug）的文章
  for (const row of structureRows) {
    const uniqueTargets = new Set(row.blogLinkSlugs.filter((s) => s !== row.slug)); // 排除自我連結，一篇連兩次只算一次入連
    for (const target of uniqueTargets) {
      if (inboundCounts.has(target)) {
        inboundCounts.set(target, inboundCounts.get(target) + 1);
      } else {
        unresolvedTargets.add(target);
      }
    }
  }
  const islands = [...inboundCounts.entries()].filter(([, count]) => count === 0).map(([slug]) => slug);
  const deadEnds = structureRows
    .filter((row) => new Set(row.blogLinkSlugs.filter((s) => s !== row.slug)).size === 0)
    .map((row) => row.slug);
  const linkNetwork = {
    inboundCounts: [...inboundCounts.entries()].sort((a, b) => b[1] - a[1]),
    islands,
    deadEnds,
    unresolvedTargets: [...unresolvedTargets].sort(),
  };

  // 10. slug
  const slugRows = articles.map((a) => ({
    slug: a.slug,
    length: a.slug.length,
    hasNonAscii: /[^\x00-\x7F]/.test(a.slug),
  }));

  return {
    meta: {
      generatedAt: now.toISOString(),
      source,
      articleCount: articles.length,
    },
    basic,
    cadence,
    freshness,
    wordCount,
    thresholds,
    tags,
    faq,
    structure,
    linkNetwork,
    slugRows,
  };
}

// ────────────────────────── Directus content_stats* collection 的列資料 ──────────────────────────
//
// 把 buildStats() 的輸出攤平成兩個 Directus collection 要寫入的列：
//   - content_stats_history：一天一列，站台彙總數字（time-series / metric 趨勢圖用）
//   - content_stats：一篇文章一列，永遠反映「最新一次跑的結果」（list / bar / pie 明細圖用）
// 這兩個 collection 存在的理由：這裡面的數字（字數、門檻判定、標籤/FAQ 統計、內文結構、
// 站內連結網絡、slug 檢查）Directus Insights 的 panel 沒辦法直接對 articles collection
// 算出來（body 要解析 markdown、tags/faqs 是 JSON 陣列不是可 group by 的關聯欄位、
// 沒有字串長度类 aggregate function、也沒有「跟今天差幾天」的 aggregate）。
// 詳見 docs/cms-insights-dashboard.md「可直接查 / 需要預先計算 的指標分類」。

/**
 * @param {ReturnType<typeof buildStats>} stats
 * @param {{ runDate?: string }} [opts] runDate 預設用 stats.meta.generatedAt 的日期部分（UTC）
 * @returns {object} 要寫進 content_stats_history 的一列（不含 Directus 自動 id）
 */
export function buildHistoryRow(stats, opts = {}) {
  const runDate = opts.runDate || stats.meta.generatedAt.slice(0, 10);
  return {
    run_date: runDate,
    generated_at: stats.meta.generatedAt,
    source: stats.meta.source,
    article_count: stats.basic.total,
    draft_count: stats.basic.draftCount,
    status_counts: stats.basic.statusCounts,
    featured_count: stats.basic.featuredCount,
    featured_ratio: stats.basic.featuredRatio,
    avg_word_count: stats.wordCount.avg,
    median_word_count: stats.wordCount.median,
    min_word_count: stats.wordCount.min,
    max_word_count: stats.wordCount.max,
    desc_pass_count: stats.thresholds.descPassCount,
    desc_fail_count: stats.thresholds.descFailCount,
    desc_missing_count: stats.thresholds.missingDescCount,
    title_len_avg: stats.thresholds.titleLenAvg,
    unique_tag_count: stats.tags.uniqueCount,
    orphan_tag_count: stats.tags.orphanTags.length,
    avg_tags_per_article: stats.tags.avgPerArticle,
    avg_faq_per_article: stats.faq.avgPerArticle,
    no_faq_count: stats.faq.noFaqArticles.length,
    island_count: stats.linkNetwork.islands.length,
    dead_end_count: stats.linkNetwork.deadEnds.length,
    unresolved_link_target_count: stats.linkNetwork.unresolvedTargets.length,
    max_gap_days: stats.cadence.maxGap ? stats.cadence.maxGap.days : null,
  };
}

/**
 * @param {ReturnType<typeof buildStats>} stats
 * @param {{ runDate?: string }} [opts]
 * @returns {object[]} 要寫進 content_stats 的列（每篇文章一列，依 slug 排序，不含 Directus 自動 id）
 */
export function buildArticleRows(stats, opts = {}) {
  const runDate = opts.runDate || stats.meta.generatedAt.slice(0, 10);
  const bySlug = new Map();
  const get = (slug) => {
    if (!bySlug.has(slug)) bySlug.set(slug, { slug, run_date: runDate });
    return bySlug.get(slug);
  };

  for (const w of stats.wordCount.perArticle) {
    const r = get(w.slug);
    r.title = w.title;
    r.word_count = w.chars;
  }
  for (const t of stats.thresholds.rows) {
    const r = get(t.slug);
    r.title_len = t.titleLen;
    r.desc_len = t.hasDescription ? t.descLen : null;
    r.desc_status = t.descStatus;
  }
  for (const s of stats.structure.rows) {
    const r = get(s.slug);
    r.h2_count = s.h2;
    r.h3_count = s.h3;
    r.code_block_count = s.codeBlocks;
    r.image_count = s.images;
    r.external_link_count = s.externalLinks;
    r.internal_link_count = s.internalLinks;
  }
  for (const [slug, count] of stats.linkNetwork.inboundCounts) {
    get(slug).inbound_link_count = count;
  }
  for (const f of stats.freshness) {
    const r = get(f.slug);
    r.days_since_update = f.daysSinceUpdate;
    r.updated_date_used = f.updatedDate ?? null;
  }
  for (const sr of stats.slugRows) {
    const r = get(sr.slug);
    r.slug_length = sr.length;
    r.slug_has_non_ascii = sr.hasNonAscii;
  }
  for (const tg of stats.tags.perArticle) {
    get(tg.slug).tag_count = tg.count;
  }
  for (const fq of stats.faq.rows) {
    get(fq.slug).faq_count = fq.count;
  }

  const islandSet = new Set(stats.linkNetwork.islands);
  const deadEndSet = new Set(stats.linkNetwork.deadEnds);
  for (const [slug, row] of bySlug.entries()) {
    row.is_island = islandSet.has(slug);
    row.is_dead_end = deadEndSet.has(slug);
  }

  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
