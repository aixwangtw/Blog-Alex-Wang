import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { AUTHOR, LINKS, SITE } from '../consts';

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

  const articleList = posts
    .map(
      (post) =>
        `- [${post.data.title}](${SITE.url}/blog/${post.id}/)：${post.data.description}`,
    )
    .join('\n');

  const body = `# AI新手教學（AI Beginner Blog）

> Alex 是台灣的 AI 應用講師與全職接案工程師。教 AI Agent 工具使用（Claude Code、Codex）、做自動發文（Meta API）、AI 生圖模板（Tooka）、對話式拍片（HyperFrames）——把工作流程簡化成對話就能完成。提供付費一對一私人教學（台北／新北實體課或 Google Meet／Discord 線上課）與企業、學校、社群的 AI 主題演講。

## 服務

- [AI 一對一私人教學](${SITE.url}/services/ai-tutor/)：手把手帶零基礎學員完成桌面版 AI Agent 安裝、Meta API 串接與自動發文系統，雙北實體或線上皆可。
- [AI 演講與企業內訓](${SITE.url}/services/speaking/)：AI Agent 入門、社群自動化、AI 一鍵拍片、AI 工作流設計等主題，曾受 MixerBox、TAIA 台灣人工智慧協會邀請演講。
- [關於講師 Alex](${SITE.url}/about/)：21 萬人 OpenClaw 中文社群版主、HyperFrames 開源專案協作者。

## 免費資源

- [免費資源](${SITE.url}/resources/)：教學影片（Threads API 申請、Instagram API 申請）與開源工具 Tooka（社群圖卡模板＋一鍵發布 Meta 三大平台），全部不用付費就能用。2026-08 從文章改成常設頁面，舊網址 /blog/free-resources/ 已 301 轉址至此。

## 部落格文章

${articleList}

## 開源專案

- [Tooka 線上版](https://tooka.js0980420.workers.dev/)：免安裝、免 clone repo，可直接在瀏覽器使用 Tooka 製作社群圖文。
- [Tooka](https://github.com/js0980420/tooka)：Alex 開發的開源社群圖文模板框架——AI Agent 用程式渲染生成 1080×1350 的 IG 輪播圖文，不跑版、不失真，可一鍵發佈到 Instagram、Facebook、Threads。

## 常見問題

- 常見問題總整理：${SITE.url}/faq/（大多整理自 Threads 與 YouTube 的真實社群提問）

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
