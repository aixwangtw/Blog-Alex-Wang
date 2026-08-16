# Directus Insights：內容統計儀表板

讓「內容統計」從每次手動跑 `node tools/content-stats.mjs` 產 markdown，改成在 Directus 後台
的 **Insights** 模組常駐一個 dashboard，隨時打開就看得到數字。

> 這份文件與對應的程式碼是在**沒有 admin token**、也**查不到這台 Directus 確切版本號**的環境下寫的。
> 能查證的部分（Dashboards/Panels 的 REST API 欄位、內建 panel type 有哪些、各 type 的 `options`
> 需要哪些欄位）都附了來源；查不到的部分（這台 `cms.aixwang.dev` 的精確版本、`status` 欄位完整的
> 列舉值）直接寫「查不到」，不用「應該」「通常」帶過。詳見下方「查不到的事實」一節。

## 這台 Directus 的版本與 Insights 能力

- **精確版本號查不到**：`GET https://cms.aixwang.dev/server/info`（公開端點，未帶 token）不會回傳
  `data.directus.version` 這個欄位——實測結果只有 `data.project` 與 `data.setupCompleted`。
  這是 Directus 本身的行為（`/server/info` 只有 admin 權限的呼叫者才看得到版本號），不是這支腳本的
  限制，也不是這台站台特別關掉了什麼。公開的 `GET /server/specs/oas`（OpenAPI 規格）裡的
  `info.version` 欄位是一串 git commit hash（`9f45d7c03c4d827bcf54116b06ee70f849fbbae8`），不是語意化
  版本號；拿這個 hash 查 GitHub `directus/directus` repo 的 commits API 也查無這個 commit
  （可能是私有 fork 或 monorepo 內其他 repo 的 commit），所以連「對應到官方哪個 release」都查不到。
- **確認有 Insights 模組**：後台前端打包檔（`/admin/assets/*.js`）裡找得到
  `useInsightsStore`、`directus_dashboards`、`directus_panels` 這些字串，代表這台站台的前端有
  Insights 功能、系統 collection 也存在。呼叫 `GET /dashboards`／`GET /panels`（未帶 token）回
  `403 FORBIDDEN`（訊息刻意寫成「沒有權限或不存在」，Directus 故意讓這兩種情況回同樣的錯誤，
  避免未授權的人用回應差異猜測系統內部結構），跟「已存在但沒權限」一致，不算矛盾。
- **下面所有 panel type 的 `options` 欄位**：不是查文件猜的，是直接讀
  [`directus/directus` GitHub repo `main` 分支](https://github.com/directus/directus)裡
  `app/src/panels/<type>/index.ts` 的原始碼（抓取日期 2026-07-31）逐欄位確認的，來源連結見
  `tools/lib/insights-dashboard-lib.mjs` 檔案開頭與下表。**main 分支是最新開發版，不保證跟
  `cms.aixwang.dev` 實際跑的版本完全一致**——`--apply` 前建議先在後台手動試建一個 panel，
  確認選單長得跟這裡假設的一樣。

## 可直接查 / 需要預先計算 的指標分類表

`tools/content-stats.mjs` 目前算的 10 類統計，哪些 Directus panel 可以直接對 `articles`
collection 查出來、哪些不行，原因都是「Directus panel 的 aggregate function 只有
count/countDistinct/avg/avgDistinct/sum/sumDistinct/min/max/first/last 這幾種，沒有字串長度、
沒有跟今天的日期差、沒辦法對 JSON 陣列欄位（`tags`／`faqs`）做 group by 或算陣列長度、
也沒辦法比對同一個 collection 裡不同列之間的關係（例如站內連結誰連到誰）」。

| # | content-stats.mjs 的統計項目 | 能不能用 panel 直接查 `articles` | 原因 |
|---|---|---|---|
| 1 | 總篇數 | ✅ 可以 | Metric panel，`function=count` |
| 1 | status 分布 | ✅ 可以 | Pie/Bar chart，`column=status`, `function=count` |
| 1 | featured 篇數 | ✅ 可以 | Metric panel，`filter={featured:{_eq:true}}` |
| 1 | featured **比例**（%） | ⚠️ 部分可以 | 篇數可以個別查到，但 panel 沒有「兩個 aggregate 相除」的功能，比例本身要預先算好 |
| 1 | 最早／最新發佈日 | ✅ 可以 | Metric panel，`function=first`/`last`, `field=pub_date`, `sortField=pub_date`；日期欄位不能用 `min`/`max` 聚合 |
| 2 | 每日／每週／每月發文數 | ✅ 可以 | Time-series panel，`dateField=pub_date`, `precision=day/week/month` |
| 2 | 相鄰兩篇發文間隔／最長空窗 | ❌ 不行 | 要比較「相鄰兩列」的日期差，panel 沒有 row-to-row 比較功能 |
| 3 | 每篇「距今更新天數」 | ⚠️ 部分可以 | List panel 可以照 `updated_date` 排序顯示原始日期，但「距今幾天」這個數字本身 panel 算不出來（沒有日期相減的 aggregate/display） |
| 4 | 正文字數（平均/中位數/最短/最長/逐篇） | ❌ 不行 | 要解析 markdown body（去 code block、圖片、連結語法等）才算得出字數，body 是一大段文字欄位，panel 不會幫你解析 |
| 5 | description／title 長度達標判定 | ❌ 不行 | 沒有字串長度的 aggregate function |
| 6 | 標籤：不重複數／孤兒標籤／平均每篇 | ❌ 不行 | `tags` 是純 JSON 陣列欄位（不是關聯到獨立 tags collection 的 M2M），panel 沒辦法對陣列元素 group by 或算陣列長度 |
| 7 | FAQ 題數（平均/逐篇） | ❌ 不行 | `faqs` 同樣是 JSON 陣列欄位，理由同上 |
| 8 | 內文結構（H2/H3/code block/圖片/連結數） | ❌ 不行 | 要解析 body markdown |
| 9 | 站內連結網絡（孤島/死路/被連入次數） | ❌ 不行 | 要解析 body 找出連結、再跨列比對哪篇連到哪篇 |
| 10 | slug 長度／含非 ASCII 字元 | ❌ 不行 | 沒有字串長度／正規表示式的 aggregate function |

**結論**：第 1、2（發文頻率）兩類可以直接建 panel 查 `articles`；第 2（間隔）、3、4–10
都要預先算好寫進一個新 collection，panel 再讀那個 collection。詳見下一節。

`tags`／`faqs` 是純 JSON 陣列這件事，是打 `GET /items/articles?limit=1&fields=slug,tags,faqs`
（公開端點）實際看到回傳資料的形狀確認的（陣列裡直接是字串／物件，不是 `{id, articles_id,
tags_id}` 這種 M2M junction 的形狀），不是猜的。

## 資料模型：兩個新 collection

因為上面「不行」跟「部分可以」的項目沒辦法讓 panel 直接查 `articles` 算出來，這裡新增兩個
collection，由 `tools/write-content-stats.mjs` 把 `tools/lib/content-stats-lib.mjs` 算好的結果寫
進去，panel 再讀這兩個 collection：

### `content_stats`——文章明細，一篇文章一列，永遠只反映「最新一次跑的結果」

不留歷史（每次重跑用 `slug` 當 key 原地覆蓋），這樣 panel 不用煩惱「怎麼篩出最新一批」——
collection 裡本來就只有最新資料。用途：正文字數排行、description 達標分布、孤島/死路文章清單……
這些「目前」的明細與分布。

欄位：`slug`（unique）、`run_date`、`title`、`word_count`、`title_len`、`desc_len`、`desc_status`、
`h2_count`、`h3_count`、`code_block_count`、`image_count`、`external_link_count`、
`internal_link_count`、`inbound_link_count`、`is_island`、`is_dead_end`、`days_since_update`、
`updated_date_used`、`slug_length`、`slug_has_non_ascii`、`tag_count`、`faq_count`。

### `content_stats_history`——站台彙總，一天一列，留歷史

用 `run_date`（純日期，不含時間）當 key，同一天重跑會更新那一列，不會插入第二列——這是刻意的
設計：想要看趨勢，把 `write-content-stats.mjs` 排程成每天跑一次即可，時間久了自然累積出一天一個
資料點的歷史序列；同一天手動重跑很多次也不會把圖畫爛。

欄位：`run_date`（unique）、`generated_at`、`source`、`article_count`、`status_counts`（JSON，
理由見下方「查不到的事實」）、`featured_count`、`featured_ratio`、`avg_word_count`、
`median_word_count`、`min_word_count`、`max_word_count`、`desc_pass_count`、`desc_fail_count`、
`desc_missing_count`、`title_len_avg`、`unique_tag_count`、`orphan_tag_count`、
`avg_tags_per_article`、`avg_faq_per_article`、`no_faq_count`、`island_count`、`dead_end_count`、
`unresolved_link_target_count`、`max_gap_days`。

完整的欄位型別與 Directus meta（interface/note/width）定義在
`tools/create-content-stats-collection.mjs` 的 `HISTORY_FIELDS` / `ARTICLE_FIELDS`。

## 你需要準備的東西：Directus admin token

跟 `docs/ga4-views-sync.md` 一樣的拿法：

1. 登入 Directus 後台（`https://cms.aixwang.dev`）。
2. 點左下角自己的使用者頭像 → 使用者頁面。
3. **Token** 欄位產生一組 static token，馬上複製存好（存檔後不會再顯示）。
4. 存檔。

這個 token 至少要對 `content_stats`、`content_stats_history`、`directus_dashboards`、
`directus_panels` 有讀寫權限（管理員角色一定夠；自訂角色的話要確認上述 collection 都有勾）。

```bash
export DIRECTUS_TOKEN="你的 token"
```

## 執行順序

三支腳本，依序跑，每支都預設 dry-run、要 `--apply` 才真的寫入：

### 1. 建立兩個 collection（只需要做一次）

```bash
npm run insights:create-collection                        # dry-run，印出要建立的欄位
DIRECTUS_TOKEN=xxx npm run insights:create-collection -- --apply   # 真的建立
```

冪等：collection 已存在就不重建，改成逐一檢查每個欄位、只補缺少的（跟
`tools/create-views-fields.mjs` 的欄位層級冪等邏輯一樣）。

### 2. 算統計、寫進 collection（之後要重跑就跑這支）

```bash
npm run insights:write-stats                        # dry-run，印出這次算出的數字與寫入計畫
DIRECTUS_TOKEN=xxx npm run insights:write-stats -- --apply   # 真的寫入
```

這支腳本必須在第 1 步的 collection 已經建好之後才有意義（沒建好的話，dry-run 帶 token 時會
提示「讀不到 xxx，collection 可能還沒建立」）。

冪等：

- `content_stats_history`：用 `run_date`（今天日期）查有沒有現成的列，有就 `PATCH`、沒有就
  `POST`，同一天重跑不會累積出重複列。
- `content_stats`：用 `slug` 比對，已存在的 `PATCH`、新文章 `POST`、這次資料裡已經沒有的
  slug（文章被刪除或改了 slug）預設 `DELETE` 掉，避免留著查無此文章的死資料。不想自動刪除
  就加 `--no-delete-missing`。

**之後要更新數據，重跑這一支就好**，不用重跑第 1 步。想要有歷史趨勢可以看，把這支腳本排程
成每天跑一次（cron 或 CI 排程都可以，這份文件沒有幫你設好排程，只提供腳本本身）。

### 3. 建立 dashboard 與 panel（只需要做一次）

```bash
npm run insights:create-dashboard                        # dry-run，印出要建立的 25 個 panel
DIRECTUS_TOKEN=xxx npm run insights:create-dashboard -- --apply   # 真的建立
```

冪等：dashboard 用名稱（「Blog 內容統計」）查是否已存在，存在就沿用；每個 panel 用「同一個
dashboard 底下名稱是否已存在」查，存在就跳過。**已知取捨**：如果你手動把某個 panel 改名，
重跑這支腳本會誤判成「不存在」而建出一個新的重複 panel——想改名又不想被誤判，直接在後台手動
管理，不要再跑這支腳本針對同一個 dashboard。

這支腳本依賴第 1、2 步（部分 panel 讀 `content_stats`/`content_stats_history`，這兩個
collection 要先有資料，panel 才看得到數字；panel 本身可以先建，只是暫時顯示空的）。

### 建好之後在哪裡看

Directus 後台左側選單找 **Insights**，會看到一個叫「網站內容統計」的 dashboard。

版面使用 **48 格寬版網格**（Directus 每格 18px，總寬約 864px）：摘要數字每列三張，圖表與清單
每列兩張，A/B/C 資料群組之間保留空白。重跑 `insights:create-dashboard -- --apply` 會同步更新
面板設定與這份標準版面；`insights:write-stats` 只更新資料，不會動到版面。

觀看次數明細不使用 Insights 的 list 假裝表格；改用 Content 模組的原生 tabular 書籤，可依累積或
近 30 天觀看數排序。建立方式與頁面統計見 `docs/ga4-views-sync.md`。

## dashboard 裡的 26 個 panel

分三組，對照上面的分類表：

- **A 組（7 個，直接查 `articles`）**：總篇數、featured 篇數、最早／最新發佈日、status 分布
  （圓餅圖）、每月發文數（時序圖）、最近更新的文章（清單）。
- **B 組（15 個，讀 `content_stats` 目前快照）**：平均/最少/最多正文字數、正文字數排行、
  description 達標分布（長條圖）、平均每篇標籤數、平均每篇 FAQ 題數、孤島/死路文章數與清單、
  slug 含非 ASCII 字元的文章、目前不重複標籤數、目前 featured 比例、目前最長發文空窗。
  （最後三個讀的是 `content_stats_history`，用 `function=last` + `sortField=run_date` 取「最新
  一列」的值——這是 Directus metric panel 官方支援的寫法，因為這三個數字是站台層級的彙總，
  `content_stats`（一篇文章一列）裡沒地方放。）
- **C 組（3 個，讀 `content_stats_history` 畫趨勢）**：平均字數趨勢、總篇數趨勢、
  description 達標篇數趨勢。這三個圖在只有一天資料時只會有一個點，之後每天跑一次
  `insights:write-stats` 才會慢慢畫出線。

完整定義在 `tools/lib/insights-dashboard-lib.mjs` 的 `PANELS`。

## 跑測試

```bash
npm run test:content-stats     # tools/lib/content-stats-lib.test.mjs
npm run test:insights          # tools/lib/insights-dashboard-lib.test.mjs
npm run test:views             # 會一併跑 tools/lib/ 底下全部 *.test.mjs（含上面兩個）
```

`content-stats-lib.test.mjs` 測的是字數/連結/標籤等純計算函式，以及
`buildHistoryRow`/`buildArticleRows` 有沒有正確把 `buildStats()` 的巢狀輸出攤平成兩個
collection 要的列資料（純量欄位、沒有遺漏）。

`insights-dashboard-lib.test.mjs` 測的是 `PANELS` 這份寫死清單本身有沒有問題（name 不重複、
type 是已知型別、必要 options 欄位沒缺）與 `layoutPanels()` 排出來的版面會不會重疊——這兩件事
沒有真的 Directus 實例可以幫忙把關，所以特別用測試顶住。

## 查不到的事實

- 這台 `cms.aixwang.dev` 的精確 Directus 版本號（見上方「這台 Directus 的版本與 Insights
  能力」）。所有 panel `options` 欄位對照的是 GitHub `main` 分支原始碼，不是這台站台自己的版本。
- `articles.status` 欄位完整的列舉值。公開 API 只看得到 `status=published` 的文章（草稿被權限
  擋住），目前唯一觀察到的值是 `"published"`。這是 `content_stats_history.status_counts` 用
  JSON（而不是 `published_count`/`draft_count`/`archived_count` 這種固定欄位）存的原因——固定
  欄位需要先知道完整列舉值，沒有 admin token 查不到，用 JSON 保留彈性，不用假設。
- `content_stats`／`content_stats_history` 兩個 collection 的欄位在 `--apply` 之後，Directus
  後台實際顯示的介面（interface）長相是否符合預期。所有 `meta.interface` 選的都是最基本款
  （`input`/`boolean`/`datetime`/`input-code`），照 `tools/create-views-fields.mjs` 的既有慣例，
  但沒有真的在後台看過畫面。
- Directus Insights 工作區沒有固定總欄數；目前依官方前端 `VWorkspace` 的 18px gridSize，採用
  48 格（約 864px）作為可讀性與一般桌機寬度之間的基準。

## 還沒解決、需要你決定的問題

1. **要不要排程 `insights:write-stats`**：這份文件沒有幫你設定 cron／CI 排程，只提供腳本
   本身。想要 C 組的趨勢圖有意義，需要每天（或固定頻率）自動跑一次，累積歷史資料點。
2. **token 權限範圍**：需要確認你打算用來 `--apply` 的 token，對
   `content_stats`／`content_stats_history`／`directus_dashboards`／`directus_panels` 都有
   讀寫權限；如果是自訂角色（不是管理員），要手動去角色設定裡勾這幾個 collection。
3. **`content_stats` 的自動刪除行為**：預設「這次資料裡沒有的 slug 會被 DELETE」，如果你覺得
   保留歷史文章的統計比較安全，記得每次都加 `--no-delete-missing`，或之後改成常態。
4. **本文件與腳本完全沒有實際 `--apply` 跑過**（沒有 admin token），所以「Directus 後台實際
   看到的畫面」「建立過程會不會遇到 API 回錯誤」都沒有實測驗證過，只驗證到 dry-run 的計畫輸出
   跟三支腳本的 `node --check` 語法檢查、以及對應的單元測試全綠。第一次 `--apply` 時如果報錯，
   錯誤訊息會照現有腳本慣例把 Directus 回應的前 300 字印出來，方便對照這份文件的欄位定義找問題。
