// 講師經歷單一來源：關於頁經歷卡（cards）、給 AI 讀的 .md（text）都從這裡取。
// 數字與單位只寫既有事實，不得加新宣稱。
import { COMMUNITY_URLS, COURSE_SERVICE_URL, SPEAKING_SERVICE_URL } from '../consts';

export interface ExperienceItem {
  key: string;
  /** 經歷卡標題（短） */
  title: string;
  /** 一句說明（經歷卡與 .md 共用） */
  text: string;
  href?: string;
  linkLabel?: string;
  /** 連結另開新分頁 */
  external?: boolean;
  /** 24×24 線條 SVG 內容 */
  icon: string;
  /** 系統開發那條併在關於頁首段介紹，不做成卡 */
  card: boolean;
}

export const EXPERIENCE: ExperienceItem[] = [
  {
    key: 'development',
    title: '系統開發',
    text: '系統開發工程師：目前全職接案，和開發夥伴承接客製系統開發，做過題庫、CRM、LINE LIFF、社群平台等系統。',
    icon: '<path d="m8 8-5 4 5 4"/><path d="m16 8 5 4-5 4"/><path d="m14 5-4 14"/>',
    card: false,
  },
  {
    key: 'community',
    title: '社群版主',
    text: '21 萬人 OpenClaw 中文社群版主。',
    href: COMMUNITY_URLS.openclaw,
    linkLabel: '看社團',
    external: true,
    icon: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 15.5c2.8 0 6 1.5 6 4.5"/>',
    card: true,
  },
  {
    key: 'speaking',
    title: '演講',
    text: 'MixerBox 等單位講座授課經驗。',
    href: SPEAKING_SERVICE_URL,
    linkLabel: '看演講邀約',
    icon: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    card: true,
  },
  {
    key: 'teaching',
    title: '教學',
    text: '6 次一對一 AI 教學經驗（雙北實體）。',
    href: COURSE_SERVICE_URL,
    linkLabel: '看一對一教學',
    icon: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    card: true,
  },
];

export const EXPERIENCE_CARDS = EXPERIENCE.filter((item) => item.card);
