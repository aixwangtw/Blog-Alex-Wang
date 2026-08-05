# aixwang.dev 重構設計

日期：2026-08-05
狀態：**草案，待使用者審閱**

---

## 1. 為什麼要做

站台目前是「白底 + Tailwind 預設藍」的教學部落格，首頁一頁塞了七個區塊。三個問題：

1. **沒有記憶點**——配色是框架出廠設定（`sky-*` 用了 71 處、`#1688e8` 硬編 38 處），視覺上跟任何一個 SaaS 或線上課程平台無法區分。
2. **首頁在做太多事**——七個區塊（免費資源、教學經歷、演講經歷、教學內容、精選文章、FAQ、CTA）全擠在 `src/pages/index.astro`，沒有一個是主角。
3. **核心賣點是隱形的**——站台真正的差異是「文章可以整份丟給 AI 照著跑」，但這件事在介面上完全看不出來，也沒有對應功能。

## 2. 定位（brand thesis）

> **讀完文章，用提示詞就能跑通自己要的工作流。文章本身也能直接丟給 AI 照著做。**

作者是個人，不是公司。受眾是**完全不會、怕自己學不會的新手**（現行首頁 H1：「AI 工具很多，不知道哪個適合你？我提供免費諮詢」）。

設計上的推論：

- 深色終端機風（akseolabs）對新手的訊號是「這裡不是給你的」→ 不採用
- 畫廊暖白（jisto）的訊號是「我們挑客戶」，跟「免費諮詢」矛盾 → 氣質可借，配色不照抄
- **記憶點不來自配色，來自一個別人沒有的動作**：複製 → 貼給 AI → 跑通

## 2b. 站台的第二個身分：作品集（關鍵驅動力）

**這個站同時是軟體開發服務的作品集。** 現有客戶想看簡約風格的 UI/UX 設計能力。

這個目標的評估者是**客戶**，不是部落格讀者。它推翻了幾項先前的判斷：

- 「視覺改版不幫 SEO / 不幫轉換，所以可以晚點做」→ **對此目標無效**，視覺本身就是交付物
- 「jisto 的畫廊疏離感跟教新手打架」→ 顧慮仍在，但評估者是客戶，降為取捨而非否決理由
- **Q5（軟體開發服務頁沒有案例素材）解決**：這個站本身就是案例

**視覺方向的判準因此明確化**：不是「哪個最有記憶點」（過於模糊，導致長期無法決策），而是**「哪一個最能向客戶展示設計能力」**。

另記：站主的首要目標是**影響力先於變現**。因此首頁應主推可擴散的內容（免費資源、文章、工具），服務收在單一入口下——五個專區平等排列與此目標不一致（見 Phase 3）。

## 2c. 視覺方向：定案為 B（對話版式）＋ C 的工藝標準

三個原型比較後定案。**A（.md 檔案感）出局**：目標讀者是「不會程式、會用 AI 對話的人」，而 A 進站第一眼是五行 `key: value` frontmatter 才輪到第一句人話，導覽是 `/blog` `/one-on-one` 路徑式，含 `curl` 區塊，且**一張圖都沒有**（現行首頁有 3 個影片嵌入、4 張演講照、8 個工具 logo）。

**選 B 的理由**：
1. 唯一「版式本身就在說目標讀者語言」的變體——讀者每天在看的就是問答介面，B 的結構與之同構
2. 有圖。講課現場照是最強的信任訊號
3. B 的弱點是**版面問題**（線性長帶、服務入口距頁首約 4,500px），可修；C 的弱點是**概念問題**（畫廊在篩人），修好就不是 C 了
4. C 的工藝可以搬到 B 上；B 的親近感搬不到 C 上

### 要從 C 搬過來的工藝標準（實測得出，非推論）

| # | 項目 | 內容 |
|---|---|---|
| 1 | **中文大標 line-height 不可用 `.84`** | 那是英文數值。Noto Sans TC 的 ascender+descender 是 1.448em，`.84` 會讓下一行字頂跑到上一行基線之上，**中文兩行直接疊在一起**。中文大標用 `1`，`.84` 只留給純拉丁字 |
| 2 | **字距依光學尺寸分級** | 大字 `-.06em`／區塊標題 `-.028em`／內文 `-.011em`／12–13px 小標籤反向 `+.12em`。單一數值套到底會讓中型標題擠在一起 |
| 3 | **中文字距歸零，拉丁字段單獨收** | 用 `<i class="lat">` 包拉丁字段，建置期自動處理，內容仍 100% 在初始 HTML |
| 4 | **補回尾字距** | CSS `letter-spacing` 會在字段最後一字後面也加間距，負值會把後面的中文吸過來。用 `margin-inline-end: calc(-1 * var(--ls))` 補回。140px 大字下差 8.4px，肉眼可見 |
| 5 | **大字標題不放中文標點** | 全形「，。」自帶半個字身空白，大字下會炸出一個洞。用 `<br>` 斷行取代 |
| 6 | **hover 加裝置條件** | `@media (hover:hover) and (pointer:fine)`，避免觸控裝置黏住；`:focus-visible` 另外寫一份、不設條件 |
| 7 | **動效失效保險** | IntersectionObserver 之外另設 2 秒逾時強制顯示；JS 掛掉時內容照樣可見 |
| 8 | **對比實測而非目測** | 全部色票對底色的對比值須實測並過 AA |

### 首頁的雙路徑原則（已定案）

站主先後給過兩個優先序：「先換影響力」與「客戶優先，新手教學是輔助導流」。**兩者不衝突，衝突的只是「誰需要捲」。**

- **內容順序維持影響力優先**：免費資源、部落格文章、開源工具在前。這是給導流進來的新手看的
- **客戶不該需要捲**：導覽列常駐一顆「找我合作」，hero 區塊另給一個服務入口

同一頁，兩條路徑。客戶三秒內找得到，新手往下捲得到內容。這解掉 B 原型「服務入口距頁首 4,500px」的缺陷，且不必把服務搬進第一屏搶掉導流內容的版位。

### 首屏取捨：要氣勢（已定案）

放大字級會把首屏的其他東西往下推。站主已決定：**首屏優先給氣勢，不給資訊密度。**

推論依據：客戶明確喜歡 jisto 的視覺風格，而 jisto 那種「大器、克制、有分量」的感覺主要來自**極端字級對比**（jisto H1 `clamp(72px,12vw,184px)`，B-v2 只有 46px），不是來自暖米白配色。

接受的代價：
- 首屏路徑分岔（服務入口）可能掉出第一屏——**由 sticky 導覽列常駐的「找我合作」CTA 承接**，它在所有斷點都是 0px
- 第一段回答被往下推，新手要多捲一點才讀到內容

**不追到 jisto 的 184px。** 那顆 H1 是英文單字「Cases」；本站 H1 是中文，實測 46px 下一個全形「，」就是 36.7px 的空洞，中文在該尺寸下換行、標點、字距都會出問題。上限訂在 `clamp(56px, 8vw, 96px)`。

### 全站設計語言（2026-08-05 陸續定案）

| # | 決定 | 備註 |
|---|---|---|
| 1 | **H1 96px 是首頁專用**，不是全站通用 | 內頁另訂較小的字級階梯 |
| 2 | **卡片全部換成髮絲線列** | `rounded-[1.75rem]` + shadow 的卡片堆全站移除 |
| 3 | **導覽分斷點**：桌機 jisto 式橫向膠囊（`.j-header.is-open{width:min(460px,100vw-28px);height:68px;border-radius:999px}`，站主版本用 560px 因為有五項）；**手機保留現有漢堡**（`Base.astro:246` 的 `#mobile-menu`，max-height 下拉，`lg:hidden`） | 手機不做膠囊：375px 下 `100vw-28px` 只有 347px，五個中文連結塞不下 |
| 4 | **LINE／Email 兩顆 icon 全斷點常駐**，不收進選單 | 它們是轉換路徑 |
| 5 | 首頁入口**四個**：免費資源／部落格／一對一教學／演講邀約 | 見下 |
| 6 | **軟體開發服務頁延後**，首頁不放該入口 | 不放沒有落地頁的假入口。代價：客戶落在首頁看不到這項服務 |
| 7 | **免費資源做成獨立頁 `/resources/`** | 不再指向 `/blog/free-resources/` 那篇文章。素材：`home.ts` 的 VIDEOS ×3、Tooka、HyperFrames |

### 元件層的兩個定案

**`Cta.astro`（5 頁使用）：拆掉漸層卡片。**

現況是 `rounded-[1.75rem]` + 三色 `linear-gradient` 底 + 外框。**漸層卡片是最典型的「AI 直出」特徵**，必須移除。

改用 jisto 聯絡區的做法（以下為實測值）：

```css
.j-contact    { padding: clamp(72px,11vw,190px) var(--j-pad); background: var(--j-white) }
.j-contact h2 { font-size: clamp(36px,10vw,46px); line-height: 1.06 }
.j-contact a  { min-width:168px; min-height:168px; border-radius:50%;
                background: var(--j-ink); color: var(--j-white); font-size:14px }
.j-contact a:hover { background: transparent; color: var(--j-ink);
                     transform: rotate(-8deg) scale(1.03) }
/* 手機 */ .j-contact a { width:100%; min-height:56px; border-radius:999px }
```

- 無外框、無底色、無漸層，僅以上方一條髮絲線分隔
- CTA 是**實心圓**（本站用酒紅），hover 反白並旋轉 −8°
- 手機圓形改為整寬 56px 膠囊
- 符合既定的「圓角歸零，僅膠囊與圓形為例外」規則

**`.prose-blog`（文章內文，約 100 行）：只改字級與間距，不動結構。**

```
改：內文字級與行高、h2/h3 的大小與上下留白、段落間距、連結樣式（藍 → 酒紅）
不改：h2/h3 的層級邏輯、清單、表格、社群引用卡、四類程式碼區塊
```

理由：**文章頁是閱讀場景，不是展示場景。** jisto 的內文 13–14px 適合作品集，套到三千字教學文會傷可讀性。首頁可以有氣勢，文章頁的第一要務是讓卡住的讀者讀完。

### 實作順序（槓桿由大到小）

實測共用元件覆蓋率：`Base.astro` 542 行（每頁都用）、`Breadcrumbs` 8 頁、`PillButton` 7 頁、`SectionHeading` 5 頁、`Cta` 5 頁、`Card`／`FaqList` 4 頁。各頁自身版面只有 58–252 行。

```
階段一  token 換色（46 處 legacy class + 約 114 處藍）
階段二  Base.astro + 9 個共用元件      ← 改一次全站八成受益
階段三  首頁 index.astro
階段四  各頁收尾（blog 列表、文章頁、服務頁 ×2、faq、about、resources、法務頁 ×3）
```

**階段二必須在三、四之前**，否則元件改完各頁要再對一次。階段二的前置條件是首頁原型定案（結構語言要先確定）。

### B 保留的部分
暗酒紅 `#7A2E3B`（色相 350°，避開 Claude 17°／Meta・Gemini 217°／ChatGPT 165°／站上現行 `#1688e8`）、襯線＝提問／無襯線＝回答的雙聲音系統、無泡泡無頭貼無 emoji、內容 100% 在初始 HTML、首屏總揭露 390ms、`prefers-reduced-motion` 全關。

## 3. 已定案

| # | 決定 | 依據 |
|---|---|---|
| D1 | 亮底，不走深色 | 受眾是新手 |
| D2 | 不使用任何 AI 官方色（Claude `#D97757`、Meta `#0866FF`、Gemini 藍系、ChatGPT 黑綠） | 使用者明確要求 |
| D3 | HTML 是 SEO / AI Overview 的主力，`.md` 是附加功能，兩者不互相犧牲 | AI Overview 來源是 Google 索引，索引的是 HTML |
| D4 | 保持 Astro 靜態預渲染 | 實測：jisto（React SPA）首頁 HTML 只有 3,533 bytes 且內容為空；本站文章頁 59,625 bytes、16 個 h2/h3 全在初始 HTML |
| D5 | 執行順序：結構化輸出 → 視覺 → 首頁架構 | 前者讓後者的設計有功能依據，且可獨立上線 |
| D6 | 五個專區：一對一教學／演講邀約／軟體開發服務／免費資源／部落格 | 使用者指定 |
| D7 | 對話框的自由輸入接 **pagefind 全文搜尋**，不接 LLM API | 零 API 成本；且自由輸入必須真的有作用，否則讀者第一次亂打就發現是假的 |
| D8 | 不做任何「假裝在運算」的效果（thinking 轉圈、暗示即時生成的逐字打字） | 站台招牌是教真 AI，被發現假裝 AI 的信任代價特別高。採用對話**版式**可以，假裝**運算**不行 |

## 4. 待決（必須由使用者回答才能進 Phase 2/3）

| # | 問題 | 影響 |
|---|---|---|
| **Q1** | 「黑底反白 = 可執行」取代彩色重點，接受嗎？還是保留一點藍在連結上？ | 決定整套色票 |
| **Q2** | 「文章看起來像一份 `.md` 檔」這個方向，會不會對新手太工程師？ | 決定 Phase 2 的形式語言 |
| **Q3** | 首頁精簡到什麼程度：純入口／入口＋CTA／入口＋CTA＋精選文章？ | 決定 Phase 3 的搬遷範圍 |
| **Q4** | 服務要「一頁多模組」（akseolabs 的實際做法）還是「一服務一頁」？ | 決定頁面數量與 NAV |
| **Q5** | 軟體開發服務頁的素材從哪來？目前 repo 裡沒有可用案例 | 這頁能不能做 |

**Phase 1 不依賴上述任何一題，可立即開工。**

---

## Phase 0：內容標記正規化（已定案，且是所有 UI 工作的前置）

### 0.1 問題

`language-text` 是垃圾桶。`local-preview/codex-windows-wsl-install.md` 的 17 個區塊實測：

| fence | 數量 | 實際內容 |
|---|---|---|
| `powershell` | 3 | 終端機指令（標得準） |
| `bash` | 4 | 終端機指令（標得準） |
| `text` | 10 | **混了四種**：提示詞 ×4、錯誤輸出 ×2、版本號 ×1、網址 ×1、指令 ×2 |

**站台最重要的差異化內容（提示詞）跟 WARNING 錯誤訊息長得完全一樣。**

跨文章還不一致：`threads-api-tutorial` 用 `blockquote` 放提示詞（6 個），`codex-windows-wsl-install` 用 ` ```text`。同一種東西兩種標法。

線上實測：`codex-cli-wsl2-windows` 有 18 個 `<pre>` → 18 顆複製按鈕，但真正值得複製的只有 6 個（3 bash + 3 powershell），**其餘 12 顆是噪音**。

### 0.2 做法

改用 markdown 原生 fence 語言，不自訂語法：

| 標記 | 用途 | 前端處理 |
|---|---|---|
| ` ```bash` / ` ```powershell` | 終端機指令 | 「終端機」標籤 + 複製鈕 + 等寬字 |
| ` ```prompt` | 提示詞 | 「提示詞」標籤 + 複製鈕 + **一般字非等寬**（中文提示詞用等寬難讀） |
| ` ```output` | 執行結果、錯誤訊息、版本號 | **不加複製鈕**，低調樣式 |

### 0.3 設計原則：按鈕的價值來自稀有

每個區塊都有按鈕 → 按鈕不傳達訊息，眼睛會忽略它。
只有可帶走的東西有按鈕 → **按鈕本身成為「這個你可以拿走」的訊號**。

達成「讓人想複製」的方法不是把按鈕做大做花，是**把不該有按鈕的地方拿掉**。

站台已有此機制的先例：`src/content.config.ts` 的 renderer 用 `[!note]` 把說明性引用標成 `data-no-copy`。Phase 0 只是把同一邏輯延伸到 `<pre>`。

### 0.3b 三種區塊的視覺處理（已定案）

**原則：差異來自可讀性，不是重要性。** 兩者的標籤同樣清楚、複製按鈕同樣明顯、外框同樣完整；只有底色不同，而底色由「哪種文字在哪種底上好讀」決定。

| 區塊 | 底色 | 字體 | 複製鈕 | 理由 |
|---|---|---|---|---|
| 終端機（`bash` / `powershell`） | 深 | 等寬 | 有，明顯 | 終端機本來就是黑的——真實隱喻不是裝飾。指令是短英數，深底反白最清晰 |
| 提示詞（`prompt`） | 淺 + 明顯外框 | **一般字，非等寬** | 有，同樣明顯 | 提示詞是三四行中文，深底長中文閱讀負擔明顯較高 |
| 輸出（`output`） | 無框 | 灰字 | **無** | 退到背景，像終端機吐出來的東西 |

**這不是把提示詞降級。** 兩者在標籤、按鈕、外框上完全對等。

### 0.4 為什麼是前置

- 沒有可靠的 `prompt` / `output` 區分，前端做不出「標籤 + 選擇性複製鈕」
- **它獨立於任何視覺決定**——不論最後選哪個視覺方向，標記都一樣
- 便宜：腳本掃描 + 人工確認 + `tools/push-article-full.py` 批次推回

### 0.5 待決

| # | 問題 |
|---|---|
| **Q8** | 16 篇舊文全改，還是只改新文？ |
| **Q9** | 這個慣例要不要寫進 `blog-writing` skill？（不寫的話第 17 篇又會退回 `text`） |

---

## Phase 1：結構化輸出

目標：讓每篇文章有一份乾淨、可整份取用的 markdown。**一份輸出同時服務三個消費者。**

| 消費者 | 用途 | 現況 |
|---|---|---|
| 人 | 複製整篇貼給 AI 跑工作流 | 只能單塊複製（`[...id].astro:179-222`） |
| AI agent | 使用者把網址丟給 Claude Code / Codex | 只能拿到 59KB 含導覽與腳本的 HTML |
| HyperFrames | `/faceless-explainer` 吃 arbitrary text → 產影片 | 無 |

### 1.1 阻礙：原始 markdown 目前被丟掉

`src/content.config.ts` 的 loader：

```js
store.set({
  id: a.slug,
  data: entry,
  rendered: { html: marked.parse(a.body ?? '', { async: false }) },  // ← 只留 HTML
  digest: generateDigest(a),
});
```

Directus 回傳的 `a.body`（原始 markdown）被轉成 HTML 後**沒有保存**。要輸出 `.md` 必須先留住它。

**做法**：在 `schema` 加 `body: z.string()`，並在 `parseData` 的 `data` 裡帶入 `a.body ?? ''`。

- 16 篇文章的體積影響可忽略
- `fields` 已包含 `body`，不需改 API 查詢

### 1.2 新路由

`src/pages/blog/[id].md.ts` — Astro endpoint，`prerender = true`，`getStaticPaths` 沿用 `getCollection('blog')`。

輸出格式：

```markdown
---
title: <post.data.title>
description: <post.data.description>
url: https://aixwang.dev/blog/<slug>/
published: <pubDate YYYY-MM-DD>
updated: <updatedDate YYYY-MM-DD，無則省略>
tags: [<tags>]
---

# <title>

> <description>

<原始 body markdown>

## FAQ 常見問題

### <faq.question>

<faq.answer>
```

FAQ 段落**僅在 `faqs.length > 0` 時輸出**，否則整段（含 `## FAQ 常見問題` 標題）省略。

設計理由：

- front-matter 讓 agent 一眼拿到標題、一句話答案、正規網址
- `> description` 這行對 HyperFrames 特別有用——`title` 是問題句、`description` 是 40–80 字直接答案（schema 註解已如此規範），正好對應影片的開場鉤子與一句話結論
- FAQ 附在後面，agent 拿到的是完整內容，不用再抓一次

**待驗證**：`src/pages/blog/` 現有 `[...id].astro` 是 rest 參數路由。新增 `[id].md.ts` 是否會與之衝突，需實測。靜態模式下只有 `getStaticPaths` 產出的路徑存在，理論上不衝突，但要確認建置產物真的有 `/blog/xxx.md`。

### 1.3 重複內容防護（必做，不可事後補）

`/blog/xxx.md` 與 `/blog/xxx/` 內容相同，若都可索引會稀釋正規頁。

`.md` 檔無法放 `<meta name="robots">`，只能用 HTTP header。新增 `public/_headers`：

```
/blog/*.md
  X-Robots-Tag: noindex
  Content-Type: text/markdown; charset=utf-8
```

注意事項：

- `public/_headers` 目前**不存在**，是新檔
- `public/.assetsignore` 目前只有 `_worker.js` 與 `_routes.json`，`_headers` 不在其中——建置後要確認 `_headers` 有被 Cloudflare 當設定檔吃掉而不是當靜態資產送出
- sitemap 由 `@astrojs/sitemap` 產生，需確認 `.md` 路由**沒有**被收進 sitemap

### 1.4 介面上的入口

文章頁頂部加一個動作區（視覺細節留到 Phase 2，Phase 1 先用現有樣式）：

- 「複製整篇 Markdown」——`fetch` 該篇 `.md` 後寫入剪貼簿
- 「開啟 .md」——直接連到 `/blog/xxx.md`

### 1.4b GA4 事件追蹤（已定案）

沿用 `src/layouts/Base.astro:92-100` 既有慣例（GA4 `G-91Z2F673C0`，統一帶 `{ link_url, page_path }`）：

| 事件名 | 觸發時機 |
|---|---|
| `copy_full_markdown` | 點「複製整篇 Markdown」 |
| `download_md` | 點「下載 .md」或 `/blog/*.md` 連結 |
| `copy_prompt` | 點內文提示詞區塊的複製按鈕（目前完全沒追蹤） |

`copy_prompt` 一併加入：它是「讀者真的拿走提示詞去用」的最直接證據，比整篇複製更貼近核心定位。

### 1.5 Phase 1 驗收

- [ ] `npm run build` 通過
- [ ] `dist/blog/<slug>.md` 存在，內容為合法 markdown 且含 front-matter
- [ ] `/blog/<slug>/` 的 HTML 輸出**未改變**（用 `git diff` 或建置前後比對確認）
- [ ] `dist/sitemap-*.xml` 不含任何 `.md` 網址
- [ ] `npx wrangler dev` 下 `curl -I /blog/<slug>.md` 回 `X-Robots-Tag: noindex`
- [ ] 隨機抽一篇 `.md` 丟給 Claude Code，確認它能照著內容執行

### 1.6 Phase 1 明確不做

- **不加 `HowTo` schema**。Google 已於 2023 年移除 HowTo 富摘要，對搜尋外觀無效；它對 LLM 解析是否有幫助，我沒有可引用的證據，屬推論，不納入本階段。
- **不為 HyperFrames 設計專用結構標記**。`/faceless-explainer` 實際期望的輸入格式尚未查證（只讀了 README，未讀 skill 內容）。先交乾淨 markdown，實測後再決定要不要加。
- **不動 `llms.txt`**。據我所知目前沒有主流 AI 供應商公開證實會讀取 llms.txt（2024-09 的社群提案）。留著成本低，但不在此階段投入。

---

## Phase 2：視覺設計

**前置條件：Q1、Q2 有答案。以下為提案，非定案。**

### 2.1 核心規則

> 整站無彩色。可執行的東西是整頁唯一的深色塊。

讀者滑過幾篇文章後會自行學會：**深色塊 = 我可以拿走**。

不用彩色當記號的理由：藍、綠松、陶土橘皆與 AI 官方色衝突（D2）；黑白不屬於任何公司。

### 2.2 形式語言：文章看起來像一份 `.md`

每條都是 AI 預設不會做的形式決定，且每條都指向 Phase 1 已建好的真實功能：

| 形式 | 指向的功能 |
|---|---|
| 文章頂端顯示 `~/blog/xxx.md` 路徑，**可點擊** | 真的下載該篇 markdown |
| 標題保留 `##` 前綴（淡灰） | 這確實是 markdown 渲染出來的 |
| 清單用 `-`，分隔線用 `---` 的視覺 | 同上 |
| 提示詞／程式碼區塊是整頁唯一深色塊 | 可複製、可執行 |
| 等寬字用於標題、標籤、路徑、日期 | 技術感 |

**中文內文不使用等寬字**——等寬中文長文閱讀性差。等寬只用在英數與短標籤。

### 2.3 借自 jisto 的結構（實測數值）

- 圓角一律 0，只有 pill（999px）與圓形 icon 例外——脫離 AI 預設的 `rounded-xl`
- 列表用髮絲線 `1px solid rgba(0,0,0,.14)` 分隔，不用卡片邊框＋陰影
- 版心 1680px、左右 `clamp(24px,6vw,140px)`、段距 `clamp(72px,10vw,168px)`
- **英文大字收緊字距 `-.06em`，中文標題字距歸零**（jisto 自己就是分開處理的）
- 進場交錯動畫 `--row-index`，**必須附 `prefers-reduced-motion` 全關**

### 2.3b 文章版式：問答對

文章結構本來就是一段對話，`src/content.config.ts` 的 schema 註解已如此規範：

```
// 標題直接用「使用者會問 AI 的問題句」        → title
// 40–80 字直接回答問題                        → description
```

版式據此呈現：`title` 是問句、`description` 是即時答案、`body` 是詳解。

**這不是模擬 AI，是忠實反映內容的真實結構**——因此不違反 D8。

### 2.3c 逐段揭露

「由上至下像即時生成」的節奏感，用 CSS 做，**不用 JS 逐字 append**：

```css
opacity: .3; transform: translateY(30px);
transition: opacity .6s cubic-bezier(.16,1,.3,1),
            transform .6s cubic-bezier(.16,1,.3,1);
/* 進入視窗 → */ opacity: 1; transform: translateY(0);
```

（數值取自 akseolabs.com 的 `ScrollCinema` 實測。）

硬性條件：

- 內容**必須全部在初始 HTML 裡**，CSS 只負責顯示與否——否則爬蟲讀不到，等於毀掉 D4
- 首屏內容總揭露時間 **≤ 400ms**，讀起來要像「浮現」不像「打字」。讀者是卡住來查答案的，不能讓他等
- 必須配 `prefers-reduced-motion` 全關

### 2.4 必須先清理的技術債

`src/styles/global.css:17-36` 有一段把舊深色主題的 `.text-stone-*` / `.text-amber-*` 強制轉色的 `!important` 區塊。`PostCard.astro:43` 的標題現在仍寫 `text-stone-50`，靠這段才看得見。

**新配色會被這段蓋掉，必須先移除並在各元件直接指定顏色。**

（附帶發現：這段把 `.text-amber-200/300` 轉成 `#1688e8`，代表舊版識別色是琥珀，後來被覆蓋成框架預設藍。）

### 2.5 待查

- 等寬字選型：JetBrains Mono / Fira Code 過於常見（akseolabs 即用 JetBrains Mono）。需查免費、可商用、有個性的選項，以及中文如何搭配。**尚未查證，不得視為已定案。**
- `##` 前綴須確認為純裝飾（`::before` + `aria-hidden`），不進入標題文字、不影響無障礙與 SEO。

---

## Phase 3：首頁與架構

**前置條件：Q3、Q4、Q5 有答案。**

### 3.1 現況

- `src/pages/index.astro` 239 行、七個區塊
- `src/pages/services/` 只有 `one-on-one.astro`、`speaking.astro`
- `NAV`（`src/consts.ts:74-81`）六項：首頁／部落格／一對一教學／演講邀約／常見問題／關於講師

### 3.2 參考站的實際做法

akseolabs.com 與本站**同棧**（Astro + Tailwind v4）：

- NAV 五項：關於 AK ／ SEO 服務 ／ SEO 工具 ／ 部落格 ／ 常見問題
- `/services` = **六個模組在同一頁**（h3 分段），不是六個頁
- `/tools` = 一頁列 13 個工具，每個工具有子頁
- 首頁 H1 是**問題句**（「自然流量卡住時，先找出是哪一層。」），不是品牌名——因為它跟本站一樣吃搜尋流量

> **注意**：使用者說「多頁面服務」，但參考站是「一頁多模組」。這是 Q4。

### 3.3 現有首頁內容的去處（草案，待 Q3 確認）

| 現有區塊 | 去處 |
|---|---|
| 區塊一 hero + LINE CTA | 留在首頁 |
| 區塊二 我的免費資源 | → 免費資源專區 |
| 區塊三 一對一教學經歷 | → `/services/one-on-one/` |
| 區塊四 公眾演講經歷 | → `/services/speaking/` |
| 區塊五 我主要的教學內容 | → 一對一教學頁或新的服務總覽頁 |
| 區塊六 精選文章 | → `/blog/`（Q3 決定要不要在首頁留一份） |
| 區塊七 FAQ | → `/faq/`（已存在） |

### 3.4 搬遷時不可遺失的東西

`src/pages/index.astro:38-58` 掛著兩組 schema：

- `Course`（`@id: ${SITE.url}/#course`，`teaches` 來自 `SYLLABUS`）
- `FAQPage`（來自 `HOME_FAQS`）

內容搬到哪頁，schema 就要跟到哪頁，**不能蒸發**。

### 3.5 SEO 風險評估（有事實依據）

`docs/content-stats-20260731.md`：最早發文 `2026-07-22`，最新 `2026-07-28`，CMS 已發佈 9 篇，本地 16 個 md。

**站台約兩週大，沒有累積的排名或外部連結可失去。此時改架構的成本遠低於日後。** 這是支持現在動手的事實依據，不是推測。

`public/robots.txt` 已明確允許 GPTBot、OAI-SearchBot、ClaudeBot、PerplexityBot、Google-Extended 等 AI 爬蟲。

---

---

## Phase 4：對話框

**前置條件：Phase 2 視覺定案。**

不是新功能，是**把既有搜尋換一個版式**。`src/layouts/Base.astro:187-189` 已有「範例問句 → 搜尋」的按鈕，`npm run build` 已在跑 `pagefind --site dist`。

| 使用者動作 | 背後機制 | API 成本 |
|---|---|---|
| 點常見問題按鈕 | 預先寫好的模板回應 | 0 |
| 自由輸入 | **pagefind 全文搜尋**，結果用對話泡泡呈現 | 0 |
| 都找不到 | 導向 LINE 免費諮詢（既有轉換路徑） | 0 |

自由輸入必須真的有作用（D7）。介面上**不得暗示它在生成或思考**（D8）。

### 4.1 待決

| # | 問題 |
|---|---|
| **Q6** | 模板回應要寫幾則？每次發新文要不要同步更新？沒有維護機制的話，三個月後它會答錯 |
| **Q7** | 對話框是全站常駐（浮動按鈕）還是只出現在文章頁尾？ |

### 4.2 對 GEO 的實際效益：接近零

對話框是 client-side JS，爬蟲不會與之互動，也不產生可索引內容。**它不會幫你被 AI 引用。**

唯一例外：若模板回應同時以靜態 HTML 輸出（例如併入 `FAQPage` schema），那部分是可索引的。但那是「多寫了 FAQ 內容」的功勞，不是對話框的功勞。

---

## 全域不做

- **不改成 SPA 或抽屜式詳情頁**。jisto 的右側抽屜會毀掉單篇連結分享與索引；本站文章網址是核心資產。
- **不對文章縮圖套灰階**。jisto 的灰階適用於作品集；本站縮圖是教學截圖，灰階會藏掉資訊。
- **首頁 H1 不用品牌名**。jisto 敢用「JISTO」是因為 B2B 走轉介；本站吃陌生搜尋流量。
- **不動文章 URL 結構、RSS、search-index、Breadcrumbs**。

## 開放問題彙整

三個 Phase **各自產出獨立的實作計畫、各自能單獨上線**，不合併成一次大改版。本文件是三者共用的設計依據。

Phase 1 可立即開始。Phase 2 需 Q1、Q2；Phase 3 需 Q3、Q4、Q5。

待查證事項（不得當作已知）：
1. `[id].md.ts` 與 `[...id].astro` 的路由共存性
2. Cloudflare 對 `public/_headers` 的實際處理
3. `/faceless-explainer` 期望的輸入格式
4. `geekjourneyx/hyperframes-motion-director`（中文文章→影片 skill）的實際用法
5. 等寬字選型與中文搭配
6. llms.txt 在 2026-08 的實際採用狀況
