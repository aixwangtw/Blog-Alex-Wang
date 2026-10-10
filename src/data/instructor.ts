// 講師經歷單一來源：about 頁顯示全部，首頁只顯示 featured 的前幾條
export interface ExperienceItem {
  text: string;
  featured?: boolean;
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    text: '系統開發工程師：目前全職接案，和開發夥伴承接客製系統開發，作品包括補習班數學題庫系統、Line LIFF 網頁、AI 客服、CRM 後台管理系統等實際商業專案。',
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
