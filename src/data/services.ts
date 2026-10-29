// 服務頁文案：一對一教學與演講邀約
import type { ImageMetadata } from 'astro';
import claudeLogo from '../assets/claude-logo.webp';
import codexLogo from '../assets/codex-logo.jpg';
import hermesLogo from '../assets/hermes-logo.png';
import mixerboxTalkImage from '../assets/mixerbox-talk.jpeg';
import openclawLobster from '../assets/openclaw-lobster.jpg';
import taiaTalkImage from '../assets/taia-talk.jpg';
import taichungTalkImage from '../assets/taichung-talk.jpg';
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

// 教學內容：三個方案，一律依教學項目報價，不在站上寫金額
export const TEACHING_CONTENT: {
  category: string;
  /** 方案簡稱（頁首服務彈窗等只放短名稱的地方用） */
  shortName: string;
  detail: string;
  pricing: string;
}[] = [
  {
    category: '程式進階：系統開發',
    shortName: '系統開發',
    detail: '用 Claude Code 寫一套系統，包含資料庫、Docker、架設主機、連線 Linux 環境、自動部署。',
    pricing: '依教學項目報價',
  },
  {
    category: '程式入門：簡單網頁',
    shortName: '簡單網頁',
    detail: '用 Claude Code 寫出一個簡單網頁，在自己的電腦上打開。',
    pricing: '依教學項目報價',
  },
  {
    category: 'AI 動畫影片',
    shortName: '動畫影片',
    detail: '用 Claude Code 對話，以開源工具 HyperFrames 做出動畫影片。',
    pricing: '依教學項目報價',
  },
];

// 一對一教學的一句話介紹，與服務彈窗等處的條列（依原句拆成兩條，再接簡單網頁、動畫影片兩個方案）
export const ONE_ON_ONE_POINTS = ['手把手完成自動化的設定', '跑通後，安裝、開發、除錯、部署等都能自動化'];
export const ONE_ON_ONE_NAV_ITEMS = [
  ...ONE_ON_ONE_POINTS,
  ...TEACHING_CONTENT.filter((item) => item.shortName !== '系統開發').map((item) => item.shortName),
];

// 演講的三種形式：演講頁開頭與結構化資料、頁首服務彈窗共用
export const SPEAKING_KINDS = ['公開演講', '企業內訓', '工作坊'];

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
      '現場帶大家實作用 AI 做出社群圖文，解決跑版、失真、不會用設計工具的問題。',
    image: taichungTalkImage,
    imageAlt: '台中場講座授課現場',
  },
  {
    host: '雲林場講座',
    topic: '如何用 AI 製作不跑版、不失真的社群圖文',
    description:
      '示範 AI 圖文常見的人物失真問題怎麼判斷與修復：小問題補照片重做、大問題直接重新生成，最後用 Canva 收尾排版。',
    image: yunlinTalkImage,
    imageAlt: '雲林場講座授課現場',
  },
];

export const SPEAKING_FORMATS = [
  '實體演講／工作坊：雙北為主，外縣市有提供交通補助也可配合',
  '時長：1 小時演講到整天工作坊皆可規劃',
];

// 系統開發服務頁的內容（頁面、.md 版與 llms-full.txt 共用，避免漂移）。
// 可以做什麼：取自〈系統開發、AI 導入費用怎麼算？〉FAQ「包含哪些功能？可以加 AI 嗎？」
export const DEVELOPMENT_CAPABILITIES = [
  { title: 'AI 導入', description: '讓 AI 讀文件、整理資料、產生報告、回答常見問題。' },
  { title: '資料管理', description: '客戶、訂單、學生、庫存這類資料的後台，可以搜尋、匯入匯出、分權限。' },
  { title: 'API 串接', description: '接 LINE、金流、Google 服務，或你現在已經在用的系統。' },
  { title: '隨調隨改', description: '開發過程中需求可以隨時調整，改了就更新給你看，只是微調不會另外收費；一開始用不到的可以之後再加。' },
];

export const DEVELOPMENT_CASE_FEATURES = [
  'AI 辨識：上傳 PDF、Word 或考卷照片，AI 拆成一題一題，老師對照原卷審核',
  'AI 詳解：AI 產生詳解，老師確認後才收進題庫',
  'AI 出題：常見需求，Demo 可以先體驗，正式導入時依需求開發',
];

// 上線之後：資料、原始碼、維護（取自同一篇文章同名一節）
export const DEVELOPMENT_AFTER_LAUNCH = [
  '上線後有一年保固。保固結束後可以簽維護合約；想找其他人接手也可以，我們會配合交接。',
  '系統和資料都放在你自己的主機上，主機帳號從一開始就是你的名義。需要的話可以簽保密協議，簽約時寫進合約。',
  '原始碼和資料庫也可以交給你，同樣寫進合約，但交出原始碼後，就不提供一年保固。',
];
