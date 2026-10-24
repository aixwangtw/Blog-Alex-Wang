import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { DEVELOPMENT_SERVICE, SITE } from '../consts';
import { llmsServiceLinks, whoIsAlexMarkdown } from '../lib/agent-docs';

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

> ${SITE.description}

${whoIsAlexMarkdown()}

## 服務與免費資源（各頁附 Markdown 版）

${llmsServiceLinks()}
- [關於 Alex](${SITE.url}/about/)：系統開發工程師、21 萬人 OpenClaw 中文社群版主、HyperFrames 開源專案協作者。
- 完整純文字（服務、教學、演講、免費資源、FAQ）：${SITE.url}/llms-full.txt

## 部落格文章：系統開發案例

${developmentArticleList}

## 部落格文章：教學與個人經歷（次要）

${secondaryArticleList}

## 常見問題

- 客製系統開發常見問題：${DEVELOPMENT_SERVICE.url}#development-faq（費用、Demo、功能、修改、原始碼、維護、案例；題目與答案取自〈系統開發、AI 導入費用怎麼算？〉文章）
- 常見問題總整理：${SITE.url}/faq/（系統開發與題庫系統的問題排最前面，免費資源的問題在後面）
- 題庫系統文章內的完整 FAQ：${SITE.url}/blog/math-teacher-question-bank/#faq

## 政策頁面

- 編輯政策：${SITE.url}/editorial-policy/（內容本人實測、人工審稿，AI 僅作排版/封面圖/關鍵字/FAQ 整理輔助）
- 隱私權政策：${SITE.url}/privacy/
- 免責聲明：${SITE.url}/disclaimer/
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
