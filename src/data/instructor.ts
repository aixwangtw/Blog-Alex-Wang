// 講師經歷單一來源：about 頁顯示全部，首頁只顯示 featured 的前幾條
export interface ExperienceItem {
  text: string;
  featured?: boolean;
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    text: '全職接案工程師：作品包括 Line LIFF 網頁、AI 客服、CRM 後台管理系統等實際商業專案。',
    featured: true,
  },
  {
    text: '開源社群圖文模板框架 Tooka 作者：AI Agent 用程式渲染生成 1080×1350 的 IG 輪播圖文，不跑版、不失真，可一鍵發佈到 FB / IG / Threads。',
    featured: true,
  },
  {
    text: '一鍵拍片開源專案 HyperFrames 協作者：從腳本、剪輯、字幕、真人配音、音樂、封面圖到多平台自動發佈，都能透過對話完成，大幅降低拍片的時間成本與技術門檻。',
    featured: true,
  },
  {
    text: '提供 OpenClaw、Hermes 的救援服務。',
    featured: true,
  },
  { text: '21 萬人 OpenClaw 中文社群版主。' },
  { text: 'MixerBox 等單位講座授課經驗。' },
];

export const FEATURED_EXPERIENCE: ExperienceItem[] = EXPERIENCE.filter((item) => item.featured);
