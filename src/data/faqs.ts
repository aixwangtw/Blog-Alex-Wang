// 全站 FAQ 單一來源：每題只定義一次，各頁面挑選需要的題目組合。
// 改答案只需要改這裡，首頁與服務頁（含 JSON-LD FAQPage）會同步更新。
export interface Faq {
  question: string;
  answer: string;
}

const prep: Faq = {
  question: '課前需要準備什麼？',
  answer:
    '第一步是訂閱 Claude，最少要 Pro 方案（每月 20 美元），才能用 Claude Code。學費依教學項目報價，點右下角官方 LINE 告訴我想學什麼。',
};

const noTechBackground: Faq = {
  question: '沒有技術背景可以上嗎？',
  answer:
    '可以。動畫影片和程式入門都從對話開始，只要會操作電腦就能上。程式進階會碰到資料庫、Docker、Linux，我會依你的程度安排堂數。',
};

const onlineClass: Faq = {
  question: '可以約線上教學嗎？',
  answer:
    '可以，用 Google Meet 或 Discord，只要能分享螢幕畫面就可以上課；實體課則約雙北的咖啡廳。',
};

const groupClass: Faq = {
  question: '可以多人一起上課嗎？',
  answer:
    '可以。多人一起上有優惠，報價時一起算。點右下角官方 LINE 告訴我人數和想學的項目。',
};

const booking: Faq = {
  question: '怎麼預約或詢問費用？',
  answer:
    '請點右下角官方 LINE 直接問我，說明你的目標（例如想用 AI 開發系統、做網頁或動畫影片），我會建議適合的堂數與報價。',
};

const speakingOrDevelopment: Faq = {
  question: '可以邀請講課或委託開發嗎？',
  answer:
    '可以。公開演講、企業內訓、社群講座或 AI 自動化開發需求，請點右下角官方 LINE，並簡單說明主題、日期、地點或預計開發的功能。私人家教與一般課程問題也可以直接問。',
};

export const HOME_FAQS: Faq[] = [
  prep,
  noTechBackground,
  onlineClass,
  booking,
  speakingOrDevelopment,
];

export const ONE_ON_ONE_FAQS: Faq[] = [onlineClass, groupClass, prep, noTechBackground, booking];

// 免費資源專區（/resources/）的 FAQ。前三題原本掛在 CMS 文章 free-resources，
// 該篇改寫成常設頁面後搬到這裡；2026-08 再依頁面新順序補上 Codex、grill-me。畫面與 FAQPage schema 都使用這一份資料，避免兩邊答案不同步。
export const RESOURCES_FAQS: Faq[] = [
  {
    question: 'Windows 新手應該先安裝哪一種 Codex？',
    answer:
      '先安裝 VS Code 與官方 Codex 插件，完成登入並開啟一個專案資料夾，就能用自然語言請 AI 協助。免費資源頁不要求先裝 CLI 或 WSL2；等真的需要終端機或 Linux 專案時再補即可。',
  },
  {
    question: 'grill-me Skill 怎麼安裝？',
    answer:
      '複製第二步提供的提示與 mattpocock/skills 連結，貼進 Codex 或 Claude Code 請它安裝；Claude Code 也可以自己執行 claude plugin install mattpocock-skills@claude-plugins-official。兩種方式選一種，都裝每個 Skill 會出現兩次。完成後開一個新對話，輸入 /grill-me 即可開始。',
  },
  {
    question: '使用 grill-me 需要會寫程式嗎？',
    answer:
      '不需要。grill-me 在動工前把計畫攤成一棵決策樹，每回合把現在問得下去的問題一次問完，每題編號並附建議答案，回答「是」就採用建議。AI 查得到的事實它自己查，決定留給你；全部問完、你確認雙方有共識才動工。寫網站、規劃工作流程或整理想法都能使用。',
  },
  {
    question: '只靠免費資源能學會 AI 自動化嗎？',
    answer:
      '可以先完成 Codex 安裝並試用 Skills。差別在時間：自學卡關要自己試錯。建議先用免費資源開始，真的卡住可以點右下角官方 LINE 問我。',
  },
  {
    question: '看影片有問題可以問你嗎？',
    answer: '可以，歡迎點右下角官方 LINE 直接問我，或到我的 Facebook 社團發問。',
  },
];
