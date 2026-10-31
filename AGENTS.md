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

## 通用規則（必須遵守，2026-10-31 起）

- 需要同步修改的內容（文字、網址、數值、樣式、元件）出現兩處以上，一律抽共用（常數、資料檔、CSS 變數或元件）；改動前先搜尋所有出現處；無法抽共用的（如 CMS 文章內文）列入手動同步清單。
- 手動同步清單：付款條件（`PAYMENT_TERMS`）改動時，CMS 文章 `custom-system-development-demo`（id 30，內文兩處＋FAQ「系統開發的費用怎麼算？可以分期嗎？」）與 `math-teacher-question-bank`（id 27，內文三處）要手動同步。

## LINE 入口規則（必須遵守）

- 舊規則「LINE 入口只留右下角與服務站頁首」已於 2026-10-31 作廢。
- 主站首頁 Hero 與結尾、服務站頁首、系統開發服務頁 Hero 的「聊聊需求」LINE 入口是使用者明確要求，不得移除。
- 2026-10-31 更新：按鈕不再用 LINE 綠色，改用站上一般主按鈕色（var(--color-accent)）；「服務」下拉裡的 LINE 免費諮詢入口已移除，不要加回。
- 導覽（主站與服務站）都要有「開源」（`SECTION_NAMES.openSource`），連 /resources/。
- 首頁、服務頁、CTA 附近要寫「聊完需求可以先提供試用 Demo」。

## Git 提交規則（必須遵守）

- 不得自動提交；只有使用者明確要求提交時才能執行 `git commit`。
- 本專案所有 Git 提交的標題與詳細內文一律使用繁體中文。
- 功能性變更必須撰寫詳細提交內文，說明改了什麼、為什麼修改，以及重要影響。
- 只加入本次任務相關檔案，不得使用 `git add .`，也不得混入其他未完成草稿或無關變更。
- 使用者要求「推送」時，一律直接提交並推送到 `main`；不得建立功能分支，也不得建立草稿或一般 Pull Request，除非使用者當次明確要求。

## 手機首屏響應式規則（必須遵守）

- 所有頁面的手機首屏（Hero）在任何常見手機寬度與高度下都不得被裁切、遮住或產生橫向溢出；包含 Threads、Instagram、LINE 等 App 內建瀏覽器。
- 不得用固定高度搭配 `overflow: hidden` 截斷標題、內文、圖片、按鈕或其他首屏內容；內容較多時必須讓區塊自然增高或改成適合手機的排列。
- 首屏標題與內文必須能完整換行，圖片須使用響應式尺寸並保持比例；主要 CTA 必須完整顯示且可點擊，不得超出 viewport 或被固定導覽列、瀏覽器工具列與 safe area 蓋住。
- 修改頁面或首屏後，至少驗收 320、360、375、390、412、430 px 寬度，並同時檢查矮螢幕與直向模式；確認沒有水平捲軸、文字截斷、元素重疊或上下裁切後才算完成。

## UI／UX 固定參考網站（必須遵守）

- 每次規劃或修改本站與服務站的 UI／UX，先重新查看以下四個網站當下的桌機版與手機版；網站會改版，不得只靠過往截圖或記憶。
- DR.DEAN：`https://deanlife.blog/`，重點參考內容站、教學站、服務站之間的跨站資訊架構、品牌層級、導覽與頁尾互連。各子站維持自己的首頁與 Logo，再以清楚的品牌入口互相導流。
- 凱文設計／創作邦：`https://www.creatorhome.tw/`（凱文設計入口：`https://kevinlearn.com/`），重點參考資源雷達、可掃讀的分類入口、搜尋、卡片資訊層級與創作者資源導流。
- AKSEO Labs：`https://akseolabs.com/`，重點參考 SEO 資訊架構、服務優先順序、主題集群、內部連結、證據／來源呈現及免費工具入口。
- 梁文宣《自由宣言》：`https://freeshiuan.com/`（合作服務：`https://freeshiuan.com/business/`），重點參考服務案例如何直接呈現客戶背景、問題、執行前後差異、量化成果與佐證圖片。
- 參考時必須分析資訊層級、主要／次要操作、跨站返回方式、搜尋、狀態回饋、響應式與無障礙；不得只模仿視覺，也不得直接照抄任一網站。
- 四站是固定研究起點，不是唯一答案；最終設計仍須依本站 GA4、使用者任務、既有終端機視覺與品牌一致性決定。

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

## 寫文規則（必須遵守）

> 規則持續更新：使用者每次對文章給回饋，先判斷是通用寫作規則還是本站專屬。通用的加進 de-ai-slop repo（匿名化、記進該 repo 的 `CHANGELOG.md`，直接 commit＋push）；本站專屬的加進下面「本站專屬補充」，回饋點名的原句收進「本站錯誤範例」，兩者都在本段最後的「修改紀錄」記一筆（日期、改了什麼規則、起因與使用者原話）。

所有文章、介紹文、Threads（脆）貼文與給使用者審的修改清單，一律使用 de-ai-slop skill（去 AI 垃圾）：https://github.com/aixwangtw/de-ai-slop

- 通用的寫文規則、AI 味用字表、錯誤範例、交付前逐條檢查與回報流程，都以 de-ai-slop 為唯一來源，本檔不再重複。
- 本專案已用 `npx skills@latest add aixwangtw/de-ai-slop` 裝在 `.agents/skills/de-ai-slop/`（Codex 讀這裡，Claude Code 透過 `.claude/skills/de-ai-slop` 連結讀到）。不要直接改這份副本；規則要改就改 de-ai-slop repo 並推上 GitHub，再在本專案跑 `npx skills@latest update` 更新。
- 使用者退回 AI 味的句子時，通用的新規則與錯誤範例（匿名化後）加進 de-ai-slop repo，本檔不重複寫規則；只把原句收進下面「本站錯誤範例」方便對照。

### 本站專屬補充

- 範例截圖不要一張接一張直排、佔滿版面；同一段的多張圖左右並排（手機寬度可自動改成上下），讓讀者不用一直往下捲。
- 目錄（H2）只放讀者會想點進去看的節，例如流程、如何使用、FAQ。逐一介紹畫面或角色的節（例如「客戶開單」「團隊端」「手機版」）不要自成一節，內容和圖片併進流程，零碎問題改放 FAQ。
- 更細的本站寫文規則（程式碼區塊標記、粗體與 CTA 的版面機制、Directus 流程）見本機 `.claude/skills/blog-writing/SKILL.md`，先載入 de-ai-slop 再套用。
- 套件版本號與版本差異備註不寫，規則見 de-ai-slop R53，本檔不重複。
- 介紹工具或開源專案時，用一兩句介紹作者是誰（做過什麼、現在在做什麼），讓讀者自己判斷可不可信。每項經歷都要查到出處（本人網站、GitHub 個人頁、官方簡介），出處列在文末「原文依據」；查不到的經歷不寫。
  - 反例：只寫「某某把 Skills 開源在 GitHub」，讀者不知道他是誰；或寫「知名大神」「業界權威」這種沒出處的評價。
  - 正例：「他是有 9 年開發經驗的大神，做了 TypeScript 課程 Total TypeScript，也在 Vercel 負責過開發者推廣。」口語形容（「大神」）可以用，但要接查得到出處的年資和戰績；戰績只挑讀者認得的一兩項，不全列。
- 會變動的數字（星數、價格、用量、追蹤數）不在內文寫查詢日期，寫「發文當下」；跨日更新數字時設 `updated_date` 並改寫「更新當下」。文章頁已顯示「發佈」日期，有 `updated_date` 時也顯示「更新」日期（`src/pages/blog/[...id].astro`），讀者自己看。注意：同日修改依 blog-writing 規定不設 `updated_date`，此時仍寫「發文當下」。
  - 反例：「2026 年 10 月 21 日查詢時約 29.9 萬顆星。」
  - 正例：「發文當下近 30 萬顆星。」

- 文章標題與導覽卡片（`src/layouts/Base.astro` 導覽預覽、`src/pages/resources.astro` 卡片）講同一個角度、用同一套寫法，數字寫法也要一致；改其中一邊就同步另一邊。
- 頂部「領取」下拉的導覽卡片（`src/layouts/Base.astro`）圖文要等高：圖示型卡片（GitHub logo）的圖欄用 `align-self: stretch; height: 100%` 拉到跟文字欄同高，說明文字只寫一句重點（約 20 字內、桌機最多兩行），不把整套做法塞進去。手機版只列文字連結、不顯示圖。起因：使用者說「導覽卡 圖文高度相差太大 圖可拉高 文字不用太多」。
- 介紹別人的工具或開源專案，文章標題要放作者名，放在標題前段（讀者常用作者名搜）。
  - 反例：「29.9 萬顆星開源 Skills，提升開發效率」，看不出是誰的 Skills。
  - 正例：「Matt Pocock 開源 Skills 怎麼用？讓 AI 寫程式先問清楚，提升開發效率」。

- 技術文章的檔名、路徑、類別／方法／資料表名一律放表格，內文用白話講。表格放在該節末尾，欄位用「內文說的｜對應檔案／程式」，讀者想查再看；讀者要自己輸入的指令（`/grill-me`、`npx ...`）照常寫在內文。
  - 反例：「『這題還缺什麼』只寫在 `Question.php` 的 `missingRequirements()`，匯入由 `ProcessQuestionImportAction` 處理。」
  - 正例：內文寫「這些檢查集中在題目資料的一個判斷裡」，節末表格列「題目資料裡『還缺什麼』的判斷｜`app/Models/Question.php` 的 `missingContentRequirements()`」。

- 寫新文章或整篇改寫前，先定「包裝」，交給使用者確認後才寫內文。包裝四項：核心詞（一句撐起整篇的說法，例如「避免改 A 壞 B，提升開發效率」）、文章標題、導覽卡片文字、開頭第一句。
  - 反例：使用者只說要寫一篇，直接產出全文，包裝與內文一起丟給使用者，退回時兩邊都要重寫。
  - 正例：先列出核心詞、標題、卡片文字、開頭第一句，使用者點頭或改完，才開始寫內文。
- 寫內文用 Matt Pocock 的三個寫作 skill（已全域安裝於 `~/.claude/skills/`），流程固定：
  1. `/writing-fragments`：先挖使用者的真實經驗當素材，存成同資料夾的 `fragments.md`。
  2. `/writing-shape`（或 `/writing-beats`）：依素材逐段成稿，一次只寫一段，使用者點頭才寫下一段。
  - 反例：matt-pocock-skills 一次寫完全文，再逐題改，被退回十幾輪。
  - 正例：素材先收進 `fragments.md`，每段寫完停下來等使用者確認，再寫下一段；全文沒有一段是使用者沒看過就上線的。
- 文章審過才上線（2026-10-22 起）：只改本機草稿或 CMS 的 draft，使用者說「可以發布」才發布。

### 本站錯誤範例（使用者判定為 AI 味或廢話）

原句照錄，對應的通用規則在 de-ai-slop（R 編號）或上面的本站專屬補充。

1. 「Skills 是寫給 AI Agent 看的說明文件，AI 做某類工作前會先讀，照裡面的流程做。」（matt-pocock-skills）
   - 原因：替新手解釋基礎名詞，讀者要用這套 Skills 不需要這句；等日後有專門文章再內部連結過去。（de-ai-slop R48、R49）
2. 「2026 年 10 月 21 日查詢時約 29.9 萬顆星，套件版本 1.3.1。」（matt-pocock-skills）
   - 原因：寫了版本號和查詢日期。版本號刪；日期改「發文當下」。（de-ai-slop R53；查詢日期見本站專屬補充）
3. 「這套 Skills 在解決什麼問題？」底下第一句：「README 開頭寫這是他每天做正式開發用的 Skills，刻意做得小、容易改、可以互相組合，任何模型都能用。」接著直接放 README 表格。（matt-pocock-skills）
   - 原因：標題問完，第一句沒有用對話口吻回答，只有原文，讀起來像背稿。README 和表格可以留，但要接在口語的結論後面當佐證。（de-ai-slop R50）
4. 「一回合把『現在問得下去』的問題一次問完。前置決定還沒定的問題留到下一回合，免得你只能用猜的回答。」（matt-pocock-skills）
   - 原因：直譯原文術語，讀者聽不懂。改成「它不會一口氣丟一堆問題。你還沒決定做網站還是 App，它就不會問你要上架哪個商店。」（de-ai-slop R51）
5. retro 檢查項目表格把「Tool economy」寫成「工具經濟」（另有「導航」「無效指令」「資訊取得」「子代理」等）。（matt-pocock-skills）
   - 原因：照 repo 英文直譯，不是台灣口語，讀者看不出在檢查什麼。改成「工具太吃用量」「找檔案」「寫了沒用的規定」「AI 拿不到的資訊」「另外開一個 AI」。（de-ai-slop R54）

6. 導覽卡片說明「你以為 AI 聽懂了，做完才發現完全不是你要的。」（matt-pocock-skills）
   - 原因：使用者說「這種句型之所以是垃圾來自於沒有實際教學價值 例如 如何操作 沒有具體例子 也沒有前後文呼應」。改成「動工前輸入 /grill-me，AI 會一輪一輪問清楚需求，每題附建議答案，你回『是』就照建議，談完才開始寫程式。」（de-ai-slop R14）

7. 給使用者確認方向時寫的三句好處：「需求先問清楚：不用做完再打掉重來」「抽出共用元件：改一次，全站跟著改」「模組解耦：改 A 不會壞 B，不用回頭修」。（matt-pocock-skills）
   - 原因：使用者說「太籠統 除非這只是你要跟我確定方向 內文不要」。內文每個好處都要換成題庫系統紀錄裡數得出來的事（哪個功能、哪個檔案、原本幾處改成一處、哪次返工），查不到就不寫。（de-ai-slop R48）

8. 「Matt 的做法是把程式整理成一個個『外面簡單、裡面功能多』的盒子（他叫 deep module，深模組）：一大塊功能包在裡面，外面只留幾個簡單的按鈕，其他程式只透過按鈕用它」（matt-pocock-skills）
   - 原因：使用者說「這段AI垃圾」。同一件事講兩次、家電比喻沒教會讀者怎麼改程式，題庫系統的實例在後面卻先繞抽象定義。改成第一句講做法、第二句直接講題庫「題目能不能啟用」四個入口都問同一個判斷，術語 deep module 放最後一句。（de-ai-slop R55）

### 修改紀錄

新的寫在最上面。每筆寫日期、改了什麼規則、起因（哪篇文章的哪句、使用者原話）。

- 2026-10-22
  - 新增本站專屬「寫文前先定包裝、內文用三個寫作 skill 逐段成稿、審過才上線」三條。起因：matt-pocock-skills 一次寫完全文後被退回十幾輪。使用者原話：「規則也寫進去 直接開始用這3個整篇文改寫」，前一則提問：「比起一次寫完全文 再逐題改 不如一開始就小步寫? 先企劃 包裝 才內容的概念」。
  - 新增本站專屬「技術文章的檔名、路徑、類別／方法／資料表名一律放表格，內文用白話講」。起因：matt-pocock-skills 內文出現 `ProcessQuestionImportAction`、`CODING_STANDARDS.md`、各 SKILL.md 等名稱。使用者原話：「檔案名稱一律放表格 內文不要一堆」。
  - de-ai-slop 新增 R55（同一件事不要換句話說兩次；有實例就直接講實例，不先繞抽象比喻），本站錯誤範例收第 8 條。起因：matt-pocock-skills 深模組那段。使用者原話：「Matt 的做法是把程式整理成一個個『外面簡單、裡面功能多』的盒子（他叫 deep module，深模組）：一大塊功能包在裡面，外面只留幾個簡單的按鈕，其他程式只透過按鈕用它 這段AI垃圾」。
  - de-ai-slop R48 補「籠統口號句」反例，本站錯誤範例收第 7 條。起因同上，使用者原話：「太籠統 除非這只是你要跟我確定方向 內文不要」。
  - matt-pocock-skills 流程段改用題庫系統的真實決策舉例，並寫明題庫不是用這套 Skills 做的。使用者原話：「直接把程式碼架構講清楚 全都用題庫系統舉例 DB 前後端 每個節點如何決策」「避免重工所以提升開發效率」。
  - 「介紹工具要介紹作者身分」正例改為口語寫法：年資＋一兩項代表戰績。起因：matt-pocock-skills 作者介紹列了 Total TypeScript、XState、Vercel、AI Hero 四項。使用者原話：「作者介紹可用9年開發經驗大神形容 舉Total TypeScript Vercel戰績就好」。
  - de-ai-slop R14 補上「情境共鳴句沒有教學價值」的理由與判斷標準（讀者看完能不能多做一件事或多知道一件具體的事），本站錯誤範例收第 6 條。起因：matt-pocock-skills 導覽卡片「你以為 AI 聽懂了，做完才發現完全不是你要的。」使用者原話：「你以為 AI 聽懂了，做完才發現完全不是你要的 這種句型之所以是垃圾來自於沒有實際教學價值 例如 如何操作 沒有具體例子 也沒有前後文呼應」。
- 2026-10-21
  - 新增「文章標題與導覽卡片一致」與「介紹別人的工具，標題要放作者名」。起因：matt-pocock-skills 標題「Matt Pocock 的開源 Skills 怎麼用？從 grill-me 問清楚需求到 AI 寫完程式」與導覽卡片「29.9 萬顆星開源 Skills，提升開發效率」角度不同，卡片也沒有作者名。使用者原話：「文章標題照卡片導覽改 要作者名 SEO好的寫法」。
  - 新增「不寫套件版本號與版本差異備註」。起因：matt-pocock-skills 開頭「套件版本 1.3.1」與「還沒進正式版本」備註。使用者原話：「廢話太多 不用寫套件版本 要介紹作者身分」。
  - 新增「介紹工具要介紹作者身分並附出處」。起因同上，使用者原話：「要介紹作者身分」。
  - 新增「會變動的數字寫『發文當下』，不寫查詢日期」。起因：matt-pocock-skills「2026 年 10 月 21 日查詢時約 29.9 萬顆星」。使用者原話：「2026 年 10 月 21 日查詢時約 29.9 萬顆星 這種以後可以改寫成發文當下 讀者會自己看發布 更新時間」。
  - 通用規則加進 de-ai-slop（R48–R52：刪廢話、不替新手解釋基礎名詞、問句標題第一句用對話口吻回答、轉述原理用白話加例子、抽象概念優先附通俗例子），起因與原話記在 de-ai-slop 的 `CHANGELOG.md`。使用者原話：「『Skills 是寫給 AI Agent 看的說明文件，AI 做某類工作前會先讀，照裡面的流程做。』這是廢話 真的要給新人看也不用這樣寫 而是等日後有專門文章引導過去」「解決什麼問題? 標題問完應該第一句直接回答 不是背稿原文內容」「README、原文表格 可以當答案 我是指不要只有原文 要像跟人對話一樣 問完問題 下一句直接回答 才不會太生硬」「一回合把『現在問得下去』的問題一次問完。前置決定還沒定的問題留到下一回合 聽不懂」。使用者肯定改寫後的例句：「有例子最好 像網站還是APP這題就很通俗 非常好」，因此新增 R52。
  - 新增本段開頭「規則持續更新」做法與「本站錯誤範例」清單。
  - 「不寫套件版本號」改為通用規則，移到 de-ai-slop R53，本檔只留指向。
  - 通用規則再加 de-ai-slop R54（英文資料不直譯、改台灣口語），本站錯誤範例收第 5 條「工具經濟」。使用者原話：「原文硬翻很不口語的都要改成台灣口語 像工具經濟 還有很多 你寫文用的都是repo原文?」

## 新手教學視覺素材規則（必須遵守）

- 首頁或服務入口呈現「新手教學」時，視覺素材必須優先使用真實教學案例，並搭配案例實際使用的 Claude Code、Codex、Hermes、OpenClaw 等工具 Logo。
- 不得以一般人物合照、純裝飾照片或與案例無關的形象照作為新手教學的主要圖片。
- 案例與工具 Logo 無法使用時，才可改用能清楚看出操作成果的課程實作畫面；素材仍須與該段文案直接對應。

## 排版規則（必須遵守）

- 全站並列元素一律對齊（2026-10-31 使用者：「任何都要對齊」）：同列卡片內同類元素（圖、標題、說明起點、標籤、按鈕／連結）top 一致，不只卡片等高；標籤不得跟著說明長短上下浮動，固定在卡片內固定位置（例如與連結一起放進 `margin-top: auto` 的底部區塊）；導覽項目基線一致、按鈕列與篩選按鈕對齊、表單欄位與頁尾分欄左緣一致、圖示與文字垂直置中。驗證時用程式量測各元素 top／left 值（1440、768、390、320），並原尺寸逐張檢視。
- 案例、類別、網址、LINE、GA ID 一律從 `src/data/cases.ts` 與 `src/consts.ts` 引用，不寫死（案例與類別：`DEV_CASES`、`DEV_CATEGORIES`；LINE 預填：`lineCategoryUrl()`；Demo：`DEVELOPMENT_SERVICE.demoUrl`；題庫文章：`DEVELOPMENT_SERVICE.caseArticle`；GA：`GA_MEASUREMENT_ID`；Demo 網域清單（GA demo_click）：`DEMO_HOSTNAMES`；LINE 綠：CSS 變數 `--color-line`；網域：`SITE.url`／`SERVICE_SITE.url`）。
- 卡片群組全頁一致尺寸（不只同列）：`/cases/` 案例卡（不論篩選狀態、同列或跨列）、首頁與服務站的類別卡、小卡、流程卡，每張寬高相同（`grid-auto-rows: 1fr`，必要時標題／說明用固定行數與 line-clamp），卡內 icon、標題、說明、標籤、連結距卡片頂部的 offset 每張相同；驗證時在 1440、768、390、320（與每個篩選狀態）量測每張寬高與卡內元素 offsetTop，必須完全一致。
- 案例卡多圖輪播（2026-11-01）：`src/data/cases.ts` 每個案例用 `images` 陣列，每張一個通用功能標籤 `featureTag`（引用 `FEATURE_TAGS`），卡片下方功能標籤由各圖 featureTag 去重取前 4 個；有後台的系統，側欄主要功能頁各拍一張（1440×900 含側欄），前台主要功能頁各拍一張（手機畫面置中合成在 16:10 淺底圖）；壞掉或空白的頁面不拍。輪播用共用元件 `src/components/CaseCarousel.astro`：16:10、左上角功能標籤、左右下角箭頭位置固定、圓點置中、觸控滑動與鍵盤左右鍵、無 JS 時可橫向捲動；案例卡不自動輪播。點圖開共用放大預覽，預覽內可左右切換同案例所有圖並顯示功能標籤。圖檔 webp、每張 200KB 內、非首張 lazy-load。
- 首頁首屏自動輪播（只開主站首頁，服務站不放）：`DevCategoryPicker` 的 `showCarousel`，從所有案例 images 隨機輪播（同案例不連續），標系統名＋功能標籤，點擊連到該案例類別篩選後的 `/cases/`；每張 4.5 秒淡入、滑鼠移入或鍵盤聚焦暫停、有暫停／播放鈕、prefers-reduced-motion 不自動播放、分頁不可見暫停、只預載下一張；桌機在標題右側（寬 400px），平板與手機在標題與類別卡之間（最寬 460px）。
- 案例截圖一律可點擊放大預覽，使用共用元件 `src/components/ImageLightbox.astro`（無 JS 時連到原圖）；網頁類別（本站官網）案例排在最後。
- 區塊名稱一律引用 `src/consts.ts` 的 `SECTION_NAMES`（`cases: '案例'`、`openSource: '開源'`），導覽、頁尾、頁面 title、麵包屑、H1、描述與 Markdown／llms 產生內容都不寫死；改名只改這一處。CMS 文章內文不受此規則。

- 任何 UI 改動（包含刪除元素，例如拿掉服務下拉的 LINE 入口導致卡片排版變動）都必須在 1440、390、320 px 重新截圖，原尺寸逐張檢視受影響的區塊與其所在容器（等寬等高、對齊、切邊、留白、溢出），確認沒問題才算完成；回報中要列出檢視過的畫面。部署後須對線上版重截重驗。
- 同一列卡片必須等寬等高：用 grid／flex 讓 `li` 撐滿格子、卡片填滿 `li`（`display: flex` + `flex: 1`），說明長短不同也不得高低不齊；有按鈕的卡片，按鈕貼底對齊（`margin-top: auto`）。適用：`src/components/SiteHeader.astro` 的 `.dm-cards`／`.dm-card`（服務下拉）、首頁與服務首頁的類別卡與小卡、資源頁工具卡。
- 頁首「聊聊需求」按鈕（`SiteHeader.astro` 的 `.service-book`）：桌機最小高度 44px、padding 10px 22px、icon 20px、icon 與文字間距 8px、使用站上主按鈕色（`--color-accent`）；小於 1024px（選單內）改為滿版寬、padding 12px 20px。其他 CTA 按鈕最小高度 44px（觸控目標），icon 與文字不得貼邊或被切邊。
- 寬度 767px 以下，`.site-footer`、`.service-footer` 的 `padding-bottom` 為 72px，替右下角 LINE 浮動按鈕留空間，避免遮住頁尾最後一行（寫在 `src/styles/site-chrome.css`）。
- 導覽列：主站搜尋框固定在頁首導覽列（`SiteHeader.astro` 的 `.nav-search-form`，`showSearch`），不放在首屏 Hero；服務站不顯示搜尋框。手機版導覽放進選單展開內，且不得擠壓導覽項目。
- 服務下拉在手機為單欄文字清單（無卡片框），桌機為三欄等寬等高卡片。
- 兩欄卡片在手機單欄時，grid 必須明確寫 `grid-cols-[minmax(0,1fr)]`，否則欄寬被內容（影片、程式碼區、四欄數字）撐大，卡片右側會被 `overflow-hidden` 切掉；直式影片放進固定高度的欄位用 `object-contain`，不得用 `object-cover` 裁掉畫面兩側的文字。適用：`src/pages/resources.astro` 的 grill-me 卡。
- 首屏類別卡（2026-10-31 起，`src/components/DevCategoryPicker.astro`，主站首頁與服務站首頁共用，取代 `NeedRouter.astro` 的「你目前最想解決什麼問題？」）：問句固定「你想做什麼系統？」；2026-10-31 起六類別依序為網頁、後台管理系統、APP、題庫管理系統、社群平台、AI 應用（與 `/cases/` 篩選同一套；LINE LIFF 歸在 APP，不另立類別）。格線桌機 3×2、767px 以下 2×3（`repeat(2, minmax(0, 1fr))`），不改單欄；卡片內容固定為 icon（28px 線條 SVG）＋類別名＋去處說明，去處說明 `margin-top: auto` 貼底，所有卡同高（桌機最小 148px、手機 132px）；360px 以下縮字級與內距，確保「題庫管理系統」不換行。
- 類別卡去處：有可試用 Demo 的類別直接連 Demo（題庫管理系統 → `https://demo-question.aixwang.dev`，2026-10-31 使用者指示「卡片先連結demo就好」；社群平台 → 真實網站 `https://heavyboardgames.aixwang.dev/`；AI 應用 → `/cases/?tag=AI 應用`）；首頁與服務站的題庫案例卡也只連 Demo，題庫文章連結放在 Demo 站內（登入頁與 Demo 橫幅），網站卡片只連 Demo；其他類別開官方 LINE 並預填訊息（`https://line.me/R/oaMessage/@438efvtl/?<編碼文字>`，lin.ee 追蹤短網址不支援預填）。其他類別要有真實案例頁或 Demo 才改連過去，不得編造案例、客戶、數字或截圖。
- 案例區不放大截圖：每個真實案例一張卡片，縮圖固定 16:10（`aspect-ratio: 16 / 10; object-fit: cover; object-position: left top`），桌機縮圖與文字左右 5:7、767px 以下上下排；按鈕列 `margin-top: auto` 貼底。多個案例時改為等寬等高的卡片格線，縮圖比例不變。
- 首頁與服務站首頁的「教學／演講／開源工具」為三張等寬等高小卡（桌機 3 欄、767px 以下單欄），每張：標題、一句說明、貼底的連結文字。手機單欄時三張也必須等高（`grid-auto-rows: 1fr`），連結文字貼底。

## 開發案例頁規則（必須遵守，2026-10-31 起）

- 導覽（主站與服務站共用 `SiteHeader.astro`）有「案例」（`SECTION_NAMES.cases`），比照 service.deanlife.blog 的「品牌案例」直接連主站 `/cases/`（`src/pages/cases.astro`），不做下拉；不得因此刪掉「開源」等既有項目，擠的話調間距或字級。
- 版型比照 joinx.co/case-studies/：頁首標籤篩選（「全部」預設，純前端，無 JS 時隱藏按鈕列、卡片全部顯示）＋卡片格線，桌機（≥1024px）3 欄、768–1023px 2 欄、767px 以下 1 欄，一律 `minmax(0, 1fr)`。
- 每張卡：截圖、案例名稱、一句說明、標籤、貼底連結（`margin-top: auto`）。所有卡片等寬等高（`li` 用 flex、卡片 `flex: 1`）。
- 截圖統一 16:10：用 1440×900 視窗拍，顯示時 `aspect-ratio: 16 / 10; object-fit: cover; object-position: left top`，存 `public/images/cases/<案例>.webp`。
- 案例截圖個資流程（三步都完成才可用，2026-10-31 使用者：「先真實截圖 改掉真實資料 再碼掉」）：1. 用真實系統的真實畫面（真實介面與版型，後台含側欄等完整介面）；2. 畫面中的真實資料先換成假資料：本機系統用 seeder 或本機偽資料（確認資料庫與 storage 沒有從正式環境帶來的真實資料），公開真實網站在截圖前只於本機瀏覽器端暫時替換他人姓名、暱稱、Email、電話等文字，頭像換通用預設圖，不寫入網站；3. 個資打馬賽克（像素化）：畫面先顯示完整、看起來真實的假資料，再於截圖上對個資區塊做馬賽克；姓名保留姓、名字部分馬賽克，電話、Email、LINE 名稱、LINE ID、頭像整段馬賽克或換通用預設圖；不用 *** 或 ○ 文字遮罩。畫面不得出現「未設定」「未填寫」「—」等空值，依欄位意義補合理假資料；時間一律「2026/10/31 14:30」格式且時段合理，不可有 T 分隔或 .000000Z（客戶系統直接輸出 ISO 時，只在截圖前於瀏覽器端格式化，不改客戶程式）。拍後用程式掃描截圖範圍文字確認無未遮罩個資。
- 截圖必須是真實系統畫面。需要登入的後台用 Demo 站或本機偽真資料拍：常見姓名組合、合理數字與日期，不得有真實個資、真實客戶或老師資料，也不要明顯假（「測試123」「AAA」）；偽資料只寫在本機或 Demo 沙盒，用完還原。題庫一律用 Demo 站，不得用正式站或 staging。公開網站且無隱私問題的（例如重策桌遊揪團平台）直接拍線上畫面、直接連真實網址，不另造偽資料。
- 篩選類別固定六個：網頁、後台管理系統、APP、題庫管理系統、社群平台、AI 應用（與首頁類別卡同一套）。案例可屬多個類別（`categories` 陣列，例如題庫同屬題庫管理系統與後台管理系統），篩選任一類別都要出現。功能標籤一律用通用的系統功能名稱（讓不同產業看得懂），引用 `src/data/cases.ts` 的 `FEATURE_TAGS`，每張 2–4 個，跨卡同一功能用同一名稱，且要能在該系統程式或畫面找到；正例：客戶管理、權限管理、LINE 串接；反例→改法：背誦紀錄→統計報表、每日簽到→會員簽到、考卷匯入→檔案匯入、出卷→檔案匯出、對照原卷審核→資料審核；不寫技術框架（Astro 等）或客群／產業（補習班等）。
- 沒有可公開案例的類別（目前六類都有案例）被點選時，顯示和案例卡等寬等高的「LINE 聊聊需求」卡，只寫站上既有事實，不編案例或截圖；「全部」不顯示這些卡。
- 網址 `?tag=<類別>` 可直接帶入篩選。
- AI 應用類別放題庫系統的三個真實功能（AI 影像辨識、AI 出題、AI 詳解）各一張卡，截圖取自 Demo 站，在 Demo 沙盒操作後要按「還原 Demo 預設資料」。
- 客戶案例：2026-10-31 使用者同意客戶案例都可以公開，截圖一律偽真資料。LIFF 學習輔助專案（~/projects/LineLiff-book）分兩張卡：APP 卡用前台使用者畫面（手機直式畫面合成在 16:10 淺底圖上，不裁切），後台卡歸後台管理系統、用後台畫面（桌遊揪團平台同理：前台卡歸社群平台、後台卡歸後台管理系統）；不另立背書系統分類或標籤，內文可照實提到背書；站上不再列「另外做過…」清單。網頁類別案例是本站官網（名稱引用 `SITE.title`）。健檢、預約系統沒有程式可截圖，不做卡片也不另列；案例區介紹句統一用 `CASES_BEYOND_NOTE`（案例以外的系統也可以做、可先試用 Demo），放在案例區標題下的介紹段，卡片格線下方不放文字。CRM（原始碼 github.com/aixwangtw/FinanceCRM-Zeabur）是融資業務用的系統，案例卡與截圖不得出現「融資、貸款、撥款、送件、核准、利率、額度」等字樣：截圖用 CRM Demo（`CRM_DEMO_URL`，https://demo-crm.aixwang.dev）含側欄的完整畫面，卡片連「試用 Demo」，拍後用程式掃描畫面文字確認無融資字眼與未遮罩個資。
- 首頁「做過的系統」附「看全部案例」連到 `/cases/`；首頁案例卡維持上面的案例區規則。

## 案例 Demo 規則（必須遵守，2026-10-31 起）

從題庫 Demo（https://demo-question.aixwang.dev）實際做法歸納，之後每個案例做公開試用站都照這份做。標「建議」的是題庫還沒做過、只是推薦的做法。

1. **分支**：Demo 程式放在原 repo 的 `demo` 分支，用獨立 worktree 或獨立 clone 工作，永不合併回 main；正式站的 main 不加任何 Demo 程式。同步原系統新功能時由 main 合進 demo，不可反向。
2. **開關**：所有 Demo 行為由 `.env` 的 `DEMO_MODE=true` 開啟，設定集中在 `config/demo.php`；沒開就跟原系統一樣。會清資料的指令（`demo:reset`）要有第二道防護（題庫比對 `DEMO_DB_DATABASE`），不是 Demo 資料庫就拒絕執行。
3. **外部服務一律關閉或模擬**：不連真實 AI、第三方 API、寄信、LINE 推播、線上資料庫。題庫用 `DEMO_AI_SIMULATED=true` 回傳 `database/seeders/demo-ai/` 預寫內容並加 2 到 4 秒等待；需要真實外部服務的入口直接封鎖。資料庫用 SQLite。
4. **偽真資料**：常見姓名組合、合理公司名、合理金額與日期（以重置當天往前排），不得有真實個資、真實客戶或老師資料，也不要明顯假（「測試123」「AAA」）。客戶品牌名、業務敏感字眼（例如 CRM 的融資業務用語）不可出現在畫面與資料。資料由 seeder 產生（題庫：`DemoSeeder` 與 `database/seeders/demo-*`）。
   - **個資用畫面馬賽克，不用文字遮罩（2026-10-31／11-01 使用者指示）**：seeder 先建完整、看起來真實的假資料（完整假姓名、09 開頭完整假手機、`example.com` 完整假 Email、完整長度假 LINE ID），畫面上再打馬賽克（CSS `filter: blur(5px)`、`user-select: none`、複製時換成遮罩字、`aria-hidden` 不念真值）。姓名只遮「名」，姓保持清楚（複姓如歐陽整個保留）；電話、Email、LINE 名稱／ID、地址整段馬賽克；LINE 頭像用通用預設圖。不要用「陳○○」「09******」「c***@」這類文字遮罩。列表、詳情、聊天、通知、追蹤內文都要套。
   - **先確認全部是 seeder 產生的假資料**（檢查 migration、seeder、fixtures、storage 與 repo 內的 JSON／CSV／SQL，沒有任何從原 repo、備份、匯出檔、正式或測試 DB 帶來的真實資料），再打馬賽克；馬賽克不能用來遮真實資料。
   - **不留空值**：畫面不出現「未設定」「未填寫」「待輸入」「-」等空值，依欄位意義補合理假資料。
   - **時間格式**：一律台北時間「2026/10/31 14:30」（只有日期時「2026/10/31」），不可出現 `T` 分隔、`.000000`、`Z`；假資料時間分散在合理時段。
   - **固定三步順序（2026-10-31 使用者確定）**：① 用真實系統畫面（介面是真的）→ ② 資料全部換成 seeder 產生的假資料 → ③ 個資欄位打馬賽克。截圖與 Demo 都照這個順序。
5. **公開帳密**：登入頁公開顯示並預填 Demo 帳密（題庫 `DEMO_SHOW_CREDENTIALS=true`）。Demo 密碼不可與任何正式站相同。
6. **敏感頁封鎖**：帳號、角色、權限、選單、擴充、系統設定、通用上傳、需要真實外部服務的端點，在 Demo 模式由 middleware 回 403 與中文說明（題庫 `RestrictDemoAdminAreas` ＋ `DemoRestrictedAreas`），選單同步隱藏。
7. **個人沙盒**：每個瀏覽器一份資料，大家共用同一組帳密但互相看不到（題庫：cookie `demo_sandbox` → `storage/app/demo-sandboxes/<key>/` 的 SQLite 與檔案）。限制每 IP 每小時建立數、全站沙盒上限、最低剩餘磁碟；閒置 7 天由 timer 每小時清除。未登入只能讀乾淨範本，不替爬蟲建沙盒。
8. **定時重置**：每日 04:00（Asia/Taipei）用 systemd timer 跑 `php artisan demo:reset`（主機沒裝 cron），以 www-data 執行並寫 log。
9. **網頁層防護（nginx）**：安全標頭（X-Frame-Options、nosniff、Referrer-Policy、Permissions-Policy、CSP frame-ancestors）與 `X-Robots-Tag: noindex, nofollow`；`server_tokens off`；擋 `/build/*manifest.json`、`*.map`、`storage` 下的 PHP、所有點開頭檔案（`.git`、`.env`）；依 Cloudflare 的 `CF-Connecting-IP` 對登入、上傳、AI 等 POST 限流，另加全站 PHP 請求防洪；應用程式只在來源是本機 tunnel 時才信任這個 header。
10. **不洩漏原始碼與設定**：`APP_ENV=production`、`APP_DEBUG=false`；nginx root 指向 `public/`；不上傳 source map；除錯、測試、診斷路由在 Demo 模式封鎖；`.env` 權限 640、群組 www-data（用 sed 改過要重設）。建議：部署後用 curl 實測 `/.git/HEAD`、`/.env`、`*.map`、除錯路由都回 403/404。
11. **子網域**：`demo-<案例>.aixwang.dev`（題庫為歷史命名 `demo-question`），經 Cloudflare tunnel 對外，nginx 只允許 127.0.0.1。
12. **介紹文章連結**：Demo 登入頁與站內橫幅放案例介紹文章連結（`DEMO_ARTICLE_URL`）；部落格的案例卡片連 Demo，文章連結放在 Demo 站內。
13. **部署**：本機 push demo 分支 → 主機 `git pull --ff-only origin demo` → `migrate --force`、`optimize` →（必要時）`demo:reset` → 重啟 worker。`public/build` 不進版控，前端改動在本機 build 後傳上去。部署 Demo 不得動正式站目錄。
14. **還原與關站**：改 nginx 前備份到主機 `/root/nginx-backup-<日期>/`；關站用 `artisan down --render=<關站頁>` 並停 worker 與 timer；重開反向操作。
15. **隔離（建議）**：題庫 Demo 與正式站共用 php-fpm pool 與 www-data，Demo 目錄的 www-data 可取 GCE metadata（2026-10-19 查證，使用者 10/21 決定先不改）。新 Demo 建議用獨立系統帳號與獨立 php-fpm pool、目錄權限互不可讀，並封鎖 169.254.169.254。
