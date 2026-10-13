// 全站共用的品牌與聯絡資訊：改這裡就能同步更新所有頁面與 JSON-LD
export const SITE = {
  title: 'Aix 系統開發',
  titleEn: 'Aix System Development',
  // 舊站名只留在 llms.txt 的說明；結構化資料的 alternateName 不再帶舊名，免得訊號停在「AI 教學」
  formerNames: ['AI新手教學', 'AI Beginner Blog'],
  url: 'https://aixwang.dev',
  description:
    'Alex 是台灣的系統開發工程師，目前全職接案，和開發夥伴承接客製系統開發，代表案例是補習班數學老師用的題庫系統。另提供 AI 教學與演講。',
  locale: 'zh-TW',
};

// 服務內容獨立成子網域；主站專注文章與免費資源，
// 課程、演講與預約轉換統一放在服務站。
export const SERVICE_SITE = {
  title: 'Aix 系統開發服務',
  url: 'https://service.aixwang.dev',
  description:
    '我和開發夥伴承接客製系統開發，代表案例是補習班用的數學題庫系統。另提供 AI 教學與演講。',
};

// 系統開發服務頁與首頁共用的事實（流程、時程、付款），內容需與題庫文章 FAQ 第 1 題一致，不得寫開發費金額。
export const DEVELOPMENT_SERVICE = {
  url: `${SERVICE_SITE.url}/services/development/`,
  caseArticle: '/blog/math-teacher-question-bank/',
  demoUrl: 'https://demo-question.aixwang.dev/admin/auth/login',
  steps: ['先聊需求，看看你手上的資料', '試用 Demo，確認方向', '確認功能後報價', '分階段開發，每個階段都讓你試用', '上線並教你怎麼用', '持續維護'],
  timeline: '開發時程約兩個月，實際依功能範圍而定；開發過程中需求原則上可以隨時調整。',
  payment: '開發費依功能報價，加 LINE 可以免費評估；分三次付款：簽約時 40%、期中 30%、驗收時 30%，需要分更多期可以再詳談。',
  hosting: '主機建置依規格約新台幣 5,000 元（一次性），主機基本規格每月約新台幣 500 元；AI 使用費依實際用量另計。',
};

export const AUTHOR = {
  id: `${SITE.url}/about#person`,
  name: 'Alex',
  // 別名：讓 Google 知識圖譜與 AI 搜尋把不同稱呼認成同一個人
  alternateName: ['王士麟', 'Alex Wang', '艾克斯王', 'aixwang'],
  jobTitle: '系統開發工程師',
  description:
    '系統開發工程師，目前全職接案，有一群開發團隊，承接客製系統開發，用 AI 自動化整理資料、產出內容，代表案例是補習班數學題庫系統。另外也教「跟 AI 對話就能拍片」。',
  // 技能以站上已有的事實為準：題庫系統、CRM／後台、Line LIFF、AI 客服見 instructor.ts 與轉職文，
  // Laravel 見轉職文 FAQ（技術棧）與題庫系統本身；對話式拍片、HyperFrames 是教學主題，放最後。
  knowsAbout: [
    '客製系統開發',
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

// 「關於作者」與文末 CTA 文案輪替：8 篇文章結尾一字不差的同一段模板，
// 連讀兩篇就會有「機器複製感」（2026-07-28 稽核結論）。改成依文章 slug
// 雜湊固定選版：同一篇永遠同一版（對讀者與搜尋引擎穩定），不同篇之間輪替。
// 內容都是同一組真實事實的不同說法，不得加入新的宣稱。
export const AUTHOR_INTROS = [
  '全職接案工程師，承接客製系統開發，也教「跟 AI 對話就能拍片」，目標是把工作流程簡化成用說的就能完成。',
  '接案工程師。我教的重點只有一個：跟 AI 對話就能把影片拍出來，從腳本、剪輯到發佈都用說的完成。',
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
    title: '想更快上手？可以直接找我一對一',
    text: '我提供付費一對一 AI 私人教學（雙北咖啡廳實體課或 Google Meet／Discord 線上課），也接受企業與社群的 AI 演講邀約。',
  },
  {
    title: '想找人帶你安裝、串接？',
    text: '一對一教學可以約雙北咖啡廳實體或線上（Google Meet／Discord），從安裝到做出第一個成品帶你走一遍。企業與社群的演講邀約也接。',
  },
  {
    title: '想先看看能怎麼自動化？',
    text: '想自動化的工作可以先看題庫系統的案例；覺得適合再約一對一（雙北實體或線上都可以）。也歡迎企業與社群邀約演講。',
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
  {
    tags: ['客製開發', 'AI 導入'],
    cta: {
      title: '對系統有疑問嗎？',
      text: '看系統開發服務的合作流程與費用怎麼算，也可以先看題庫系統的完整介紹；有問題點右下角官方 LINE 直接問我。',
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
      text: '我和開發夥伴承接客製系統開發。可以先看題庫系統的案例，再看合作流程與費用怎麼算；有問題點右下角官方 LINE 直接問我。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [
        { href: DEVELOPMENT_SERVICE.caseArticle, label: '看題庫系統介紹' },
        { href: `${SERVICE_SITE.url}/services/speaking/`, label: '找講師', external: true },
      ],
    },
  },
  {
    tags: ['新手入門', '安裝教學', 'API 教學', 'AI 入門'],
    cta: {
      title: '想把重複的工作交給系統？',
      text: '我和開發夥伴承接客製系統開發。可以先看題庫系統的案例，再看合作流程與費用怎麼算；有問題點右下角官方 LINE 直接問我。',
      href: DEVELOPMENT_SERVICE.url,
      label: '了解系統\n開發服務',
      links: [
        { href: DEVELOPMENT_SERVICE.caseArticle, label: '看題庫系統介紹' },
        { href: `${SERVICE_SITE.url}/course/`, label: '找教學', external: true },
      ],
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

export const LINKS = {
  facebookGroup: 'https://www.facebook.com/groups/3238547836318385',
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
    href: `${SERVICE_SITE.url}/course/`,
    title: '學對話拍片',
    description: '一對一教學：跟 AI 對話就能拍片，看內容與上課方式。',
    analyticsKey: 'tutor',
    analyticsLabel: 'AI 一對一家教',
  },
] as const;

export const COLLABORATION_ENTRY_LINKS = [
  {
    href: `${SERVICE_SITE.url}/services/development/`,
    title: '系統開發',
    description: '用 AI 自動化整理資料、產出內容，代表案例：數學題庫。',
    analyticsKey: 'development',
    analyticsLabel: '系統開發服務',
  },
  {
    href: `${SERVICE_SITE.url}/services/speaking/`,
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
] as const;

export const NAV = [
  { href: '/', label: '首頁' },
  { href: '/blog/', label: '文章' },
  { href: '/resources/', label: '免費' },
  { href: `${SERVICE_SITE.url}/services/development/`, label: '系統開發' },
  { href: `${SERVICE_SITE.url}/course/`, label: '課程' },
  { href: `${SERVICE_SITE.url}/services/speaking/`, label: '演講' },
  { href: '/faq/', label: '問題' },
  { href: '/about/', label: '關於' },
];

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
  description: '客製系統開發：題庫與教學系統、後台管理系統、LINE 相關網頁與 AI 自動化流程；代表案例是補習班數學題庫系統。',
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
