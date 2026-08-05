// 首頁區塊文案：課程大綱、學習成果、適合對象、教學影片
export const SYLLABUS = [
  {
    label: 'Module 01',
    title: '為什麼一定要先用 Claude Code / Codex 桌面版',
    summary:
      '先解說為什麼要用 Claude Code / Codex 桌面版，而不是 n8n、網頁版或其他 Agent；同時帶你把需要的套件與環境設定一次裝好。新手只要先訂閱 20 美元的 ChatGPT / Claude 額度即可開始，我也會分享怎麼節省額度。',
  },
  {
    label: 'Module 02',
    title: 'Threads API 申請與 Token 設定',
    summary:
      'Threads 的申請跟 FB / IG 不太一樣：FB 跟 IG 可以透過企業管理後台新增資產管理取得永久權限的 Token，Threads 則要走開發者後台申請、長期 Token 60 天需延期。這個模組帶你完整跑一次 Threads 申請與 Token 設定。',
  },
  {
    label: 'Module 03',
    title: '測試自動發文與 Meta 權限設定',
    summary:
      '實際測試自動發文流程，並解說自動發文的權限該怎麼設定，哪些操作容易出問題，以及怎麼避免被 Meta 判定異常而封鎖。',
  },
  {
    label: 'Module 04',
    title: '用 Skill 隨時修改文案與排程',
    summary:
      '把發文文案與排程整理進 Skill，讓 AI 可以記住你的發文習慣，之後要改內容、改時間、改流程都能快速調整；Skill 也可以理解成強化 AI 的記憶，避免關掉對話框之後 AI 失憶。',
  },
];

export const OUTCOMES = [
  '從零開始完成桌面版 Claude Code / Codex 的安裝與基本操作，解決工具權限問題，不再只是網頁版 Chat 模式，而是真正能執行任務的 Agent。',
  '學會串接 Meta 三大 API，讓 AI 可跟真實社群互動。',
  '做出自動發文流程，並可設定發布排程。',
  '學會寫 Skill，把常用任務整理成你自己的可重用工作流。',
];

export const AUDIENCE = [
  { title: '老師與講師', description: '想提升備課效率、增加互動設計、把 AI 用進實際教學的人。' },
  {
    title: '個人品牌經營者',
    description: '需要大量產出內容、課程說明頁、社群素材與銷售頁的人。',
  },
  {
    title: '想系統學 AI 的實作者',
    description: '不想再停留在零散技巧，而是想建立完整方法與實戰作品的人。',
  },
];

export const VIDEOS: {
  title: string;
  description: string;
  tag: string;
  embedId?: string;
  src?: string;
}[] = [
  {
    title: 'Threads API 申請教學',
    description: '聚焦自動發文、留言回覆與 token 申請流程的實戰教學代表作。',
    tag: 'API 教學',
    embedId: 'nTYrG7EuFHA',
  },
  {
    title: 'Instagram API 申請教學：從 Meta 開發者後台到自動發文第一步',
    description: 'Instagram API 的申請流程實戰：從 Meta 開發者後台設定，一路做到自動發文的第一步。',
    tag: 'API 教學',
    embedId: 'O1qfeDIZRkQ',
  },
  {
    title: 'Tooka：AI 生成社群圖文的實際工作流',
    description: '用中文描述需求，AI Agent 透過我開源的 Tooka 生成 1080×1350 輪播圖文並發佈的完整流程示範。',
    tag: 'AI 圖文',
    src: '/videos/tooka-workflow-demo.mp4',
  },
];
