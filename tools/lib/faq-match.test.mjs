import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFaqIndex, matchFaq, normalize, tokenize } from '../../public/faq-match.js';

// 題目取自站上實際 FAQ（題庫系統文章與其他文章各挑幾題），答案縮短成比對需要的關鍵字。
const BANK_TOPIC = '數學題庫系統介紹：考卷匯入、AI 出題、AI 詳解 客製開發 AI 導入 題庫系統';
const FIXTURE = [
  { q: '開發怎麼進行？費用怎麼算？', a: '先聊需求、試用 Demo，確認功能後報價，開發時程約兩個月。每月費用：主機每月約 500 元。', k: BANK_TOPIC, b: 1 },
  { q: 'AI 的使用費用怎麼算？', a: '系統使用 Google 的 Gemini AI，費用依實際用量計算，正式上線後一般每月大約 20～150 元。', k: BANK_TOPIC, b: 1 },
  { q: '可以先用免費額度嗎？大概能做幾題？', a: 'Google 的免費方案限制每天可以使用 AI 的次數。', k: BANK_TOPIC, b: 1 },
  { q: '匯入的題目會有版權問題嗎？', a: '要看題目從哪裡來，依著作權法第 9 條。', k: BANK_TOPIC, b: 1 },
  { q: '一次可以上傳幾份考卷？檔案有大小限制嗎？', a: '目前一次上傳一個檔案，上限 20MB。', k: BANK_TOPIC, b: 1 },
  { q: '可以自動把題目分到單元嗎？', a: '匯入考卷時，AI 會逐題建議單元、難易度和題型。', k: BANK_TOPIC, b: 1 },
  { q: '國中、高中都可以用嗎？', a: '目前內建的是高中數學單元。', k: BANK_TOPIC, b: 1 },
  { q: '除了數學以外，也有其他科目嗎？', a: '有。其他科目像是英文，或是語言家教等教學需求，都有承接。', k: BANK_TOPIC, b: 1 },
  { q: '貼進 Word 之後，公式和字體會跑掉嗎？', a: '用「複製到 Word」貼上後，公式是 Word 內建的方程式。', k: BANK_TOPIC, b: 1 },
  { q: '我習慣用 MathType，可以用嗎？', a: '可以。用「複製（MathType 用）」貼上後，公式是一段 LaTeX 文字碼。', k: BANK_TOPIC, b: 1 },
  { q: '可以直接下載成 Word 檔嗎？', a: '目前沒有直接下載 Word 檔的功能，現在的做法是按「複製到 Word」。', k: BANK_TOPIC, b: 1 },
  { q: '考卷上的圖可以改數字嗎？', a: 'AI 出的類似題裡，直角三角形可以直接改數字。', k: BANK_TOPIC, b: 1 },
  { q: '有 Demo 可以試用嗎？', a: '有，免費、不用註冊，登入頁已經預填 Demo 帳號和密碼。', k: BANK_TOPIC, b: 1 },
  { q: 'Demo 的 AI 是真的在運算嗎？', a: 'Demo 用的是模擬 AI。', k: BANK_TOPIC, b: 1 },
  { q: 'Demo 裡我建的資料，別人會看到嗎？', a: '不會。每個人看到的是自己的一份 Demo 資料。', k: BANK_TOPIC, b: 1 },
  { q: '學生上傳練習有什麼規則？', a: '一次最多 5 張照片，要填這次做了幾題。', k: BANK_TOPIC, b: 1 },
  { q: 'Threads API 的 Token 會過期嗎？', a: '長期 Token 效期 60 天。', k: 'Threads API 教學' },
  { q: 'Instagram API 申請是免費的嗎？', a: '申請不用錢。', k: 'Instagram API 教學' },
  { q: '工程師接案的作品集要放什麼？', a: '放能實際操作的 AI 作品。', k: '接案 轉職心得' },
  { q: 'Windows 一定要使用 WSL2 才能安裝 Codex 嗎？', a: '不一定，VS Code 插件就能用。', k: 'Codex WSL2 安裝教學' },
  { q: '學 AI 要先學 Python 嗎？', a: '不用，先學會跟 AI Agent 對話。', k: 'AI 入門 學習路線' },
  { q: '可以約線上教學嗎？', a: '可以，用 Google Meet 或 Discord。', k: 'AI 一對一 私人家教 教學 課程' },
];

const index = buildFaqIndex(FIXTURE);

function matchedQuestion(query) {
  return matchFaq(index, query)?.item.q ?? null;
}

test('normalize 會把全形英數轉半形並套用同義詞', () => {
  assert.equal(normalize('ＷＯＲＤ'), 'word');
  assert.equal(normalize('題庫要多少錢'), '題庫要費用');
  assert.equal(normalize('可以下載嗎'), '可以匯出嗎');
});

test('tokenize 拿掉虛詞後取 bigram，英數保留整個字並補上去掉版本號的字', () => {
  assert.deepEqual([...tokenize('MathType 可以用嗎？')], ['mathtype', '用']);
  assert.ok(tokenize('要裝 WSL2 嗎').has('wsl'));
  assert.ok(!tokenize('可以匯出嗎').has('可以'));
});

test('題庫系統的口語問法會命中對應 FAQ', () => {
  const cases = [
    ['題庫要多少錢', '開發怎麼進行？費用怎麼算？'],
    ['可以匯出Word嗎', '可以直接下載成 Word 檔嗎？'],
    ['ＭａｔｈＴｙｐｅ能用嗎', '我習慣用 MathType，可以用嗎？'],
    ['圖形能改數字嗎', '考卷上的圖可以改數字嗎？'],
    ['考卷題目有版權問題嗎', '匯入的題目會有版權問題嗎？'],
    ['可以用在英文嗎', '除了數學以外，也有其他科目嗎？'],
    ['貼到word公式會不會亂掉', '貼進 Word 之後，公式和字體會跑掉嗎？'],
    ['免費額度可以做幾題', '可以先用免費額度嗎？大概能做幾題？'],
    ['AI費用一個月多少', 'AI 的使用費用怎麼算？'],
    ['Demo資料會被別人看到嗎', 'Demo 裡我建的資料，別人會看到嗎？'],
    ['有免費試用嗎', '有 Demo 可以試用嗎？'],
    ['有demo嗎', '有 Demo 可以試用嗎？'],
    ['可以先試用看看嗎', '有 Demo 可以試用嗎？'],
    ['demo的AI是真的嗎', 'Demo 的 AI 是真的在運算嗎？'],
    ['一次能上傳幾份考卷', '一次可以上傳幾份考卷？檔案有大小限制嗎？'],
  ];
  for (const [query, expected] of cases) {
    assert.equal(matchedQuestion(query), expected, query);
  }
});

test('其他文章的 FAQ 也能命中', () => {
  assert.equal(matchedQuestion('token會過期嗎'), 'Threads API 的 Token 會過期嗎？');
  assert.equal(matchedQuestion('可以線上上課嗎'), '可以約線上教學嗎？');
  assert.equal(matchedQuestion('Windows要裝WSL嗎'), 'Windows 一定要使用 WSL2 才能安裝 Codex 嗎？');
});

test('不相關或只有單一關鍵字的問句不命中，交回站內搜尋', () => {
  for (const query of ['今天天氣如何', '推薦好吃的拉麵', '投資股票推薦', 'codex', '題庫', '價格', '你好', '', '？？？']) {
    assert.equal(matchedQuestion(query), null, query);
  }
});

test('只對上同一個長詞的不同 bigram 不算命中', () => {
  assert.equal(matchedQuestion('AI會取代工程師嗎'), null);
});
