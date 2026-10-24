// 免費資源頁（/resources/）的項目說明單一來源：頁面、/resources.md 與 llms-full.txt 共用，避免內容漂移。
export const RESOURCES_INTRO =
  '不用急著付費。先把 Codex 裝好，再把現成的 Skills 貼給 AI 安裝，就能直接開始使用。做完還是卡關，可以點右下角官方 LINE 直接問我，或到 Facebook 社團發問。';

export const CODEX_RESOURCE = {
  heading: '第一步：先安裝 Codex',
  intro:
    'Codex 是後面安裝 Skills、執行開源工具與處理錯誤的入口。Windows 新手先用 VS Code 官方 Codex 插件完成安裝、登入與第一次對話，不必一開始碰終端機或額外準備 Linux 環境。',
  articleHref: '/blog/codex-windows-wsl-install/',
  label: '新手先看',
  title: 'VS Code＋Codex 插件版',
  description: '不用先碰終端機，完成安裝、登入與第一次對話。',
};

export const GRILL_ME_RESOURCE = {
  heading: '第二步：把 Skills 貼給 AI 安裝',
  label: '本週推薦 Skill',
  name: 'grill-me',
  titleSuffix: '：Matt Pocock 開源 Skills，提升開發效率',
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
};
