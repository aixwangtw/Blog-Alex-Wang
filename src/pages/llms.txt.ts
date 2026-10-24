import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { AUTHOR, LINKS, SERVICE_SITE, SITE } from '../consts';

// llms.txt：給 AI 搜尋（ChatGPT、Perplexity、Claude 等）讀的網站摘要。
// 文章清單從 Directus collection 自動生成，發布新文章後重新建置即更新，
// 不會再出現遺漏或已轉址的舊網址。
export const prerender = true;

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.unlisted)).sort(
    (a, b) =>
      b.data.pubDate.valueOf() - a.data.pubDate.valueOf() ||
      (b.data.cmsId ?? 0) - (a.data.cmsId ?? 0),
  );

  // 系統開發案例（題庫系統、客製開發、AI 導入）排前面；其餘是教學或個人經歷類，標成次要
  const isDevelopmentCase = (tags: readonly string[]) =>
    ['題庫系統', '客製開發', 'AI 導入'].some((tag) => tags.includes(tag));
  const toLine = (post: (typeof posts)[number]) =>
    `- [${post.data.title}](${SITE.url}/blog/${post.id}/)：${post.data.description}`;
  const developmentArticleList = posts.filter((post) => isDevelopmentCase(post.data.tags)).map(toLine).join('\n');
  const secondaryArticleList = posts.filter((post) => !isDevelopmentCase(post.data.tags)).map(toLine).join('\n');

  const body = `# Aix 系統開發（Aix System Development，舊名 AI新手教學）

> Alex 是台灣的系統開發工程師，目前全職接案，和開發夥伴承接客製系統開發（代表案例：補習班數學題庫系統）。另提供 AI 教學與演講：對話式拍片（HyperFrames）一對一私人教學，以及企業、學校、社群的 AI 主題演講。

## 服務

- [客製系統開發](${SERVICE_SITE.url}/services/development/)：Alex 和開發夥伴承接客製系統開發，用 AI 自動化整理資料、產出內容；代表案例是補習班數學老師用的題庫系統（AI 辨識考卷、AI 詳解；AI 出題可在 Demo 體驗，正式導入時依需求開發），案例介紹見 ${SITE.url}/blog/math-teacher-question-bank/。
- [手把手帶你實戰：AI 一對一教學，系統開發、網頁、動畫影片（次要服務）](${SERVICE_SITE.url}/course/)：三個方案：用 Claude Code 開發含資料庫與自動部署的系統、寫簡單網頁、做動畫影片，依教學項目報價，雙北實體或線上皆可。
- [AI 演講與企業內訓（次要服務）](${SERVICE_SITE.url}/services/speaking/)：AI 一鍵拍片（跟 AI 對話就能完成影片），曾受 TAIA 台灣人工智慧協會邀請演講。
- [關於 Alex](${SITE.url}/about/)：系統開發工程師、21 萬人 OpenClaw 中文社群版主、HyperFrames 開源專案協作者。

## 免費資源（教學類）

- [免費資源](${SITE.url}/resources/)：教學影片（Threads API 申請、Instagram API 申請），全部不用付費就能用。2026-08 從文章改成常設頁面，舊網址 /blog/free-resources/ 已 301 轉址至此。

## 部落格文章：系統開發案例

${developmentArticleList}

## 部落格文章：教學與個人經歷（次要）

${secondaryArticleList}

## 常見問題

- 客製系統開發常見問題：${SERVICE_SITE.url}/services/development/#development-faq（開發流程、費用、AI 使用成本、Demo；題目與答案取自題庫系統文章）
- 常見問題總整理：${SITE.url}/faq/（系統開發與題庫系統的問題排最前面，免費資源的問題在後面）
- 題庫系統文章內的完整 FAQ：${SITE.url}/blog/math-teacher-question-bank/#faq

## 政策頁面

- 編輯政策：${SITE.url}/editorial-policy/（內容本人實測、人工審稿，AI 僅作排版/封面圖/關鍵字/FAQ 整理輔助）
- 隱私權政策：${SITE.url}/privacy/
- 免責聲明：${SITE.url}/disclaimer/

## 聯絡方式

- LINE 免費諮詢：${LINKS.line}
- Email：${AUTHOR.email}
- Facebook 社團：https://www.facebook.com/groups/3238547836318385
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
