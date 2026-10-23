import { getCollection } from 'astro:content';
import { SERVICE_SITE } from '../consts';

// 全站搜尋索引：header 搜尋框用（標題/描述/標籤）
export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.unlisted);
  const items = posts.map((p) => ({
    t: p.data.title,
    d: p.data.description,
    g: (p.data.tags ?? []).join(' '),
    u: `/blog/${p.id}/`,
  }));
  // 服務站頁面不在 Pagefind 索引裡（Pagefind 只收主站 main），這裡補上；s=1 表示服務站頁面，
  // g 是該頁的主要關鍵字（也當同義詞用），g2 是次要關鍵字；客服搜尋依標題／g 命中 > g2／標籤 > 描述的順序排序。
  const servicePages = [
    {
      t: '手把手帶你實戰：AI 一對一教學（系統開發、網頁、動畫影片）',
      d: '三個方案：系統開發、簡單網頁、動畫影片，用 Claude Code 對話完成。雙北實體或線上一對一教學。',
      g: '課程 教學 一對一 上課 家教 預約 手把手 實戰',
      g2: '動畫 影片 HyperFrames Claude',
      u: `${SERVICE_SITE.url}/course/`,
      s: 1,
    },
    {
      t: 'AI 演講與企業內訓',
      d: '企業、學校與社群的 AI 主題演講、內訓與工作坊邀約。',
      g: '演講 講座 內訓 講師 邀約 工作坊',
      g2: '企業 學校 社群',
      u: `${SERVICE_SITE.url}/services/speaking/`,
      s: 1,
    },
    {
      t: '客製系統開發服務',
      d: '題庫與教學系統、後台管理、LINE 相關網頁與 AI 自動化流程，看合作流程與費用。',
      g: '系統開發 客製 開發 接案 報價 費用 流程',
      g2: '題庫 後台 LINE 教學系統',
      u: `${SERVICE_SITE.url}/services/development/`,
      s: 1,
    },
  ];
  return new Response(JSON.stringify([...servicePages, ...items]), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
