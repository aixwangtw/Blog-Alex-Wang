import { getCollection } from 'astro:content';
import { DEVELOPMENT_SERVICE, SERVICE_SITE } from '../consts';
import { HOME_FAQS, ONE_ON_ONE_FAQS, RESOURCES_FAQS, type Faq } from '../data/faqs';

// 右下角客服的 FAQ 索引：使用者輸入問題時，前端（public/faq-match.js）拿這份比對，
// 命中就直接顯示答案原文並附上原頁連結。只在使用者點進輸入框時才下載，不增加每頁的載入成本。
// 來源與 /faq/ 頁相同：src/data/faqs.ts ＋ CMS 文章的 faqs 欄位。
//
// 欄位刻意縮短：q 題目、a 答案原文（純文字，前端一律用 textContent 顯示）、
// u 連結（含錨點與文字片段）、p 出處頁名稱、k 主題詞（文章標題與標籤，比對時加分用）、
// b 題庫系統文章的題目（比對時優先）。
interface FaqIndexItem {
  q: string;
  a: string;
  u: string;
  p: string;
  k: string;
  b?: 1;
}

// Text Fragment（#:~:text=）讓瀏覽器直接捲到那一題；不支援的瀏覽器會退回前面的 #faq 區塊錨點。
// encodeURIComponent 不會編碼「-」，但它在文字片段語法裡有特殊意義，要另外轉成 %2D。
function textFragment(text: string): string {
  return `:~:text=${encodeURIComponent(text).replace(/-/g, '%2D')}`;
}

export async function GET() {
  const posts = (await getCollection('blog', ({ data }) => !data.unlisted))
    .filter((post) => post.data.faqs.length > 0)
    // 題庫系統文章排最前面：題目重複時以它為準，分數相同時也優先命中
    .sort((a, b) => {
      const aIsBank = `/blog/${a.id}/` === DEVELOPMENT_SERVICE.caseArticle ? 0 : 1;
      const bIsBank = `/blog/${b.id}/` === DEVELOPMENT_SERVICE.caseArticle ? 0 : 1;
      return aIsBank - bIsBank || b.data.pubDate.valueOf() - a.data.pubDate.valueOf();
    });

  const items: FaqIndexItem[] = [];
  const seenQuestions = new Set<string>();

  function add(faqs: Faq[], toItem: (faq: Faq) => FaqIndexItem): void {
    for (const faq of faqs) {
      if (seenQuestions.has(faq.question)) continue;
      seenQuestions.add(faq.question);
      items.push(toItem(faq));
    }
  }

  for (const post of posts) {
    const url = `/blog/${post.id}/`;
    const isBank = url === DEVELOPMENT_SERVICE.caseArticle;
    add(post.data.faqs, (faq) => ({
      q: faq.question,
      a: faq.answer,
      // 文章頁的 FAQ 區塊固定是 <section id="faq">（src/pages/blog/[...id].astro）
      u: `${url}#faq${textFragment(faq.question)}`,
      p: post.data.title,
      k: [post.data.title, ...post.data.tags].join(' '),
      ...(isBank ? { b: 1 as const } : {}),
    }));
  }

  add(RESOURCES_FAQS, (faq) => ({
    q: faq.question,
    a: faq.answer,
    u: `/resources/#${textFragment(faq.question)}`,
    p: '免費資源專區',
    k: '免費資源 Codex Skills grill-me 自學',
  }));

  add(HOME_FAQS, (faq) => ({
    q: faq.question,
    a: faq.answer,
    u: `/faq/#${textFragment(faq.question)}`,
    p: '常見問題總整理',
    k: 'AI 一對一 私人家教 教學 課程 演講 開發',
  }));

  // 一對一教學頁在服務子網域，與首頁重複的題目已由上面的 /faq/ 收錄
  add(ONE_ON_ONE_FAQS, (faq) => ({
    q: faq.question,
    a: faq.answer,
    u: `${SERVICE_SITE.url}/course/#faq${textFragment(faq.question)}`,
    p: '一對一 AI 私人教學',
    k: 'AI 一對一 私人家教 教學 課程 上課',
  }));

  return new Response(JSON.stringify(items), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
