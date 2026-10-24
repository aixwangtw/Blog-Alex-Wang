import { getCollection } from 'astro:content';
import type { Faq } from '../data/faqs';

// 系統開發常見問題：題目與答案一字不改，取自〈系統開發、AI 導入費用怎麼算？〉文章的 7 題 FAQ。
// 只讀這篇（通用版），題庫專屬問題連到題庫文章，避免同一個 FAQPage 出現重複題目。
// 找不到就中斷建置，避免文章 FAQ 改題後這裡悄悄變成空的或漂移。
// 服務頁、.md 版與 llms-full.txt 共用。
export const DEVELOPMENT_FAQ_QUESTIONS = [
  '系統開發的費用怎麼算？可以分期嗎？',
  '簽約前能先看到 Demo 嗎？要收費嗎？',
  '包含哪些功能？可以加 AI 嗎？',
  '做的過程中能不能隨時修改？',
  '資料和原始碼歸誰？可以簽保密協議嗎？',
  '保固結束後誰來維護？',
  '做過什麼案子？',
];

export async function getDevelopmentFaqs(): Promise<Faq[]> {
  const posts = await getCollection('blog');
  const guideArticle = posts.find((post) => post.id === 'custom-system-development-demo');
  return DEVELOPMENT_FAQ_QUESTIONS.map((question) => {
    const faq = guideArticle?.data.faqs.find((item) => item.question === question);
    if (!faq) {
      throw new Error(`系統開發文章找不到 FAQ「${question}」，請更新 src/lib/development-faqs.ts 的題目清單`);
    }
    return faq;
  });
}
