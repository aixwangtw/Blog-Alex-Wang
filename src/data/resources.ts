// 免費資源項目的單一來源：免費資源頁、/resources.md、llms-full.txt、頂部「領取」導覽卡（Base.astro）
// 與首頁／服務站的需求分流卡（NeedRouter.astro）共用。標題、一句說明、圖片、連結改這裡，全站同步。
import githubLogo from '../assets/github-logo.svg';

/**
 * grill-me（Matt Pocock Skills）在各處的標題（使用者指定寫法）：頁首文章彈窗、領取導覽卡、免費資源頁、需求分流卡共用。
 * 星數查證：GitHub API mattpocock/skills stargazers_count = 305,849（2026-10-29 11:11 查詢），超過 30 萬。
 */
const GRILL_ME_TAGLINE = '30 萬顆星，提升開發效率';
const MATT_POCOCK_SKILLS_TITLE = `grill-me：${GRILL_ME_TAGLINE}`;
export const RESOURCES_INTRO =
  '不用急著付費。先把 Claude Code 或 Codex 裝好，再把現成的 Skills 貼給 AI 安裝，就能直接開始使用。做完還是卡關，再決定要用右下角官方 LINE，還是到 Facebook 社團發問。';

export const CODEX_RESOURCE = {
  heading: '第一步：先安裝 Claude Code 或 Codex',
  intro:
    'Claude Code 和 Codex 都能用，擇一安裝即可，兩個都有安裝教學。後面安裝 Skills、執行開源工具都從它進去。Windows 新手從桌面版或 VS Code 外掛開始，不用先碰終端機。',
  articleHref: '/blog/codex-windows-wsl-install/',
  label: '新手先看',
  title: 'VS Code＋Codex 外掛版',
  description: '不用先碰終端機，完成安裝、登入與第一次對話。',
  /** 免費資源頁與 .md 版：兩個工具各一行說明，連到主站安裝文章 */
  tools: [
    {
      name: 'Claude Code',
      thumbSlug: 'claude-code-install',
      alt: 'Claude Code 安裝教學縮圖',
      description: '桌面版、VS Code、CLI 三種裝法都有教。',
      links: [{ slug: 'claude-code-install', label: 'Claude Code 安裝教學' }],
    },
    {
      name: 'Codex',
      thumbSlug: 'codex-windows-wsl-install',
      alt: 'Codex 安裝教學縮圖',
      description: 'VS Code 外掛版，不用碰終端機；需要終端機時，文末有進階安裝篇。',
      links: [{ slug: 'codex-windows-wsl-install', label: 'Codex 安裝教學' }],
    },
  ],
};

export const GRILL_ME_RESOURCE = {
  heading: '第二步：把 Skills 貼給 AI 安裝',
  label: '本週推薦 Skill',
  name: 'grill-me',
  title: MATT_POCOCK_SKILLS_TITLE,
  titleSuffix: `：${GRILL_ME_TAGLINE}`,
  descriptionBefore: '你先跟 AI 說想做什麼，它會一輪一輪問到每個細節都講清楚，才開始寫程式。安裝後在新對話輸入 ',
  command: '/grill-me',
  descriptionAfter: ' 就能開始。',
  points: [
    'AI 自己查得到的資料，不會丟回來問你',
    '每個問題會附建議答案，可以直接按編號回覆',
    '細節都談完，會先問你同不同意，才開始動工',
  ],
  stats: [
    { label: '觀看', value: '47,649' },
    { label: '按讚', value: '950' },
    { label: '收藏', value: '1,427' },
    { label: '分享', value: '594' },
  ],
  statsSource: 'Meta Insights，2026 年 8 月 13 日快照',
  repoUrl: 'https://github.com/mattpocock/skills',
  instagramUrl: 'https://www.instagram.com/reel/DbwqIJkydIQ/',
  installPrompt: '請幫我安裝這個 Skills\nhttps://github.com/mattpocock/skills',
  installNote: '貼進 Codex，確認來源後再允許安裝。',
  /** 頂部「領取」導覽卡；文章草稿下線中，卡片暫連 IG Reel。文章重新上線時 href 改回 '/blog/matt-pocock-skills/' 並移除 external。 */
  nav: {
    href: 'https://www.instagram.com/reel/DbwqIJkydIQ/',
    external: true,
    eyebrow: '提升開發效率 Skill',
    title: MATT_POCOCK_SKILLS_TITLE,
    description: '動工前 AI 先問清楚需求。',
    image: githubLogo.src,
    cta: '領取',
  },
};

export const FEEDBACK_DESK_RESOURCE = {
  heading: '開源工具：feedback-desk PM溝通工具',
  intro:
    '跟客戶、團隊夥伴溝通系統問題的回報工具：客戶開單附截圖，團隊改好後在同一張單寫調整說明，客戶確認後結案。MIT 授權，部署到自己的 Cloudflare 帳號，只用免費方案；Claude Code、Codex 可以透過 MCP 直接處理單。',
  articleHref: '/blog/feedback-desk/',
  label: '開源 PM溝通工具',
  title: 'feedback-desk 介紹',
  description: '開單、調整說明、客戶確認的流程與畫面。',
  repoUrl: 'https://github.com/aixwangtw/feedback-desk',
  installPrompt: '請照這個 repo 的 README 幫我安裝\nhttps://github.com/aixwangtw/feedback-desk',
  installNote:
    '需要 Node.js 20 以上和一個 Cloudflare 免費帳號，不需要自己的主機；第一次部署要在瀏覽器登入 Cloudflare 一次。想自己掌控主機或需要自動處理，可以用 GitHub 上的 laravel 分支。',
  /** 頂部「領取」導覽卡 */
  nav: {
    href: '/blog/feedback-desk/',
    external: false,
    eyebrow: 'MIT 開源',
    title: 'PM高效溝通工具',
    description: '客戶開單附截圖，AI 讀單處理，確認後才結案。',
    image: githubLogo.src,
    cta: '領取',
  },
};

/** 需求分流卡「想先領取免費資源」列出的例子，順序即顯示順序 */
export const RESOURCE_EXAMPLES = [GRILL_ME_RESOURCE.title, FEEDBACK_DESK_RESOURCE.nav.title, CODEX_RESOURCE.title];
