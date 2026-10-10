// 右下角客服的 FAQ 比對：把使用者的口語問句對到站上 FAQ（資料來自 /faq-index.json）。
// 只在使用者點進客服輸入框時才以 dynamic import 載入，不佔每頁的初始載入。
// 單元測試：tools/lib/faq-match.test.mjs。
//
// 做法（純前端、無外部服務）：
// 1. 正規化：NFKC（全形轉半形）、轉小寫、同義詞換成同一個詞（多少錢 → 費用、下載 → 匯出…）。
// 2. 斷詞：用「嗎、可以、怎麼…」這類虛詞與標點切段，中文段落取相鄰兩字（bigram），單字段保留單字，
//    英數取整個字（word、demo、mathtype）。
// 3. 打分：每個詞依 IDF 加權（越少題目用到越有鑑別力），命中題目算 1、只命中答案算 0.3、
//    只命中主題詞（文章標題與標籤）算 0.25；再看題目本身被問句覆蓋多少、問句有幾個不同的詞段對上題目。
//    題庫系統文章的題目加權優先（問句提到題庫、考卷、Word… 時加更多）。
// 4. 分數未達 MATCH_THRESHOLD 就不顯示，交回原本的站內搜尋。

const SYNONYMS = [
  [/多少錢|價錢|價格|報價|收費|花費|開銷|成本|要錢|收錢|預算/g, '費用'],
  [/不用錢|不要錢|免錢|零元/g, '免費'],
  [/下載|導出|輸出|存成|轉成|轉檔/g, '匯出'],
  [/導入|丟進|放進/g, '匯入'],
  [/試卷|考題|卷子/g, '考卷'],
  [/方程式|算式|數學式/g, '公式'],
  [/著作權|侵權/g, '版權'],
  [/章節|分類/g, '單元'],
  [/圖形|圖片|附圖|圖表/g, '圖'],
  [/學科/g, '科目'],
  [/英文|國文|理化|物理|化學|生物|地理|歷史|社會科|自然科/g, '其他科目'],
  [/孩子|小孩|學員/g, '學生'],
  [/題目庫/g, '題庫'],
  [/微軟 ?word|docx/g, 'word'],
  [/math ?type/g, 'mathtype'],
  [/示範|展示/g, 'demo'],
  [/上課|授課|教課|家教課/g, '教學'],
  [/一個月|每個月|月費/g, '每月'],
  [/多久|多長時間|工期|做多長/g, '時程'],
  [/跑版|亂掉|變形|亂碼|走樣/g, '跑掉'],
  [/貼到|貼進|貼上/g, '貼上'],
  [/失效|到期/g, '過期'],
];

// 虛詞與疑問詞只用來切段，不參與比對，避免「可以…嗎」把不相干的題目湊在一起。
const STOPWORDS = /請問|想問|問一下|可不可以|能不能|能否|是否|是不是|有沒有|會不會|要不要|可以|怎麼|怎樣|如何|什麼|甚麼|為什麼|哪些|哪裡|多少|一下|到底|還是|真的|大概|一定|嗎|呢|吧|啊|喔|哦|嘛|的|了|我們|我|你們|你|妳|您|是|就|也|都|和|跟|與|及|或|要|有|會|能|在/g;

// 問句裡出現這些詞，表示在問題庫系統，題庫文章的題目再加分
const BANK_HINTS = ['題庫', '考卷', '出題', '詳解', '補習班', '數學', '老師', '題目', 'mathtype', 'word', 'demo', '單元', '公式', '學生', '試用'];

const CJK = /[\u3400-\u9fff\uf900-\ufaff]/;

export function normalize(text) {
  let value = String(text || '').normalize('NFKC').toLowerCase();
  for (const [pattern, replacement] of SYNONYMS) value = value.replace(pattern, replacement);
  return value;
}

/**
 * 把一句話切成「詞段」，每段是一組比對用的詞：中文取 bigram（單字段保留單字），英數取整個字。
 * 分段是為了知道問句裡有幾個不同的詞被對上，見 rankFaqs。
 * @param {string} text
 * @returns {Set<string>[]}
 */
export function tokenizeSegments(text) {
  const result = [];
  const segments = normalize(text).replace(STOPWORDS, ' ').split(/[^\p{L}\p{N}]+/u);
  for (const segment of segments) {
    if (!segment) continue;
    // 中英混排（例如「下載成word檔」）拆成中文段與英數段分開處理
    const parts = segment.match(/[\u3400-\u9fff\uf900-\ufaff]+|[a-z0-9]+/g) || [];
    for (const part of parts) {
      const tokens = new Set();
      if (CJK.test(part)) {
        if (part.length === 1) tokens.add(part);
        for (let index = 0; index < part.length - 1; index += 1) tokens.add(part.slice(index, index + 2));
      } else if (part.length >= 2) {
        tokens.add(part);
        // 「wsl2」這類帶版本號的字，也讓只打「wsl」的人對得上
        const stem = part.match(/^[a-z]{2,}(?=[0-9]+$)/);
        if (stem) tokens.add(stem[0]);
      }
      if (tokens.size) result.push(tokens);
    }
  }
  return result;
}

/**
 * @param {string} text
 * @returns {Set<string>}
 */
export function tokenize(text) {
  const tokens = new Set();
  for (const segment of tokenizeSegments(text)) {
    for (const token of segment) tokens.add(token);
  }
  return tokens;
}

export function buildFaqIndex(items) {
  const entries = items.map((item) => ({
    item,
    question: tokenize(item.q),
    answer: tokenize(item.a),
    topic: tokenize(item.k || ''),
  }));
  const documentFrequency = new Map();
  for (const entry of entries) {
    for (const token of new Set([...entry.question, ...entry.answer])) {
      documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
    }
  }
  const total = entries.length;
  // 沒有任何題目用到的詞（多半是跨詞的 bigram，例如「庫要」）只給最低權重，
  // 不然它們會拿到最高 IDF，把問句裡真正有對上的詞稀釋掉。
  function idf(token) {
    const frequency = documentFrequency.get(token) || 0;
    if (!frequency) return 1;
    return Math.log(1 + total / (1 + frequency));
  }
  return { entries, idf };
}

export const MATCH_THRESHOLD = 0.52;

/**
 * 依相似度排序所有可能的 FAQ（已排除證據不足的題目），分數高的在前。
 * @param {{ entries: Array<{item: object, question: Set<string>, answer: Set<string>, topic: Set<string>}>, idf: (token: string) => number }} index
 * @param {string} query
 * @returns {Array<{ item: object, score: number }>}
 */
export function rankFaqs(index, query) {
  const querySegments = tokenizeSegments(query);
  const queryTokens = tokenize(query);
  if (!queryTokens.size) return [];
  const normalizedQuery = normalize(query);
  const asksAboutBank = BANK_HINTS.some((hint) => normalizedQuery.includes(hint));

  let queryWeight = 0;
  for (const token of queryTokens) queryWeight += index.idf(token);

  const ranked = [];
  for (const entry of index.entries) {
    let gained = 0;
    let questionHit = 0;
    let matchedTokens = 0;
    for (const token of queryTokens) {
      const weight = index.idf(token);
      if (entry.question.has(token)) {
        gained += weight;
        questionHit += weight;
        matchedTokens += 1;
      } else if (entry.answer.has(token)) {
        gained += weight * 0.3;
        matchedTokens += 1;
      } else if (entry.topic.has(token)) {
        gained += weight * 0.25;
        matchedTokens += 1;
      }
    }
    // 至少要有一個詞出現在題目本身，只靠答案或主題詞湊分不算命中
    if (!questionHit) continue;

    let questionWeight = 0;
    for (const token of entry.question) questionWeight += index.idf(token);

    const queryCoverage = gained / queryWeight;
    const questionCoverage = questionWeight ? questionHit / questionWeight : 0;
    // 只對上一個詞（例如只打「codex」「價格」）證據太少，除非題目幾乎就是這個詞，否則交給站內搜尋
    if (matchedTokens < 2 && questionCoverage < 0.6) continue;

    // 問句裡有兩個以上不同的詞段都出現在題目裡（例如「AI」＋「費用」），比只對上一個長詞
    // （例如「工程師」拆出的兩個 bigram）更可信，每多一段加一點分
    const segmentsInQuestion = querySegments.filter((segment) => [...segment].some((token) => entry.question.has(token))).length;

    let score = queryCoverage * 0.65 + questionCoverage * 0.35 + Math.max(0, segmentsInQuestion - 1) * 0.05;
    if (entry.item.b) score += asksAboutBank ? 0.12 : 0.02;
    ranked.push({ item: entry.item, score });
  }
  return ranked.sort((a, b) => b.score - a.score);
}

/**
 * 回傳最相符的 FAQ（含分數），沒有夠像的就回傳 null。
 * @param {ReturnType<typeof buildFaqIndex>} index
 * @param {string} query
 * @returns {{ item: object, score: number } | null}
 */
export function matchFaq(index, query) {
  const [best] = rankFaqs(index, query);
  return best && best.score >= MATCH_THRESHOLD ? best : null;
}
