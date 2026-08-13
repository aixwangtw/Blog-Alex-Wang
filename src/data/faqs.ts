// 全站 FAQ 單一來源：每題只定義一次，各頁面挑選需要的題目組合。
// 改答案只需要改這裡，首頁與服務頁（含 JSON-LD FAQPage）會同步更新。
export interface Faq {
  question: string;
  answer: string;
}

const prep: Faq = {
  question: '課前需要準備什麼？',
  answer:
    '除了教學費用，還需要付費訂閱 AI。初學者只要先準備一個月 20 美元的額度就夠了。如果你要學的是自動發文或留言、私訊，才需要另外確認你有可用的 Facebook 帳號，能拿來登入 Meta 開發者後台並綁定其他要串接的帳號。',
};

const noTechBackground: Faq = {
  question: '沒有技術背景可以上嗎？',
  answer:
    '可以。這門課用意在於把原本複雜的技術門檻，優化成只要對話就能完成的工作流，任何人只要會操作電腦就能上。',
};

const onlineClass: Faq = {
  question: '可以約線上教學嗎？',
  answer:
    '可以，用 Google Meet 或 Discord，只要能分享螢幕畫面就可以上課；實體課則約雙北的咖啡廳。',
};

const groupClass: Faq = {
  question: '可以多人一起上課嗎？',
  answer:
    '可以。一對多教學的第一位學員依原價計費，第二位起每位的教學費用都享八折。',
};

const whyNotFreeAi: Faq = {
  question: '為什麼不用網頁版或免費 AI？',
  answer:
    '因為網頁版沒有 Agent 權限，也沒辦法做環境設定、填入申請完的 Meta API Key，更不能直接寫自動發文腳本，基本上只適合拿來問問題。免費 AI 的穩定度和能力也通常不如 Claude 或 Codex，很容易一直出錯，花掉的時間可能遠超過 20 美元。',
};

const claudeOrCodex: Faq = {
  question: 'Claude、Codex 預算只夠選一個的話選哪個？',
  answer:
    '我會推薦 Codex。因為 5.5 更新後，額度比 Claude 多很多，而且也可以拿來當龍蝦或 Hermes 的飼料，不用太擔心被封號。',
};

const metaTokenDiff: Faq = {
  question: 'FB、IG、Threads 的 API Token 有什麼不同？',
  answer:
    'FB 跟 IG 可以透過企業管理後台（Business Manager）新增資產管理，取得永久權限的 Token；Threads 沒有這條路，只能在開發者後台申請長期 Token，效期 60 天需要延期——我開源的 Tooka 已內建自動延期，第一次手動申請後就不用怕過期。',
};

const booking: Faq = {
  question: '怎麼預約或詢問費用？',
  answer:
    '直接加 LINE 免費諮詢，說明你的目標（例如想自動發文、想學 AI 拍片），我會建議適合的堂數與報價。',
};

export const HOME_FAQS: Faq[] = [
  prep,
  noTechBackground,
  whyNotFreeAi,
  onlineClass,
  booking,
  claudeOrCodex,
  metaTokenDiff,
];

export const ONE_ON_ONE_FAQS: Faq[] = [onlineClass, groupClass, prep, noTechBackground, booking];

// 免費資源專區（/resources/）的三題。內容原本掛在 CMS 文章 free-resources 的 faqs 欄位，
// 該篇改寫成常設頁面後搬到這裡——頁面內容寫進程式碼，FAQ 資料就跟著回到 src/data/。
// 這三題只在 /resources/ 出現，沒有輸出 FAQPage schema（同一組 Q&A 已經有兩份，理由見該頁註解）。
export const RESOURCES_FAQS: Faq[] = [
  {
    question: '只靠免費資源能學會 AI 自動化嗎？',
    answer:
      '可以，影片和開源工具都是完整的，跟著做就能跑通。差別在時間：自學卡關要自己試錯，一對一教學則是有人帶著走一次。建議先用免費資源開始，真的卡住再考慮付費課程。',
  },
  {
    question: 'Tooka 是免費的嗎？',
    answer:
      '是，Tooka 完全開源免費，放在 GitHub 上。你只需要自備一個 AI Agent（Claude Code 或 Codex，訂閱每月 20 美元起）來驅動它。',
  },
  {
    question: '看影片有問題可以問你嗎？',
    answer: '可以，歡迎加 LINE 免費諮詢，或到我的 Facebook 社團發問。',
  },
];
