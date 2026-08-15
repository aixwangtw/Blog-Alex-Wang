// 服務頁文案：一對一教學與演講邀約
import type { ImageMetadata } from 'astro';
import chatgptLogo from '../assets/chatgpt-logo.png';
import claudeCodeLogo from '../assets/claude-code-logo.png';
import claudeLogo from '../assets/claude-logo.webp';
import codexLogo from '../assets/codex-logo.jpg';
import facebookLogo from '../assets/facebook-logo.png';
import githubLogo from '../assets/github-logo.svg';
import hermesLogo from '../assets/hermes-logo.png';
import instagramLogo from '../assets/instagram-logo.png';
import lineLogo from '../assets/line-logo.png';
import mixerboxTalkImage from '../assets/mixerbox-talk.jpeg';
import openclawLobster from '../assets/openclaw-lobster.jpg';
import taiaTalkImage from '../assets/taia-talk.jpg';
import taichungTalkImage from '../assets/taichung-talk.jpg';
import threadsLogo from '../assets/threads-logo.jpg';
import yunlinTalkImage from '../assets/yunlin-talk.jpg';
export const CLASS_FORMATS = [
  {
    title: '實體課',
    description:
      '雙北地區，約在交通方便的咖啡廳。適合對電腦操作較不熟、希望有人在旁邊直接指導的學員。帶筆電來即可。',
  },
  {
    title: '線上教學',
    description:
      'Google Meet、Zoom、Discord 等皆可配合，你分享螢幕、我一步一步帶你操作。台灣各地與海外學員皆可預約。',
  },
];

// 可教學工具：一對一教學與演講頁共用
export const TEACHING_TOOLS: {
  name: string;
  note?: string;
  image: ImageMetadata;
  imageAlt: string;
}[] = [
  { name: 'Claude Code', image: claudeCodeLogo, imageAlt: 'Claude Code 標誌' },
  { name: 'Codex', image: codexLogo, imageAlt: 'Codex 標誌' },
  { name: 'ChatGPT', image: chatgptLogo, imageAlt: 'ChatGPT 標誌' },
  { name: 'OpenClaw', note: '龍蝦', image: openclawLobster, imageAlt: 'OpenClaw 龍蝦吉祥物' },
  { name: 'Hermes Agent', note: '愛馬仕', image: hermesLogo, imageAlt: 'Hermes Agent 吉祥物' },
  { name: 'GitHub', image: githubLogo, imageAlt: 'GitHub 標誌' },
];

// 教學內容分類
export const TEACHING_CONTENT: {
  category: string;
  detail: string;
  logos?: { image: ImageMetadata; alt: string }[];
}[] = [
  {
    category: '工具安裝',
    detail:
      '四大工具：Claude Code、Codex、OpenClaw（龍蝦）、Hermes（愛馬仕）的安裝、工具權限與環境設定。',
    logos: [
      { image: claudeCodeLogo, alt: 'Claude Code 標誌' },
      { image: codexLogo, alt: 'Codex 標誌' },
      { image: openclawLobster, alt: 'OpenClaw 龍蝦吉祥物' },
      { image: hermesLogo, alt: 'Hermes Agent 吉祥物' },
    ],
  },
  {
    category: 'Vibe Coding 從 0 到 1',
    detail:
      '從需求拆解、請 AI 寫程式到測試與除錯，建立可以自己重複使用的完整開發流程。教你縮小改動範圍、讓 AI 檢查關聯功能並在每次修改後驗證，解決「代碼改 A 卻壞 B」的問題。',
  },
  {
    category: 'API 串接：自動發文、留言、私訊、收訊',
    detail:
      'Meta 三大 API（Facebook / Instagram / Threads）申請與帳號綁定，以及 LINE Messaging API 整合，方便做 AI 客服、自動管理客戶訊息，也方便統一管理雜亂的訊息。',
    logos: [
      { image: facebookLogo, alt: 'Facebook 標誌' },
      { image: instagramLogo, alt: 'Instagram 標誌' },
      { image: threadsLogo, alt: 'Threads 標誌' },
      { image: lineLogo, alt: 'LINE 標誌' },
    ],
  },
  {
    category: '生圖教學',
    detail: '用 AI 生成不跑版、不失真的社群圖文，並解決人物失真等常見問題。',
  },
  {
    category: '拍片教學',
    detail:
      '用開源工具 HyperFrames，從腳本、剪輯、字幕、配音、封面圖到多平台發佈，只靠對話一條龍完成拍片。',
  },
];

export const VIBE_CODING_SYLLABUS = [
  {
    step: '第一步',
    title: '建立專案規則',
    duration: '20 分鐘',
    detail: '定義 AI 可以與不可以做的事、修改範圍，以及完成後要如何檢查與驗收。',
  },
  {
    step: '第二步',
    title: '規劃開發架構與順序',
    duration: '40 分鐘',
    detail: '把需求拆成頁面、資料與功能，規劃模組分工和開發順序，再逐步交給 AI 完成。',
  },
  {
    step: '第三步',
    title: '解 Bug、解耦與共用元件',
    duration: '90 分鐘',
    detail:
      '學會描述預期與實際結果、貼上完整錯誤訊息，讓 AI 先分析影響範圍；再拆開互相牽連的邏輯、整理共用元件，用最小修改避免「改 A 壞 B」。',
  },
  {
    step: '綜合實作',
    title: '從分析到驗收走完一次',
    duration: '30 分鐘',
    detail: '實際練習建立規則、拆分功能、提供錯誤資訊、要求最小修改，最後驗收相關功能。',
  },
];

export const VIBE_CODING_PROMPTS = [
  '請先分析問題原因與影響範圍，暫時不要修改。',
  '請告訴我還需要提供哪些程式碼、設定或畫面。',
  '請提出最小修改方案，不要更動無關功能。',
  '修改完成後，請列出受到影響的功能與驗收項目。',
];

// 實際一對一教學案例（取自講師履歷）
export const TEACHING_CASES = [
  {
    student: 'WordPress 工程師',
    topic: '安裝 Hermes 以及串接 WP 自動發文到 Threads',
    description:
      '帶領完成 Codex 和 Hermes 安裝、Threads API 申請，以及 WordPress、LINE／Telegram 審核與 Threads 自動發文的完整工作流。',
    image: hermesLogo,
    imageAlt: 'Hermes Agent 吉祥物',
  },
  {
    student: '香港行銷公司',
    topic: '安裝 Codex 以及用來搜索 Threads 品牌輿情',
    description:
      '於 VS Code 安裝 Codex、申請 Threads API、安裝輿情蒐集插件、撰寫搜尋腳本，並使用 GitHub CLI 上傳至公司端儲存庫。',
    image: codexLogo,
    imageAlt: 'Codex 標誌',
  },
  {
    student: '補教業',
    topic: '安裝 Claude Code 並用 AI 整理 Email、行事曆並透過 LINE 提醒',
    description: '帶領完成 Claude Code 安裝、Email 串接、LINE Messaging API 整合與排程腳本撰寫。',
    image: claudeLogo,
    imageAlt: 'Claude 標誌',
  },
  {
    student: '精神科醫師',
    topic: 'OpenClaw 救援並協助串接免費地端模型 Gemma 4',
    description:
      '於 OpenClaw GUI 介面找到設定檔、修復 JSON 格式，並將地端模型改為 Gemma 4 或串接 API。',
    image: openclawLobster,
    imageAlt: 'OpenClaw 龍蝦吉祥物',
  },
];

export const SPEAKING_TOPICS = [
  {
    title: 'AI Agent 入門：從網頁版聊天到能執行任務的 AI',
    description:
      '為什麼桌面版 Agent 是 AI 生產力的分水嶺，適合對 AI 有興趣但還停在 ChatGPT 網頁版的聽眾。',
  },
  {
    title: '社群自動化實戰：讓 AI 幫你經營 FB / IG / Threads',
    description: 'Meta API 串接、自動發文與排程的完整流程演示，適合行銷團隊與個人品牌經營者。',
  },
  {
    title: 'AI 一鍵拍片：對話式影音內容生產',
    description: '以開源專案 HyperFrames 為例，展示從腳本、剪輯、配音到多平台發佈的對話式工作流。',
  },
  {
    title: 'AI 工作流與 Skill 設計',
    description: '如何把團隊的重複性工作封裝成 AI 可執行的 Skill，適合想導入 AI 的企業團隊。',
  },
];

// 過往演講紀錄（取自講師履歷）
export const SPEAKING_ENGAGEMENTS: {
  host: string;
  topic: string;
  description: string;
  image: ImageMetadata;
  imageAlt: string;
  link?: string;
  linkLabel?: string;
}[] = [
  {
    host: 'MixerBox',
    topic: '如何讓 OpenClaw 斷線時自動恢復連線',
    description:
      '使用 Tailscale 讓兩台 OpenClaw 互相連線，實現雙機互相救援，並在現場演示如何操作。',
    image: mixerboxTalkImage,
    imageAlt: 'MixerBox 講座授課現場',
  },
  {
    host: 'TAIA 台灣人工智慧協會',
    topic: '如何只靠對話就一條龍完成拍片',
    description:
      '使用開源工具 HyperFrames，示範從腳本、剪輯、字幕、配音、音樂、封面圖到多平台自動上傳，只靠對話完成拍片的完整工作流。',
    image: taiaTalkImage,
    imageAlt: 'TAIA 台灣人工智慧協會講座授課現場',
  },
  {
    host: '台中場講座',
    topic: '如何用 AI 製作不跑版、不失真的社群圖文',
    description:
      '現場帶大家實作用 AI 做出社群圖文，解決跑版、失真、不會用設計工具的問題。因為發現現場大多數人都不會用 AI Agent，因此自行開發了開源的社群圖文模板工具 Tooka，讓不熟 Agent 的人也能直接套用。',
    image: taichungTalkImage,
    imageAlt: '台中場講座授課現場',
    link: 'https://github.com/js0980420/tooka',
    linkLabel: 'Tooka 開源專案 →',
  },
  {
    host: '雲林場講座',
    topic: '如何用 AI 製作不跑版、不失真的社群圖文',
    description:
      '示範 AI 圖文常見的人物失真問題怎麼判斷與修復：小問題補照片重做、大問題直接重新生成，最後用 Canva 收尾排版。同樣因應現場學員多數不會用 AI Agent，改以自製的社群圖文模板工具 Tooka 帶大家完成。',
    image: yunlinTalkImage,
    imageAlt: '雲林場講座授課現場',
    link: 'https://github.com/js0980420/tooka',
    linkLabel: 'Tooka 開源專案 →',
  },
];

export const SPEAKING_FORMATS = [
  '實體演講／工作坊：雙北為主，外縣市有提供交通補助也可配合',
  '時長：1 小時演講到整天工作坊皆可規劃',
];
