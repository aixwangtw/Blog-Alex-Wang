// 案例與系統類別的單一來源：/cases/、首頁與服務站首頁的「你想做什麼系統？」類別卡、
// 首頁／服務站的代表案例卡、頁首文章下拉的案例預覽卡都從這裡取。改名稱、說明、截圖、連結只改這裡。
// 規則見 AGENTS.md「開發案例頁規則」：只放真實系統截圖，偽真資料，不編案例或數字。
import { DEVELOPMENT_SERVICE, SECTION_NAMES, SITE, lineCategoryUrl } from '../consts';

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
  search: '站內搜尋',
  filter: '分類篩選',
} as const;
export type FeatureTagKey = keyof typeof FEATURE_TAGS;

export interface DevCase {
  key: string;
  title: string;
  /** /cases/ 卡片的一句說明 */
  summary: string;
  /** 首頁、服務站、頁首下拉等較短處用的說明 */
  summaryShort: string;
  /** 所屬系統類別，可多選（篩選任一類別都會出現） */
  categories: DevCategoryKey[];
  /** 功能標籤：只寫功能或系統特性（要能在程式或畫面找到），不寫技術框架或客群；只顯示，不篩選 */
  tags: FeatureTagKey[];
  /** 16:10 截圖（1440×900） */
  image: string;
  imageAlt: string;
  link: DevLink;
  /** 首頁／服務站代表案例 */
  featured?: boolean;
}

const demoLink: DevLink = { href: DEVELOPMENT_SERVICE.demoUrl, label: '試用 Demo', external: true };

export const DEV_CASES: DevCase[] = [
  {
    key: 'math_question_bank',
    title: '數學題庫系統',
    summary: '補習班數學老師用來把考卷收進題庫、出卷，AI 辨識考卷、產生詳解。',
    summaryShort: '補習班數學老師用來把考卷收進題庫、出卷。',
    categories: ['bank', 'admin'],
    tags: ['fileImport', 'fileExport', 'review'],
    image: '/images/cases/math-question-bank.webp',
    imageAlt: '數學題庫系統 Demo 站的題目管理頁：題目列表、難易度與單元標籤、審核與啟用開關',
    link: demoLink,
    featured: true,
  },
  {
    key: 'crm',
    title: 'CRM 客戶管理系統',
    summary: '業務團隊管理客戶名單、來源管道與承辦人，網站表單和官方 LINE 進來的客戶集中在同一份清單。',
    summaryShort: '業務團隊集中管理客戶名單、來源管道與承辦人。',
    categories: ['admin'],
    tags: ['customer', 'permission', 'line'],
    image: '/images/cases/crm.webp',
    imageAlt: 'CRM 客戶管理系統的客戶清單（含側邊選單）：客戶數統計、來源管道、承辦業務與諮詢項目（示範資料，姓名已遮罩）',
    link: { href: lineCategoryUrl('後台管理系統'), label: 'LINE 聊聊需求', external: true },
  },
  {
    key: 'line_liff_app',
    title: 'LINE LIFF 學習輔助 APP',
    summary: '在 LINE 裡開啟的經典跟讀與背書練習：依段落背誦、調整字級、加入書櫃，每日簽到收集籤卡。',
    summaryShort: '在 LINE 裡跟讀、背書練習，記錄背誦進度。',
    categories: ['app'],
    tags: ['liff', 'report', 'checkin'],
    image: '/images/cases/line-liff-app.webp',
    imageAlt: 'LINE LIFF 學習輔助 APP 的使用者畫面：左邊是主選單，右邊是經典逐段背誦頁（示範帳號）',
    link: { href: lineCategoryUrl('APP'), label: 'LINE 聊聊需求', external: true },
  },
  {
    key: 'line_liff_admin',
    title: 'LINE LIFF 學習輔助後台',
    summary: '管理經典內容與會員，查看每位會員的背誦次數、背過段數，並從後台發 LINE 推播。',
    summaryShort: '管理經典與會員、看背誦統計、發 LINE 推播。',
    categories: ['admin'],
    tags: ['member', 'report', 'push', 'backup'],
    image: '/images/cases/line-liff-admin.webp',
    imageAlt: 'LINE LIFF 學習輔助後台的背誦統計：每位會員的經典、背誦次數、背過段數與最近背誦時間（示範資料）',
    link: { href: lineCategoryUrl('後台管理系統'), label: 'LINE 聊聊需求', external: true },
  },
  // 以下三張是題庫系統裡的 AI 功能，畫面取自 Demo 站（Demo 的 AI 結果為事先寫好的模擬內容）
  {
    key: 'ai_image_recognition',
    title: 'AI 影像辨識',
    summary: '上傳手機拍的考卷照片，AI 把題目拆成一題一題，左邊對照原卷審核。',
    summaryShort: '上傳考卷照片，AI 拆成一題一題，老師對照原卷審核。',
    categories: ['ai'],
    tags: ['fileImport', 'review'],
    image: '/images/cases/ai-image-recognition.webp',
    imageAlt: '題庫系統 Demo 的考卷匯入結果：左邊是手機拍的考卷照片，右邊是 AI 辨識出的題目',
    link: demoLink,
  },
  {
    key: 'ai_question_generation',
    title: 'AI 出題',
    summary: '從題庫挑範本題，AI 照出法產生類似題。Demo 可以先體驗，正式導入時依需求開發。',
    summaryShort: 'AI 出題可以先在 Demo 體驗，正式導入時依需求開發。',
    categories: ['ai'],
    tags: ['contentGen', 'review'],
    image: '/images/cases/ai-question-generation.webp',
    imageAlt: '題庫系統 Demo 的 AI 出題頁：選範本、設定、產生與審核三個步驟',
    link: demoLink,
  },
  {
    key: 'ai_explanation',
    title: 'AI 詳解',
    summary: '按一下替題目寫出答案、解題步驟與核心觀念，老師審閱後再收進題庫。',
    summaryShort: 'AI 產生詳解，老師確認後才收進題庫。',
    categories: ['ai'],
    tags: ['contentGen', 'review'],
    image: '/images/cases/ai-explanation.webp',
    imageAlt: '題庫系統 Demo 的 AI 詳解頁：一元二次方程式題目下方顯示答案、解題步驟與核心觀念',
    link: demoLink,
  },
  {
    key: 'heavy_board_games',
    title: '重策桌遊揪團平台',
    summary: '重度策略桌遊玩家找桌遊、找牌友、開團跟團的社群網站。',
    summaryShort: '桌遊玩家找牌友、開團跟團的社群網站。',
    categories: ['group'],
    tags: ['event', 'message'],
    image: '/images/cases/heavy-board-games.webp',
    imageAlt: '重策桌遊揪團平台的揪團列表：每團的桌遊、地點、報名人數與費用（他人名稱與頭像已替換）',
    link: { href: HEAVY_BOARD_GAMES_URL, label: '看實際網站', external: true },
  },
  {
    key: 'heavy_board_games_admin',
    title: '重策桌遊揪團後台',
    summary: '站務管理會員、揪團活動與桌遊資料，處理未到回報，查看郵件佇列與管理紀錄。',
    summaryShort: '管理會員、揪團活動與桌遊資料。',
    categories: ['admin'],
    tags: ['member', 'eventAdmin', 'content', 'auditLog'],
    image: '/images/cases/heavy-board-games-admin.webp',
    imageAlt: '重策桌遊揪團後台的活動清單（含側邊選單）：標題、團主、遊戲、狀態、城市與建立時間（示範資料，姓名已遮罩）',
    link: { href: lineCategoryUrl('後台管理系統'), label: 'LINE 聊聊需求', external: true },
  },
  // 網頁類別（本站官網）固定排最後（2026-10-31 使用者指示）
  {
    key: 'aixwang_site',
    title: `${SITE.title}官網`,
    summary: '本站：文章、站內搜尋、案例頁依類別篩選，並把系統開發與教學服務分流到服務站。',
    summaryShort: '本站：文章、站內搜尋、案例頁與服務站分流。',
    categories: ['web'],
    tags: ['search', 'filter', 'content'],
    image: '/images/cases/aixwang-site.webp',
    imageAlt: `${SITE.title}官網首頁：「你想做什麼系統？」六個類別卡`,
    link: { href: `${SITE.url}/`, label: '看實際網站', external: false },
  },
];

export const FEATURED_CASE = DEV_CASES.find((item) => item.featured) ?? DEV_CASES[0];
