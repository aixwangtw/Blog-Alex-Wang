<claude-mem-context>
# Memory Context

# [AI Beginner Course] recent context, 2026-05-18 8:00am GMT+8

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 20 obs (3,316t read) | 512,869t work | 99% savings

### May 17, 2026
710 9:24p 🔵 AI Beginner Course 圖片素材與 Gallery 區結構
711 " 🟣 Gallery 區素材整合：4 張真實講課照片取代佔位框
712 " 🟣 Gallery 區 JSX 改為真實 &lt;img&gt; 渲染，完成圖片整合
713 9:26p 🔵 AI Beginner Course Vite Dev Server Port Conflict
714 9:27p 🟣 講課照片區整合 public/images 實際素材
715 9:30p ✅ 講課照片區縮減為 3 張並調整 Grid 佈局
716 " ✅ 講課照片區圖片顯示模式從 object-cover 改為 object-contain
717 9:31p 🔵 Vite Dev Server 端口不穩定，每次啟動可能不同
718 " ✅ 照片區佈局調整完成並提交，圖片檔案首次加入 Git 版控
719 " 🟣 新手學AI課程第一堂.png 移至講師介紹區作為背景圖
S329 調整照片區佈局：移除白襯衫、改用 object-contain 完整顯示圖片 (May 17, 9:31 PM)
S332 按照導覽列順序重新排列 Section 並統一標題 — 用戶設立「不自動提交」規則 (May 17, 9:32 PM)
720 9:34p 🔄 AI Beginner Course 講師照片區重構
721 11:20p ✅ 導覽列結構重新設計：精簡連結並重命名
722 " ✅ 內文 Section 標題更新對齊導覽列文字
723 " 🔵 Section DOM 排列順序確認：與導覽列不一致
S333 建立「不自動提交」規則並持久化至專案記憶 — AI Beginner Course (May 17, 11:21 PM)
S331 按照導覽列順序重新排列 Section 並統一標題文字 — AI Beginner Course 專案 (May 17, 11:21 PM)
724 11:24p 🟣 講課照片 Section 改名為「講課紀錄」並重新定位
725 11:27p 🟣 gallery section 改名「講課紀錄」並改為雙欄固定高度佈局
726 11:28p 🟣 #gallery section 移至 #instructor 下方
727 " 🔵 Gallery section 移位腳本放置位置有誤 — 仍在 videos 之後
S334 講課照片改名「講課紀錄」、移至講師介紹下方、改雙欄佈局 — AI Beginner Course (May 17, 11:28 PM)
728 11:31p 🔴 修正 gallery 合併腳本：改用深度追蹤定位 instructor section 結尾
729 11:32p 🔵 第三次腳本仍失敗：gallery 原始內容（未改名版）被插入，JSX 結構損壞

Access 513k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## Git 提交規則（必須遵守）

- 不得自動提交；只有使用者明確要求提交時才能執行 `git commit`。
- 本專案所有 Git 提交的標題與詳細內文一律使用繁體中文。
- 功能性變更必須撰寫詳細提交內文，說明改了什麼、為什麼修改，以及重要影響。
- 只加入本次任務相關檔案，不得使用 `git add .`，也不得混入其他未完成草稿或無關變更。

## 手機首屏響應式規則（必須遵守）

- 所有頁面的手機首屏（Hero）在任何常見手機寬度與高度下都不得被裁切、遮住或產生橫向溢出；包含 Threads、Instagram、LINE 等 App 內建瀏覽器。
- 不得用固定高度搭配 `overflow: hidden` 截斷標題、內文、圖片、按鈕或其他首屏內容；內容較多時必須讓區塊自然增高或改成適合手機的排列。
- 首屏標題與內文必須能完整換行，圖片須使用響應式尺寸並保持比例；主要 CTA 必須完整顯示且可點擊，不得超出 viewport 或被固定導覽列、瀏覽器工具列與 safe area 蓋住。
- 修改頁面或首屏後，至少驗收 320、360、375、390、412、430 px 寬度，並同時檢查矮螢幕與直向模式；確認沒有水平捲軸、文字截斷、元素重疊或上下裁切後才算完成。

## 新文章橫幅工作流（必須遵守）

- 新增或發布 Directus 文章時，必須先閱讀並執行 `docs/blog-banner-workflow.md`。
- 每篇已發布文章都必須有 `public/images/blog/<slug>.png`，尺寸固定為 1200×630。
- 新文章優先用 `npm run generate:banners` 自動生成草稿（文案可在 `tools/banner-copy.json`
  逐篇指定），再由人工修圖定稿覆蓋同名 PNG。
- 橫幅使用 `src/assets/blog-banner/background.png` 作為鎖定底圖，人物只能使用
  `src/assets/blog-banner/instructor-transparent.png` 原圖合成（只等比縮放直接貼上）。
  禁止用生圖模型重畫人物。
- 生圖模型只能用於無文字、無人物的背景素材；標題、標籤、數字、圖案與卡片必須用程式排版，
  避免中文錯字、人物失真與尺寸不一致。
- 版型以 `public/images/blog/threads-api-tutorial.png` 和
  `public/images/blog/instagram-api-tutorial.png` 為主要參考。
- `slug`、圖片檔名與文章網址必須完全相同。完成後執行 `npm run check:banners` 和 `npm run build`。
- 每次文章正式發布並確認網址可開啟後，必須將正式封面 PNG 下載到 Windows 的
  `C:\Users\js098\Downloads\`，並把圖片本身複製到 Windows 剪貼簿，方便直接貼到社群。
- 不得恢復 build-time `/og/<slug>.png` 動態生圖路由；正式圖片來源固定為
  `/images/blog/<slug>.png` 靜態檔（satori 只能作為 `generate:banners` 本機草稿工具使用）。
- 頁面／演講／全站分享圖必須遵守版型安全區與版本號工作流
  （見 `docs/blog-banner-workflow.md` 的「頁面／演講／全站分享圖」章節）：
  無卡片、主標單行大字自動縮放、副標小字，全部內容集中中央 4:3（x=180–1020）；
  人物 x=585 與講師卡 x=800 位置已定案不得調整；
  改版時 `src/data/banner-version.json` 版本號 +1 再重跑生成器。
