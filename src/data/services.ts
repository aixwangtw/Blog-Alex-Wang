// 服務頁文案：一對一教學與演講邀約
import type { ImageMetadata } from 'astro';
import taiaTalkImage from '../assets/taia-talk.jpg';
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
  detail: string;
  pricing: string;
}[] = [
  {
    category: '程式進階：系統開發',
    detail: '用 Claude Code 寫一套系統，包含資料庫、Docker、架設主機、連線 Linux 環境、自動部署。',
    pricing: '依教學項目報價',
  },
  {
    category: '程式入門：簡單網頁',
    detail: '用 Claude Code 寫出一個簡單網頁，在自己的電腦上打開。',
    pricing: '依教學項目報價',
  },
  {
    category: 'AI 動畫影片',
    detail: '用 Claude Code 對話，以開源工具 HyperFrames 做出動畫影片。',
    pricing: '依教學項目報價',
  },
];

export const SPEAKING_TOPICS = [
  {
    title: 'AI 一鍵拍片：對話式影音內容生產',
    description: '以開源專案 HyperFrames 為例，展示從腳本、剪輯、配音到多平台發佈的對話式工作流。',
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
    host: 'TAIA 台灣人工智慧協會',
    topic: '如何只靠對話就一條龍完成拍片',
    description:
      '使用開源工具 HyperFrames，示範從腳本、剪輯、字幕、配音、音樂、封面圖到多平台自動上傳，只靠對話完成拍片的完整工作流。',
    image: taiaTalkImage,
    imageAlt: 'TAIA 台灣人工智慧協會講座授課現場',
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
