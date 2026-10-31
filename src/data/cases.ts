// 案例與系統類別的單一來源：/cases/、首頁與服務站首頁的「你想做什麼系統？」類別卡、
// 首頁／服務站的代表案例卡、頁首文章下拉的案例預覽卡都從這裡取。改名稱、說明、截圖、連結只改這裡。
// 規則見 AGENTS.md「開發案例頁規則」：只放真實系統截圖，偽真資料，不編案例或數字。
import { CRM_DEMO_URL, DEVELOPMENT_SERVICE, SECTION_NAMES, SITE, lineCategoryUrl } from '../consts';

export type DevCategoryKey = 'web' | 'admin' | 'app' | 'bank' | 'group' | 'ai';

export interface DevLink {
  href: string;
  label: string;
  external: boolean;
}

/** 線條 icon（24×24 viewBox 的 SVG 內容） */
const ICONS: Record<DevCategoryKey, string> = {
  web: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6"/><circle cx="9" cy="6.5" r=".6"/>',
  admin: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  app: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  bank: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
  group: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 15.5c2.8 0 6 1.5 6 4.5"/>',
  ai: '<path d="M12 3l1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z"/>',
};

const lineLink = (title: string): DevLink => ({ href: lineCategoryUrl(title), label: 'LINE 聊這個', external: true });

/** 重策桌遊揪團平台（公開網站，無隱私問題，2026-10-31 使用者指示直接連） */
export const HEAVY_BOARD_GAMES_URL = 'https://heavyboardgames.aixwang.dev/';

/**
 * 系統類別：/cases/ 篩選與首頁類別卡同一套（LIFF 屬於 APP）。
 * defaultLink 是類別卡的去處；emptyNote 是 /cases/ 該類別沒有案例時「聊聊需求」卡的說明（只寫站上既有事實）。
 */
export const DEV_CATEGORIES = [
  { key: 'web', title: '網頁', icon: ICONS.web, defaultLink: lineLink('網頁'), emptyNote: '' },
  { key: 'admin', title: '後台管理系統', icon: ICONS.admin, defaultLink: lineLink('後台管理系統'), emptyNote: '' },
  { key: 'app', title: 'APP', icon: ICONS.app, defaultLink: lineLink('APP'), emptyNote: '' },
  { key: 'bank', title: '題庫管理系統', icon: ICONS.bank, defaultLink: { href: DEVELOPMENT_SERVICE.demoUrl, label: '試用 Demo', external: true }, emptyNote: '' },
  { key: 'group', title: '社群平台', icon: ICONS.group, defaultLink: { href: HEAVY_BOARD_GAMES_URL, label: '看實際網站', external: true }, emptyNote: '' },
  {
    key: 'ai',
    title: 'AI 應用',
    icon: ICONS.ai,
    // 用完整網址，服務站的類別卡才會連回主站
    defaultLink: { href: `${SITE.url}/cases/?tag=${encodeURIComponent('AI 應用')}`, label: `看 AI ${SECTION_NAMES.cases}`, external: false },
    emptyNote: '',
  },
] as const satisfies readonly { key: DevCategoryKey; title: string; icon: string; defaultLink: DevLink; emptyNote: string }[];

export const devCategoryTitle = (key: DevCategoryKey): string =>
  DEV_CATEGORIES.find((item) => item.key === key)?.title ?? key;

/**
 * 功能標籤共用清單：一律用通用的系統功能名稱，讓不同產業看得懂，不用案例專屬用語。
 * 正例：客戶管理、權限管理、LINE 串接；反例→改法：背誦紀錄→統計報表、考卷匯入→檔案匯入、出卷→檔案匯出、對照原卷審核→資料審核。
 * 卡片引用 key，同一功能跨卡用同一名稱。
 */
export const FEATURE_TAGS = {
  customer: '客戶管理',
  member: '會員管理',
  permission: '權限管理',
  line: 'LINE 串接',
  liff: 'LIFF',
  report: '統計報表',
  fileImport: '檔案匯入',
  fileExport: '檔案匯出',
  review: '資料審核',
  contentGen: '內容產生',
  checkin: '會員簽到',
  push: '訊息推播',
  backup: '資料備份',
  event: '活動報名',
  eventAdmin: '活動管理',
  message: '站內訊息',
  content: '內容管理',
  auditLog: '操作紀錄',
  dashboard: '儀表板',
  issueReport: '問題回報',
  emailQueue: '郵件通知',
  browse: '內容瀏覽',
  followUp: '進度追蹤',
  favorites: '收藏清單',
  search: '站內搜尋',
  filter: '分類篩選',
} as const;
export type FeatureTagKey = keyof typeof FEATURE_TAGS;

export interface CaseImage {
  /** 16:10 截圖（1440×900，webp） */
  src: string;
  alt: string;
  featureTag: FeatureTagKey;
}

export interface DevCase {
  key: string;
  title: string;
  /** /cases/ 卡片的一句說明 */
  summary: string;
  /** 首頁、服務站、頁首下拉等較短處用的說明 */
  summaryShort: string;
  /** 所屬系統類別，可多選（篩選任一類別都會出現） */
  categories: DevCategoryKey[];
  /**
   * 截圖（輪播用）：每張一個通用功能標籤 featureTag。後台系統側欄主要功能頁各一張，前台主要功能頁各一張。
   * 卡片下方的功能標籤由各圖 featureTag 去重後取前 4 個產生（見 caseFeatureTags），確保標籤都對得上圖。
   */
  images: CaseImage[];
  link: DevLink;
  /** 首頁／服務站代表案例 */
  featured?: boolean;
}

/** 多個案例共用的截圖（同一張圖可同時放在題庫卡與 AI 卡的輪播，只定義一次） */
const SHARED_IMAGES = {
  questionList: { src: '/images/cases/math_question_bank/01-question-list.webp', alt: '數學題庫系統題目列表：難易度、單元標籤與審核啟用', featureTag: 'content' },
  examImport: { src: '/images/cases/math_question_bank/02-exam-import.webp', alt: '數學題庫系統考卷匯入：上傳考卷後由 AI 拆題', featureTag: 'fileImport' },
  aiQuestion: { src: '/images/cases/math_question_bank/03-ai-question.webp', alt: '數學題庫系統 AI 出題：挑範本題產生類似題', featureTag: 'contentGen' },
  aiExplanation: { src: '/images/cases/math_question_bank/04-ai-explanation.webp', alt: '數學題庫系統 AI 詳解：產生答案與解題步驟', featureTag: 'contentGen' },
  aiTutor: { src: '/images/cases/math_question_bank/05-ai-tutor.webp', alt: '數學題庫系統 AI 助教：逐步引導學生解題', featureTag: 'contentGen' },
  categoryTags: { src: '/images/cases/math_question_bank/06-category-tags.webp', alt: '數學題庫系統分類標籤管理', featureTag: 'filter' },
  examList: { src: '/images/cases/math_question_bank/07-exam-list.webp', alt: '數學題庫系統考卷列表', featureTag: 'content' },
  examCompose: { src: '/images/cases/math_question_bank/08-exam-compose.webp', alt: '數學題庫系統考卷出題：預覽與匯出', featureTag: 'fileExport' },
  studentGroups: { src: '/images/cases/math_question_bank/09-student-groups.webp', alt: '數學題庫系統班級群組與邀請碼', featureTag: 'member' },
  studentAccounts: { src: '/images/cases/math_question_bank/10-student-accounts.webp', alt: '數學題庫系統學生帳號管理', featureTag: 'member' },
  uploadRecords: { src: '/images/cases/math_question_bank/11-upload-records.webp', alt: '數學題庫系統學生上傳紀錄審核', featureTag: 'review' },
  weeklyRanking: { src: '/images/cases/math_question_bank/12-weekly-ranking.webp', alt: '數學題庫系統每週排行', featureTag: 'report' },
  photoResult: { src: '/images/cases/ai_image_recognition/01-photo-result.webp', alt: 'AI 影像辨識：手機拍照考卷辨識結果', featureTag: 'fileImport' },
  docxResult: { src: '/images/cases/ai_image_recognition/02-docx-result.webp', alt: 'AI 影像辨識：Word 考卷辨識結果', featureTag: 'fileImport' },
  pickTemplates: { src: '/images/cases/ai_question_generation/01-pick-templates.webp', alt: 'AI 出題：選擇範本題', featureTag: 'contentGen' },
  genSettings: { src: '/images/cases/ai_question_generation/02-settings.webp', alt: 'AI 出題：設定單元與難度', featureTag: 'contentGen' },
  reviewResults: { src: '/images/cases/ai_question_generation/03-review-results.webp', alt: 'AI 出題：審核 AI 產生的題目', featureTag: 'review' },
  singleExplanation: { src: '/images/cases/ai_explanation/01-single-explanation.webp', alt: 'AI 詳解：單題詳解', featureTag: 'contentGen' },
  batchExplanations: { src: '/images/cases/ai_explanation/02-batch-explanations.webp', alt: 'AI 詳解：多題批次詳解', featureTag: 'contentGen' },
} satisfies Record<string, CaseImage>;

const demoLink: DevLink = { href: DEVELOPMENT_SERVICE.demoUrl, label: '試用 Demo', external: true };

export const DEV_CASES: DevCase[] = [
  {
    key: 'math_question_bank',
    title: '數學題庫系統',
    summary: '補習班數學老師用來把考卷收進題庫、出卷，AI 辨識考卷、產生詳解。',
    summaryShort: '補習班數學老師用來把考卷收進題庫、出卷。',
    categories: ['bank', 'admin', 'ai'],
    images: [
      SHARED_IMAGES.questionList,
      SHARED_IMAGES.examImport,
      SHARED_IMAGES.aiQuestion,
      SHARED_IMAGES.aiExplanation,
      SHARED_IMAGES.aiTutor,
      SHARED_IMAGES.categoryTags,
      SHARED_IMAGES.examList,
      SHARED_IMAGES.examCompose,
      SHARED_IMAGES.studentGroups,
      SHARED_IMAGES.studentAccounts,
      SHARED_IMAGES.uploadRecords,
      SHARED_IMAGES.weeklyRanking,
      SHARED_IMAGES.photoResult,
      SHARED_IMAGES.docxResult,
      SHARED_IMAGES.pickTemplates,
      SHARED_IMAGES.genSettings,
      SHARED_IMAGES.reviewResults,
      SHARED_IMAGES.singleExplanation,
      SHARED_IMAGES.batchExplanations,
    ],
    link: demoLink,
    featured: true,
  },
  {
    key: 'crm',
    title: 'CRM 客戶管理系統',
    summary: '業務團隊管理客戶名單、來源管道與承辦人，網站表單和官方 LINE 進來的客戶集中在同一份清單。',
    summaryShort: '業務團隊集中管理客戶名單、來源管道與承辦人。',
    categories: ['admin'],
    images: [
      { src: '/images/cases/crm-dashboard.webp', alt: 'CRM 客戶管理系統儀表板：待處理、有效客、追蹤中與各網站進線（示範資料）', featureTag: 'dashboard' },
      { src: '/images/cases/crm-leads.webp', alt: 'CRM 客戶管理系統網路進線列表：網站表單與 LINE 進來的客戶（示範資料，個資已馬賽克）', featureTag: 'customer' },
      { src: '/images/cases/crm-valid.webp', alt: 'CRM 客戶管理系統有效客列表（示範資料，個資已馬賽克）', featureTag: 'customer' },
      { src: '/images/cases/crm-followup.webp', alt: 'CRM 客戶管理系統追蹤紀錄：每次聯繫的方式與內容（示範資料）', featureTag: 'followUp' },
      { src: '/images/cases/crm-chat.webp', alt: 'CRM 客戶管理系統聊天室：與 LINE 客戶的對話（示範資料）', featureTag: 'line' },
    ],
    link: { href: CRM_DEMO_URL, label: '試用 Demo', external: true },
  },
  {
    key: 'line_liff_app',
    title: 'LINE LIFF 學習輔助 APP',
    summary: '在 LINE 裡開啟的經典跟讀與背書練習：依段落背誦、調整字級、加入書櫃，每日簽到收集籤卡。',
    summaryShort: '在 LINE 裡跟讀、背書練習，記錄背誦進度。',
    categories: ['app'],
    images: [
      { src: '/images/cases/liff-app-home.webp', alt: `LINE LIFF 學習輔助 APP 主選單：簽到月曆、連續登入天數與功能入口（示範帳號）`, featureTag: 'checkin' },
      { src: '/images/cases/liff-app-classics.webp', alt: `LINE LIFF 學習輔助 APP 藏經閣：依分類瀏覽經典`, featureTag: 'browse' },
      { src: '/images/cases/liff-app-practice.webp', alt: `LINE LIFF 學習輔助 APP 背書頁：經文逐段顯示，可調整字級`, featureTag: 'browse' },
      { src: '/images/cases/liff-app-bookshelf.webp', alt: `LINE LIFF 學習輔助 APP 我的書櫃：收藏的經典與進度`, featureTag: 'favorites' },
    ],
    link: { href: lineCategoryUrl('APP'), label: 'LINE 聊聊需求', external: true },
  },
  {
    key: 'line_liff_admin',
    title: 'LINE LIFF 學習輔助後台',
    summary: '管理經典內容與會員，查看每位會員的背誦次數、背過段數，並從後台發 LINE 推播。',
    summaryShort: '管理經典與會員、看背誦統計、發 LINE 推播。',
    categories: ['admin'],
    images: [
      { src: '/images/cases/liff-admin-classics.webp', alt: `LINE LIFF 學習輔助後台：經典書籍管理`, featureTag: 'content' },
      { src: '/images/cases/liff-admin-users.webp', alt: `LINE LIFF 學習輔助後台：用戶列表與 LINE 綁定（示範資料）`, featureTag: 'member' },
      { src: '/images/cases/liff-admin-sessions.webp', alt: `LINE LIFF 學習輔助後台：練習場次與使用時間（示範資料）`, featureTag: 'report' },
      { src: '/images/cases/liff-admin-stats.webp', alt: `LINE LIFF 學習輔助後台：每位會員的背誦統計（示範資料）`, featureTag: 'report' },
      { src: '/images/cases/liff-admin-bookshelf-log.webp', alt: `LINE LIFF 學習輔助後台：用戶加入書櫃的操作紀錄（示範資料）`, featureTag: 'auditLog' },
      { src: '/images/cases/liff-admin-push-log.webp', alt: `LINE LIFF 學習輔助後台：LINE 推播歷史（示範資料）`, featureTag: 'push' },
    ],
    link: { href: lineCategoryUrl('後台管理系統'), label: 'LINE 聊聊需求', external: true },
  },
  // 以下三張是題庫系統裡的 AI 功能，畫面取自 Demo 站（Demo 的 AI 結果為事先寫好的模擬內容）
  {
    key: 'ai_image_recognition',
    title: 'AI 影像辨識',
    summary: '上傳手機拍的考卷照片，AI 把題目拆成一題一題，左邊對照原卷審核。',
    summaryShort: '上傳考卷照片，AI 拆成一題一題，老師對照原卷審核。',
    categories: ['ai'],
    images: [
      SHARED_IMAGES.photoResult,
      SHARED_IMAGES.docxResult,
      SHARED_IMAGES.examImport,
    ],
    link: demoLink,
  },
  {
    key: 'ai_question_generation',
    title: 'AI 內容生成與驗證',
    summary: '以數學題為例：AI 產生題目與詳解，也能讓 AI 重解一次驗證答案與步驟（依需求開啟）；AI 出題可先在 Demo 體驗。',
    summaryShort: '以數學題為例：AI 產生題目與詳解，可依需求加入 AI 驗算。',
    categories: ['ai'],
    images: [
      SHARED_IMAGES.pickTemplates,
      SHARED_IMAGES.genSettings,
      SHARED_IMAGES.reviewResults,
      SHARED_IMAGES.singleExplanation,
      SHARED_IMAGES.batchExplanations,
      SHARED_IMAGES.aiExplanation,
    ],
    link: demoLink,
  },
  {
    key: 'heavy_board_games',
    title: '重策桌遊揪團平台',
    summary: '重度策略桌遊玩家找桌遊、找牌友、開團跟團的社群網站。',
    summaryShort: '桌遊玩家找牌友、開團跟團的社群網站。',
    categories: ['group'],
    images: [
      { src: '/images/cases/hbg-front-events.webp', alt: `重策桌遊揪團平台的揪團列表：每團的桌遊、地點、報名人數與費用（他人名稱與頭像已替換）`, featureTag: 'event' },
      { src: '/images/cases/hbg-front-games.webp', alt: `重策桌遊揪團平台的桌遊清單：依熱門度瀏覽、收藏、開團`, featureTag: 'browse' },
    ],
    link: { href: HEAVY_BOARD_GAMES_URL, label: '看實際網站', external: true },
  },
  {
    key: 'heavy_board_games_admin',
    title: '重策桌遊揪團後台',
    summary: '站務管理會員、揪團活動與桌遊資料，處理未到回報，查看郵件佇列與管理紀錄。',
    summaryShort: '管理會員、揪團活動與桌遊資料。',
    categories: ['admin'],
    images: [
      { src: '/images/cases/hbg-admin-dashboard.webp', alt: `重策桌遊揪團後台主控台：會員數、待辦中心與系統健康`, featureTag: 'dashboard' },
      { src: '/images/cases/hbg-admin-users.webp', alt: `重策桌遊揪團後台會員清單（示範資料）`, featureTag: 'member' },
      { src: '/images/cases/hbg-admin-events.webp', alt: `重策桌遊揪團後台活動清單（示範資料）`, featureTag: 'eventAdmin' },
      { src: '/images/cases/hbg-admin-reports.webp', alt: `重策桌遊揪團後台未到回報（示範資料）`, featureTag: 'issueReport' },
      { src: '/images/cases/hbg-admin-games.webp', alt: `重策桌遊揪團後台桌遊資料管理`, featureTag: 'content' },
      { src: '/images/cases/hbg-admin-outbox.webp', alt: `重策桌遊揪團後台郵件佇列（示範資料）`, featureTag: 'emailQueue' },
      { src: '/images/cases/hbg-admin-audits.webp', alt: `重策桌遊揪團後台管理紀錄`, featureTag: 'auditLog' },
    ],
    link: { href: lineCategoryUrl('後台管理系統'), label: 'LINE 聊聊需求', external: true },
  },
  // 網頁類別（本站官網）固定排最後（2026-10-31 使用者指示）
  {
    key: 'aixwang_site',
    title: `${SITE.title}官網`,
    summary: '本站：文章、站內搜尋、案例頁依類別篩選，並把系統開發與教學服務分流到服務站。',
    summaryShort: '本站：文章、站內搜尋、案例頁與服務站分流。',
    categories: ['web'],
    images: [
      { src: '/images/cases/site-home.webp', alt: `${SITE.title}官網首頁：站內搜尋、案例輪播與「你想做什麼系統？」類別卡`, featureTag: 'search' },
      { src: '/images/cases/site-cases.webp', alt: `${SITE.title}官網案例頁：依系統類別篩選案例`, featureTag: 'filter' },
      { src: '/images/cases/site-blog.webp', alt: `${SITE.title}官網部落格：置頂案例文章與精選文章`, featureTag: 'browse' },
      { src: '/images/cases/site-resources.webp', alt: `${SITE.title}官網免費資源頁：安裝教學與開源工具`, featureTag: 'browse' },
    ],
    link: { href: `${SITE.url}/`, label: '看實際網站', external: false },
  },
];

/** 卡片下方的功能標籤：各圖 featureTag 去重後取前幾個（類別徽章＋功能標籤合計約 5 個，320 寬也不超出兩行） */
export const caseFeatureTags = (item: DevCase): FeatureTagKey[] =>
  [...new Set(item.images.map((image) => image.featureTag))].slice(0, Math.max(2, Math.min(4, 5 - item.categories.length)));

/** 首頁首屏自動輪播：所有案例的截圖（同一張圖只出現一次），標系統名＋功能標籤，點擊連到該案例類別篩選後的案例頁 */
export const heroCarouselSlides = () => {
  const seen = new Set<string>();
  return DEV_CASES.flatMap((item) =>
    item.images.map((image) => ({
      src: image.src,
      alt: image.alt,
      label: `${item.title}・${FEATURE_TAGS[image.featureTag]}`,
      href: `/cases/?tag=${encodeURIComponent(devCategoryTitle(item.categories[0]))}`,
      group: item.key,
      featureKey: image.featureTag,
      featureLabel: FEATURE_TAGS[image.featureTag],
      caseTitle: item.title,
    })),
  ).filter((slide) => (seen.has(slide.src) ? false : (seen.add(slide.src), true)));
};

export const FEATURED_CASE = DEV_CASES.find((item) => item.featured) ?? DEV_CASES[0];
