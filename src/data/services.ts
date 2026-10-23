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
