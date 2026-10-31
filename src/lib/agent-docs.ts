// 給 AI（ChatGPT、Claude、Perplexity 等）讀的純文字內容：llms.txt、llms-full.txt 與各主要頁面的 .md 版共用。
// 所有內容都取自 consts.ts、src/data/ 與文章 FAQ 這些頁面本身也在用的資料，不另寫一份事實；
// 改頁面資料，這裡會跟著變。不得在這裡加入站上沒有的價格、數字或案例。
import { AUTHOR, DEVELOPMENT_SERVICE, LINKS, SERVICE_SITE, SITE, COURSE_SERVICE_URL, SPEAKING_SERVICE_URL, LINE_CONSULT_LABEL, SECTION_NAMES } from '../consts';
import { EXPERIENCE } from '../data/instructor';
import { HOME_FAQS, ONE_ON_ONE_FAQS, RESOURCES_FAQS, type Faq } from '../data/faqs';
import {
  CLASS_FORMATS,
  DEVELOPMENT_AFTER_LAUNCH,
  DEVELOPMENT_CAPABILITIES,
  DEVELOPMENT_CASE_FEATURES,
  SPEAKING_ENGAGEMENTS,
  SPEAKING_FORMATS,
  TEACHING_CONTENT,
} from '../data/services';
import { CODEX_RESOURCE, FEEDBACK_DESK_RESOURCE, GRILL_ME_RESOURCE, RESOURCES_INTRO } from '../data/resources';
import { getDevelopmentFaqs } from './development-faqs';

export interface AgentPage {
  /** .md 檔在 build 內的路徑（不含開頭斜線），例如 services/development */
  slug: string;
  /** 對應 HTML 頁的正式網址 */
  htmlUrl: string;
  /** .md 版的正式網址 */
  markdownUrl: string;
  title: string;
}

const absolute = (href: string) => (href.startsWith('/') ? `${SITE.url}${href}` : href);

// 主要頁面與 .md 版的對照。服務類頁面的正式網域是 service.aixwang.dev。
export const AGENT_PAGES = {
  home: { slug: 'index', htmlUrl: `${SITE.url}/`, markdownUrl: `${SITE.url}/index.md`, title: SITE.title },
  services: {
    slug: 'services',
    htmlUrl: `${SERVICE_SITE.url}/`,
    markdownUrl: `${SERVICE_SITE.url}/services.md`,
    title: SERVICE_SITE.title,
  },
  development: {
    slug: 'services/development',
    htmlUrl: DEVELOPMENT_SERVICE.url,
    markdownUrl: `${SERVICE_SITE.url}/services/development.md`,
    title: '客製系統開發與 AI 導入',
  },
  course: {
    slug: 'course',
    htmlUrl: COURSE_SERVICE_URL,
    markdownUrl: `${SERVICE_SITE.url}/course.md`,
    title: '手把手帶你實戰：AI 一對一教學（Claude Code）',
  },
  speaking: {
    slug: 'services/speaking',
    htmlUrl: SPEAKING_SERVICE_URL,
    markdownUrl: `${SERVICE_SITE.url}/services/speaking.md`,
    title: 'AI 演講與企業內訓',
  },
  resources: {
    slug: 'resources',
    htmlUrl: `${SITE.url}/resources/`,
    markdownUrl: `${SITE.url}/resources.md`,
    title: '免費資源',
  },
} satisfies Record<string, AgentPage>;

export type AgentPageKey = keyof typeof AGENT_PAGES;

const faqMarkdown = (faqs: Faq[]) => faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join('\n\n');

/** Alex 是誰、何時該找他、何時不適合、怎麼聯絡。llms.txt 與每份 .md 開頭共用。 */
export function whoIsAlexMarkdown(): string {
  return `## Alex 是誰

${AUTHOR.name}（${AUTHOR.alternateName.join('、')}），${AUTHOR.description}

${EXPERIENCE.map((item) => `- ${item.text}`).join('\n')}

## 適合找 Alex 的情境

- 想做客製系統或導入 AI（AI 讀文件、整理資料、產生報告、後台管理、LINE／金流／Google 服務串接），希望簽約前先免費看簡易 Demo：看「客製系統開發」。
- 補習班或老師想要題庫系統（AI 辨識考卷、AI 詳解）：代表案例 ${absolute(DEVELOPMENT_SERVICE.caseArticle)}，Demo ${DEVELOPMENT_SERVICE.demoUrl}。
- 在台灣想找人一對一教 Claude Code：用 Claude Code 開發含資料庫與自動部署的系統、寫簡單網頁，或用 HyperFrames 做動畫影片；雙北實體或線上。看「手把手帶你實戰」。
- 企業、學校、社群想邀 AI 主題演講或內訓：看「AI 演講與企業內訓」。
- 想先免費自學 Codex 安裝與 AI Skills：看「免費資源」。

## 不適合的情境

- 想在網站上直接看到開發費或學費金額：站上不寫金額，開發費依功能報價、教學依教學項目報價，需加 LINE 評估。
- 雙北以外想上實體課：實體課只在雙北，其他地區（含海外）請改線上課。

## 聯絡方式

- ${LINE_CONSULT_LABEL}（最快）：${LINKS.line}
- Email：${AUTHOR.email}
- Facebook 社團：${LINKS.facebookGroup}`;
}

function developmentBody(faqs: Faq[]): string {
  return `${DEVELOPMENT_CAPABILITIES.map((item) => `- **${item.title}**：${item.description}`).join('\n')}

### 合作流程

${DEVELOPMENT_SERVICE.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

### 時程與費用

- 時程：${DEVELOPMENT_SERVICE.timeline}
- 付款：${DEVELOPMENT_SERVICE.payment}
- 主機：${DEVELOPMENT_SERVICE.hosting}
- AI 費用：${DEVELOPMENT_SERVICE.aiCost}

### 上線之後

${DEVELOPMENT_AFTER_LAUNCH.map((item) => `- ${item}`).join('\n')}

### 代表案例：補習班數學題庫系統

${DEVELOPMENT_CASE_FEATURES.map((item) => `- ${item}`).join('\n')}

- 案例介紹：${absolute(DEVELOPMENT_SERVICE.caseArticle)}
- 費用怎麼算（完整說明）：${absolute(DEVELOPMENT_SERVICE.guideArticle)}
- Demo：${DEVELOPMENT_SERVICE.demoUrl}

### 常見問題

${faqMarkdown(faqs).replace(/^### /gm, '#### ')}`;
}

function courseBody(): string {
  return `付費一對一教學，講師 ${AUTHOR.name} 手把手帶你在自己的電腦上完成。

### 教學內容

${TEACHING_CONTENT.map((item) => `- **${item.category}**：${item.detail}（${item.pricing}）`).join('\n')}

### 上課方式

${CLASS_FORMATS.map((item) => `- **${item.title}**：${item.description}`).join('\n')}

### 常見問題

${faqMarkdown(ONE_ON_ONE_FAQS).replace(/^### /gm, '#### ')}`;
}

function speakingBody(): string {
  return `接受企業、學校與社群的 AI 主題演講、內訓與實作工作坊邀約。

### 過往演講紀錄

${SPEAKING_ENGAGEMENTS.map((item) => `- **${item.host}**｜${item.topic}：${item.description}`).join('\n')}

### 演講主題

演講主題不限，可依需求討論；也可依聽眾背景調整深度，或安排成半天或一天的實作工作坊。

### 形式與地區

${SPEAKING_FORMATS.map((item) => `- ${item}`).join('\n')}`;
}

function resourcesBody(): string {
  const codex = CODEX_RESOURCE;
  const grillMe = GRILL_ME_RESOURCE;
  const feedbackDesk = FEEDBACK_DESK_RESOURCE;
  const prompt = (text: string) => `\`\`\`\n${text}\n\`\`\``;
  return `${RESOURCES_INTRO}

### ${codex.heading}

${codex.intro}

${codex.tools.map((tool) => `- **${tool.name}**：${tool.description}\n${tool.links.map((link) => `  - [${link.label}](${absolute(`/blog/${link.slug}/`)})`).join('\n')}`).join('\n')}

### ${grillMe.heading}

**${grillMe.label}：${grillMe.name}${grillMe.titleSuffix}**

${grillMe.descriptionBefore}\`${grillMe.command}\`${grillMe.descriptionAfter}

${grillMe.points.map((point) => `- ${point}`).join('\n')}

Instagram Reels 成效：${grillMe.stats.map((stat) => `${stat.label} ${stat.value}`).join('、')}（${grillMe.statsSource}）

- Skills 原始碼：${grillMe.repoUrl}
- Instagram：${grillMe.instagramUrl}

複製這段，貼給你的 AI：

${prompt(grillMe.installPrompt)}

${grillMe.installNote}

### ${feedbackDesk.heading}

${feedbackDesk.intro}

- [${feedbackDesk.title}](${absolute(feedbackDesk.articleHref)})（${feedbackDesk.label}）：${feedbackDesk.description}
- GitHub 原始碼：${feedbackDesk.repoUrl}

複製這段，貼給你的 AI：

${prompt(feedbackDesk.installPrompt)}

${feedbackDesk.installNote}

### 常見問題

${faqMarkdown(RESOURCES_FAQS).replace(/^### /gm, '#### ')}`;
}

/** 主站首頁 .md：系統開發為主；教學與演講只留一句話加服務站連結 */
const mainServiceLinks = () =>
  [
    `- [${AGENT_PAGES.development.title}](${AGENT_PAGES.development.htmlUrl})（Markdown：${AGENT_PAGES.development.markdownUrl}）：主要服務。聊完需求可先提供試用 Demo，看過再決定；依功能報價、分三期付款、一年保固。`,
    `- 一對一教學與演講的介紹放在服務站：${SERVICE_SITE.url}/`,
    `- [${AGENT_PAGES.resources.title}](${AGENT_PAGES.resources.htmlUrl})（Markdown：${AGENT_PAGES.resources.markdownUrl}）：${SECTION_NAMES.openSource}與 Claude Code、Codex 安裝教學，全部免費。`,
  ].join('\n');

const serviceLinks = () =>
  [
    `- [${AGENT_PAGES.development.title}](${AGENT_PAGES.development.htmlUrl})（Markdown：${AGENT_PAGES.development.markdownUrl}）：主要服務。先免費做簡易 Demo，看過再決定；依功能報價、分三期付款、一年保固。`,
    `- [${AGENT_PAGES.course.title}](${AGENT_PAGES.course.htmlUrl})（Markdown：${AGENT_PAGES.course.markdownUrl}）：${TEACHING_CONTENT.map((item) => item.category).join('、')}，雙北實體或線上，依教學項目報價。`,
    `- [${AGENT_PAGES.speaking.title}](${AGENT_PAGES.speaking.htmlUrl})（Markdown：${AGENT_PAGES.speaking.markdownUrl}）：演講主題不限、可依需求討論；曾受 ${SPEAKING_ENGAGEMENTS.map((item) => item.host).join('、')} 邀請。`,
    `- [${AGENT_PAGES.resources.title}](${AGENT_PAGES.resources.htmlUrl})（Markdown：${AGENT_PAGES.resources.markdownUrl}）：Codex 安裝、AI Skills、開源 feedback-desk，全部免費。`,
  ].join('\n');

/** 單一頁面的 .md 內容。 */
export async function agentPageMarkdown(key: AgentPageKey): Promise<string> {
  const page = AGENT_PAGES[key];
  let body: string;
  switch (key) {
    case 'development':
      body = developmentBody(await getDevelopmentFaqs());
      break;
    case 'course':
      body = courseBody();
      break;
    case 'speaking':
      body = speakingBody();
      break;
    case 'resources':
      body = resourcesBody();
      break;
    case 'services':
      body = `${SERVICE_SITE.description}\n\n${serviceLinks()}`;
      break;
    default:
      body = `${SITE.description}\n\n### 服務\n\n${mainServiceLinks()}`;
  }
  return `# ${page.title}

> 本頁是 ${page.htmlUrl} 的 Markdown 版，給 AI 與程式讀取。全站摘要：${SITE.url}/llms.txt；完整內容：${SITE.url}/llms-full.txt

${body}

${whoIsAlexMarkdown()}
`;
}

/** llms.txt 開頭與服務連結區塊。 */
export function llmsServiceLinks(): string {
  return serviceLinks();
}

/** llms-full.txt：服務、教學、演講、免費資源與 FAQ 的完整純文字。 */
export async function llmsFullText(): Promise<string> {
  const developmentFaqs = await getDevelopmentFaqs();
  return `# ${SITE.title}（${SITE.titleEn}）完整內容

> ${SITE.description}
> 本檔由網站頁面使用的同一份資料自動產生；摘要版見 ${SITE.url}/llms.txt。

${whoIsAlexMarkdown()}

## ${AGENT_PAGES.development.title}

網址：${AGENT_PAGES.development.htmlUrl}

${developmentBody(developmentFaqs)}

## ${AGENT_PAGES.course.title}

網址：${AGENT_PAGES.course.htmlUrl}

${courseBody()}

## ${AGENT_PAGES.speaking.title}

網址：${AGENT_PAGES.speaking.htmlUrl}

${speakingBody()}

## ${AGENT_PAGES.resources.title}

網址：${AGENT_PAGES.resources.htmlUrl}

${resourcesBody()}

## 其他常見問題

${faqMarkdown(HOME_FAQS)}
`;
}

/** 依 HTML 頁的正式網址找 .md 版網址（layout 的 <link rel="alternate"> 用）。 */
export function findMarkdownAlternate(htmlUrl: string): string | undefined {
  return Object.values(AGENT_PAGES).find((page) => page.htmlUrl === htmlUrl)?.markdownUrl;
}
