// 全站共用的品牌與聯絡資訊：改這裡就能同步更新所有頁面與 JSON-LD
/** 案例區介紹句：案例以外的系統也接。頁面用 <CasesBeyondNote />（strong 段加粗），純文字處用 .text */
export const CASES_BEYOND_NOTE = {
  lead: '案例以外的系統也可以做，聊完需求一樣可以先',
  strong: '提供試用 Demo',
  tail: '。',
  text: '案例以外的系統也可以做，聊完需求一樣可以先提供試用 Demo。',
} as const;

/** 首屏「聊聊需求」按鈕下方說明（與首屏介紹句不重複） */
export const HERO_CTA_NOTE = '說說你想做的系統，我們先做 Demo 給你試用。';

/** 首屏介紹句（主站首頁與服務站首頁共用的類別卡區）：strong 段加粗；分期文字另引用 PAYMENT_TERMS */
export const HERO_INTRO = {
  lead: '客製化系統開發，需求可以隨調隨改。',
  demoStrong: '每一類都可以提供試用 Demo',
  demoTail: '，站上還沒有的類型，聊過需求後提供。',
} as const;

export const SITE = {
  title: 'Aix 系統開發',
  titleEn: 'Aix System Development',
  // 舊站名只留在 llms.txt 的說明；結構化資料的 alternateName 不再帶舊名，免得訊號停在「AI 教學」
  formerNames: ['AI新手教學', 'AI Beginner Blog'],
  url: 'https://aixwang.dev',
  description:
    'Alex 是台灣的系統開發工程師，目前全職接案，和開發夥伴承接客製系統開發與 AI 導入，代表案例是補習班數學老師用的題庫系統。一對一教學與演講的介紹在服務站 service.aixwang.dev。',
  // 頁尾顯示用：不帶「另提供 AI 教學與演講」，結構化資料仍用上面的 description
  footerDescription: 'Alex 是台灣的系統開發工程師，目前全職接案，和開發夥伴承接客製系統開發與 AI 導入，代表案例是補習班數學老師用的題庫系統。',
  locale: 'zh-TW',
};

// 服務內容獨立成子網域；主站專注文章與免費資源，
// 課程、演講與預約轉換統一放在服務站。
export const SERVICE_SITE = {
  title: 'Aix 系統開發服務',
  url: 'https://service.aixwang.dev',
  description:
    '我和開發夥伴承接客製系統開發與 AI 導入，談需求時先免費做簡易 Demo，看過再決定要不要簽約；代表案例是數學題庫系統。另提供 AI 一對一教學，手把手帶你用 Claude Code 做出系統、網頁或動畫影片。',
};

// 系統開發服務頁與首頁共用的事實（流程、時程、付款、主機），內容取自
// 〈系統開發、AI 導入費用怎麼算？〉文章（guideArticle），且不得與題庫文章 FAQ 矛盾；不得寫開發費金額。
/** 系統開發付款條件（服務頁、描述、結構化資料、.md 共用）。CMS 文章內文無法引用，改動時要手動同步（清單見 AGENTS.md） */
export const PAYMENT_TERMS = {
  maxInstallments: 36,
  interestFree: true,
  text: '可分期，最多 36 期，零利率',
} as const;

export const DEVELOPMENT_SERVICE = {
  url: `${SERVICE_SITE.url}/services/development/`,
  caseArticle: '/blog/math-teacher-question-bank/',
  guideArticle: '/blog/custom-system-development-demo/',
  /** Demo 站根網址（未登入會自動轉登入頁） */
  demoUrl: 'https://demo-question.aixwang.dev',
  steps: ['先聊需求', '免費做簡易 Demo，看過再決定', 'Demo 符合需求後，談預算、時程、報價與簽約', '分階段開發，隨調隨改', '上線並教你怎麼用，一年保固', '保固結束後可簽維護合約'],
  timeline: '時程依功能多寡估算：以技術上來說，大約兩個月可以完成 5 個左右的複雜功能，我們做過的功能會更快；開發過程中需求原則上可以隨時調整。',
  payment: `開發費依功能報價，加 LINE 可以免費評估；${PAYMENT_TERMS.text}。`,
  hosting: '主機用 Google Cloud（GCP），帳號用你的名義申請，沒用過 GCP 會幫你申請 90 天免費試用（Google 提供 300 美元試用額度）。主機建置約新台幣 5,000 元，只收一次；試用結束、升級成付費帳戶後，基本規格每月約 500 元，規格越高費用越高，費用由你的帳號直接付給 Google。',
  aiCost: 'AI 費用依實際用量計算，評估時一起估算。',
};

// 服務頁網址與共用按鈕文字：頁首、頁尾、分流卡、客服索引、AI 文件都引用這裡，改這裡全站同步
/** CRM 客戶管理系統 Demo 站 */
export const CRM_DEMO_URL = 'https://demo-crm.aixwang.dev';
/** 所有 Demo 站網域（GA demo_click 判斷用，新增 Demo 站要加進來） */
export const DEMO_HOSTNAMES = [new URL(DEVELOPMENT_SERVICE.demoUrl).hostname, new URL(CRM_DEMO_URL).hostname];

export const COURSE_SERVICE_URL = `${SERVICE_SITE.url}/course/`;
export const SPEAKING_SERVICE_URL = `${SERVICE_SITE.url}/services/speaking/`;
export const LINE_CONSULT_LABEL = 'LINE 免費諮詢';
/** 網址加頁內錨點，例如 withAnchor(COURSE_SERVICE_URL, 'faq') → …/course/#faq */
export const withAnchor = (url: string, anchor: string) => `${url}#${anchor}`;
/** 只取路徑（服務站自己頁面內的相對連結用），例如 servicePath(COURSE_SERVICE_URL) → /course/ */
export const servicePath = (url: string) => new URL(url).pathname;

export const AUTHOR = {
  id: `${SITE.url}/about#person`,
  name: 'Alex',
  // 別名：讓 Google 知識圖譜與 AI 搜尋把不同稱呼認成同一個人
  alternateName: ['王士麟', 'Alex Wang', '艾克斯王', 'aixwang'],
  jobTitle: '系統開發工程師',
  description:
    '系統開發工程師，目前全職接案，有一群開發團隊，承接客製系統開發，用 AI 自動化整理資料、產出內容，代表案例是補習班數學題庫系統。',
  // 技能以站上已有的事實為準：題庫系統、CRM／後台、Line LIFF、AI 客服見 instructor.ts 與轉職文，
  // Laravel 見轉職文 FAQ（技術棧）與題庫系統本身；對話式拍片、HyperFrames 是教學主題，放最後。
  knowsAbout: [
    '客製系統開發',
    'AI 導入',
    'API 串接',
    '後台管理系統',
    'Laravel',
    'LINE LIFF 網頁',
    'AI 自動化',
    '題庫系統',
    'CRM 客戶管理系統',
    'AI 客服',
    '對話式拍片',
    'HyperFrames',
  ],
  email: 'js0980420@gmail.com',
};

// 關於頁「專長領域」顯示用：系統開發相關專長合併成一條（結構化資料 knowsAbout 仍分開列給搜尋引擎）
export const ABOUT_SKILLS: { title: string; text: string }[] = [
  {
    title: '客製系統開發',
    text: '後台管理系統、LINE LIFF 網頁、CRM 客戶管理系統、題庫系統、社群平台與 AI 自動化。',
  },
];

// 「關於作者」與文末 CTA 文案輪替：8 篇文章結尾一字不差的同一段模板，
// 連讀兩篇就會有「機器複製感」（2026-07-28 稽核結論）。改成依文章 slug
// 雜湊固定選版：同一篇永遠同一版（對讀者與搜尋引擎穩定），不同篇之間輪替。
// 內容都是同一組真實事實的不同說法，不得加入新的宣稱。
export const AUTHOR_INTROS = [
  '全職接案工程師，承接客製系統開發，目標是把工作流程簡化成用說的就能完成。',
  '接案工程師，和開發夥伴承接客製系統開發，重點是把繁瑣的流程變成用說的就能完成。',
  '接案工程師，平常幫客戶把重複的工作變成自動化流程，也在 21 萬人的 OpenClaw 中文社群當版主。部落格寫的都是自己每天在用的做法。',
];

// 文章頁「關於作者」依文章性質（tags）選版本，比照 CTA_RULES：由上往下比對、第一條命中就用；
// 沒命中的文章維持 AUTHOR_INTROS 雜湊輪替。
// 2026-10-13 網站重心改為客製系統開發：安裝教學、講師故事（轉職文）也改用系統開發版介紹，
// 目前只有 Codex 安裝教學上下篇與轉職文命中這兩個 tag。
// 只影響文章頁；/about/、首頁、服務頁的介紹不走這裡。
export const AUTHOR_INTRO_RULES: { tags: string[]; intro: string }[] = [
  {
    tags: ['題庫系統', '客製開發', 'AI 導入', '安裝教學', '講師故事'],
    intro:
      '系統開發工程師，目前全職接案，有一群開發團隊，平常幫客戶把重複的工作變成自動化流程。官方 LINE 除了我本人，夥伴們也會協助回覆。',
  },
];

export function pickAuthorIntro(slug: string, tags: readonly string[]): string {
  const rule = AUTHOR_INTRO_RULES.find((candidate) => candidate.tags.some((tag) => tags.includes(tag)));
  return rule ? rule.intro : AUTHOR_INTROS[pickVariant(slug, AUTHOR_INTROS.length)];
}

export const CTA_VARIANTS = [
  {
    title: '想把重複的工作交給系統？',
    text: '我和開發夥伴承接客製系統開發，可以先看題庫系統的案例；想聊你的需求時，再從右下角官方 LINE 找我。',
  },
  {
    title: '想找人幫你安裝、串接？',
    text: '安裝、串接這類事可以交給我和開發夥伴處理，需求確認後一路做到系統上線；先看題庫系統的案例，覺得適合再用右下角官方 LINE 聯絡。',
  },
  {
    title: '想先看看能怎麼自動化？',
    text: '想自動化的工作可以先看題庫系統的案例；覺得適合，點右下角官方 LINE 跟我聊聊你手上的資料與需求。',
  },
];

// LINE 網址集中在這裡。全部是同一個官方帳號（@438efvtl），用 LINE 後台的追蹤連結區分加好友來源：
// lin.ee/raoKSVR＝官網（本站）。另外兩條不給本站用：lin.ee/Ufu9moC 是 Threads 專用、
// lin.ee/oQbiBje 是題庫 Demo 站專用。
// blog＝全站共用入口（浮動按鈕、預設 CTA、學習入口）；questionBank＝題庫／客製開發類文章的頁尾 CTA。
// 兩者目前同一條，分開保留是為了之後要再細分來源時只改這裡。
// 文章內文（Directus）裡的連結不吃這個常數，要另外改。
export const LINE_URLS = {
  blog: 'https://lin.ee/raoKSVR',
  questionBank: 'https://lin.ee/raoKSVR',
} as const;

// 依文章性質（tags）決定文末 CTA。命中規則的文章用規則指定的 CTA，
// 沒命中的維持原本的 CTA_VARIANTS 雜湊輪替，行為與加規則前完全相同。
// 規則由上往下比對，第一條命中就用；比對的是 Directus 文章的 tags 欄位（完全相符）。
export interface ArticleCta {
  title: string;
  text: string;
  href?: string;
  label?: string;
  links?: { href: string; label: string; external?: boolean }[];
}

export const CTA_RULES: { tags: string[]; cta: ArticleCta }[] = [
  {
    tags: ['題庫系統'],
    cta: {
      title: '想做一套自己的題庫？',
      text: '看系統開發服務的合作流程與費用怎麼算，也可以先試用題庫系統的 Demo。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [{ href: DEVELOPMENT_SERVICE.demoUrl, label: '試用題庫系統 Demo', external: true }],
    },
  },
  // 只有〈系統開發、AI 導入費用怎麼算？〉帶「系統開發」tag。內文已講完流程與費用、最後一段也連了題庫介紹與 Demo，
  // 文末不再叫讀者去看流程費用或題庫介紹，只留服務頁入口與 LINE。
  {
    tags: ['系統開發'],
    cta: {
      title: '想聊你的需求嗎？',
      text: '加 LINE 可以免費評估，有需求再從右下角官方 LINE 說明；服務頁整理了可以做的系統與做過的案子。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [],
    },
  },
  {
    tags: ['客製開發', 'AI 導入'],
    cta: {
      title: '對系統有疑問嗎？',
      text: '看系統開發服務的合作流程與費用怎麼算，也可以先看題庫系統的完整介紹；想問細節，右下角有官方 LINE。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [{ href: DEVELOPMENT_SERVICE.caseArticle, label: '看題庫系統介紹' }],
    },
  },
  // 2026-10-13 重心改為系統開發：講師故事（轉職文）與安裝教學的文末主要行動改導向系統開發頁，
  // 找講師、找教學降成次要連結。兩條規則的 tag 目前只有轉職文、Codex 安裝教學上下篇命中。
  {
    tags: ['講師故事', '演講'],
    cta: {
      title: '想把重複的工作交給系統？',
      text: '我和開發夥伴承接客製系統開發。可以先看題庫系統的案例，再看合作流程與費用怎麼算；覺得有需要，右下角官方 LINE 可以找我。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [{ href: DEVELOPMENT_SERVICE.caseArticle, label: '看題庫系統介紹' }],
    },
  },
  {
    tags: ['新手入門', '安裝教學', 'API 教學', 'AI 入門'],
    cta: {
      title: '想把重複的工作交給系統？',
      text: '我和開發夥伴承接客製系統開發。可以先看題庫系統的案例，再看合作流程與費用怎麼算；還有疑問的話，右下角官方 LINE 都能問。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [{ href: DEVELOPMENT_SERVICE.caseArticle, label: '看題庫系統介紹' }],
    },
  },
];

export function pickArticleCta(slug: string, tags: readonly string[]): ArticleCta {
  const rule = CTA_RULES.find((candidate) => candidate.tags.some((tag) => tags.includes(tag)));
  return rule ? rule.cta : CTA_VARIANTS[pickVariant(`cta:${slug}`, CTA_VARIANTS.length)];
}

// 依字串雜湊挑選輪替版本：同一個 key 永遠選到同一版
export function pickVariant(key: string, length: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % length;
}

/** 社群網址：OpenClaw / Hermes Agent 中文社群（Facebook 公開社團，Alex 擔任版主） */
export const COMMUNITY_URLS = {
  openclaw: 'https://www.facebook.com/groups/3238547836318385',
} as const;

export const LINKS = {
  facebookGroup: COMMUNITY_URLS.openclaw,
  threads: 'https://www.threads.com/@alex_wang.ai',
  instagram: 'https://www.instagram.com/alex_wang.ai/',
  youtube: 'https://www.youtube.com/channel/UCQUY_h3ic_oPmuoRJrLvE3g',
  github: 'https://github.com/js0980420',
  line: LINE_URLS.blog,
  email: 'mailto:js0980420@gmail.com',
};

// 首屏與右下角快速入口共用同一組路徑，避免兩處文案與目的頁漂移。
export const LEARNING_ENTRY_LINKS = [
  {
    href: '/blog/',
    title: '看全部文章',
    description: '數學題庫系統的開發紀錄與其他實作文章。',
    analyticsKey: 'articles',
    analyticsLabel: 'AI 實作主題文章',
  },
] as const;

export const GUIDED_ENTRY_LINKS = [
  {
    href: COURSE_SERVICE_URL,
    title: '手把手帶你實戰',
    description: '一對一教學三個方案：系統開發、簡單網頁、動畫影片，用 Claude Code 對話完成。',
    analyticsKey: 'tutor',
    analyticsLabel: '手把手帶你實戰（一對一教學）',
  },
] as const;

export const COLLABORATION_ENTRY_LINKS = [
  {
    href: `${SERVICE_SITE.url}/services/development/`,
    title: '系統開發',
    description: 'AI 導入、資料管理、API 串接，先免費看簡易 Demo 再決定。',
    analyticsKey: 'development',
    analyticsLabel: '系統開發服務',
  },
  {
    href: SPEAKING_SERVICE_URL,
    title: '邀請 AI 講師',
    description: '邀請 Alex 到公司、學校或社群分享。',
    analyticsKey: 'speaker',
    analyticsLabel: 'AI 講師與企業內訓',
  },
] as const;

export const FREE_ENTRY_LINKS = [
  {
    href: '/resources/',
    title: '免費工具與資源',
    description: '查看可以直接使用的免費內容。',
    analyticsKey: 'tools',
    analyticsLabel: '免費工具與學習資源',
  },
  {
    href: '/blog/feedback-desk/',
    title: 'feedback-desk PM溝通工具',
    description: '開源的回報工具，跟客戶、團隊夥伴溝通系統調整。',
    analyticsKey: 'feedback_desk',
    analyticsLabel: 'feedback-desk PM溝通工具',
  },
] as const;

import BANNER_VERSION from './data/banner-version.json';

// 頁面分享圖網址（含版本號）：版本來源是 src/data/banner-version.json，
// 升版改那裡的數字並重跑生成器即可，頁面引用自動跟上
export function pageBannerUrl(name: string): string {
  const pinned = (BANNER_VERSION.pinned as Record<string, number>)[name];
  return `${SITE.url}/images/pages/${name}-v${pinned ?? BANNER_VERSION.pages}.png`;
}

export function speakingBannerUrl(): string {
  return `${SITE.url}/images/services/speaking-v${BANNER_VERSION.speaking}.png`;
}

// 產生 BreadcrumbList JSON-LD；最後一項是當前頁、不帶 item
export function breadcrumbSchema(items: { name: string; item?: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      ...(crumb.item ? { item: crumb.item } : {}),
    })),
  };
}

// 服務站的 ProfessionalService：只寫站上已有的事實（名稱、服務內容、地區台灣），
// provider 指向全站 Person，讓「這個接案服務是誰在做」連回同一個實體。
export const PROFESSIONAL_SERVICE_SCHEMA = {
  '@type': 'ProfessionalService',
  '@id': `${SERVICE_SITE.url}/#professionalservice`,
  name: SITE.title,
  url: `${SERVICE_SITE.url}/`,
  description: `客製系統開發與 AI 導入：AI 導入、資料管理、API 串接（LINE、金流、Google 服務、既有系統），代表案例是數學題庫系統。${CASES_BEYOND_NOTE.text}另提供 AI 一對一教學。`,
  image: `${SITE.url}/aixwang-icon.png`,
  address: { '@type': 'PostalAddress', addressCountry: 'TW' },
  areaServed: { '@type': 'Country', name: '台灣' },
  provider: { '@id': AUTHOR.id },
};

// 全站 Person 實體：所有頁面的 JSON-LD 都引用同一個 @id，讓 AI 把內容歸到同一個人身上
export const PERSON_SCHEMA = {
  '@type': 'Person',
  '@id': AUTHOR.id,
  name: AUTHOR.name,
  alternateName: AUTHOR.alternateName,
  jobTitle: AUTHOR.jobTitle,
  description: AUTHOR.description,
  knowsAbout: AUTHOR.knowsAbout,
  email: AUTHOR.email,
  url: `${SITE.url}/about/`,
  image: [
    `${SITE.url}/images/profile/alex-16x9.webp`,
    `${SITE.url}/images/profile/alex-4x3.webp`,
    `${SITE.url}/images/profile/alex-1x1.webp`,
  ],
  sameAs: [LINKS.facebookGroup, LINKS.threads, LINKS.instagram, LINKS.youtube, LINKS.github],
};

// 文章分組對照：第一個標籤 → 分組名稱（把多個標籤合併成一組）；沒列在這裡的標籤就用標籤本身。
// 排除的標籤不進導覽與相關文章清單。頁首彈窗、教學頁頁尾、教學文章底部共用這一份。
/** 官方 LINE 帳號 ID。預填訊息要用 oaMessage 網址；lin.ee 追蹤短網址（LINKS.line）不支援預填。 */
export const LINE_OA_ID = '@438efvtl';
/** 開官方 LINE 並預填「我想做：<類別>，想先聊聊需求」 */
export const lineCategoryUrl = (category: string): string =>
  `https://line.me/R/oaMessage/${LINE_OA_ID}/?${encodeURIComponent(`我想做：${category}，想先聊聊需求`)}`;
/** GA4 測量 ID（主站與服務站共用） */
export const GA_MEASUREMENT_ID = 'G-91Z2F673C0';

/** 站上區塊名稱：導覽、頁尾、頁面標題、麵包屑一律引用，不寫死（2026-10-31 使用者指示簡稱「案例」「開源」） */
export const SECTION_NAMES = { cases: '案例', openSource: '開源' } as const;

export const ARTICLE_TAG_GROUP_MAP: Record<string, string> = { 'Claude Code': 'AI 教學', Codex: 'AI 教學', 開源工具: SECTION_NAMES.openSource };
export const ARTICLE_EXCLUDED_TAGS: string[] = ['轉職心得'];
export const TEACHING_GROUP = 'AI 教學';
// 一對一教學頁（/course/）頁尾的「AI 教學」清單，這個分類的文章排前面
export const COURSE_ARTICLE_TAG = 'Claude Code';

export function articleGroupName(firstTag: string | undefined): string {
  const tag = firstTag ?? '其他';
  return ARTICLE_TAG_GROUP_MAP[tag] ?? tag;
}

export function isTeachingArticle(tags: readonly string[]): boolean {
  return !ARTICLE_EXCLUDED_TAGS.includes(tags[0] ?? '') && articleGroupName(tags[0]) === TEACHING_GROUP;
}
