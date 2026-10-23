# GA4 文章與全站頁面瀏覽數同步回 Directus

把 GA4（Google Analytics 4）記錄的 `/blog/<slug>/` 瀏覽數，定期同步回 Directus `articles`
collection 的四個欄位：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `views` | integer | 累積（全期間）瀏覽數 |
| `views_30d` | integer | 近 30 天瀏覽數 |
| `avg_engagement_seconds_30d` | integer | 近 30 天平均停留秒數 |
| `views_synced_at` | timestamp | 最後一次同步時間 |

四個欄位在 Directus 後台都是**唯讀**（`meta.readonly = true`），手動改了也會在下次同步時被覆蓋。

### 平均停留秒數（`avg_engagement_seconds_30d`）

公式是 GA4 官方「網頁和畫面」報表用的算法：**平均停留秒數 = userEngagementDuration（累積互動秒數）
÷ activeUsers（不是除以瀏覽數）**，四捨五入成整數秒。只做**近 30 天滾動值**，不做全期間累積平均——
累積平均值隨時間拉長意義會變淡，且站目前才上線約 4 週，之後真的需要時再考慮加累積欄位。

只有 **GA4 Data API 模式**才會算這個欄位：近 30 天查詢會一併把 `userEngagementDuration`、
`activeUsers` 兩個 metrics 跟 `screenPageViews` 放進同一個 `runReport` 呼叫裡查（已實測驗證過
`pagePath` 可以跟這兩個 metrics 相容查詢，一次查詢只花 GA4 Property 每日配額的 1 個 token），不用
多打一次 API。**CSV 模式**（`--csv-total` / `--csv-30d`）目前不支援這個欄位——GA4 後台「網頁和畫面」
報表匯出的 CSV 不含 `userEngagementDuration` 欄位，用 CSV 模式跑同步時 `avg_engagement_seconds_30d`
這次不會被更新（保留 Directus 現值）。

沒有使用者資料時（`activeUsers = 0`）這個欄位是 **`null`，不是 `0`**：`0` 秒代表「有使用者但平均只
待了 0 秒」，`null` 代表「這次沒有互動資料可算」，兩者語意不同。GA4 這次的查詢結果裡完全沒涵蓋到的
文章／頁面，一律**跳過、保留 Directus 現值不動**（沒有 `--zero-missing` 這類旗標可以覆蓋這個欄位的
行為，因為「平均值缺資料」跟「累積值/次數缺資料」的正確處理方式不一樣，寫 0 秒或用現有旗標語意都
兜不起來——見 `tools/lib/ga4-views-lib.mjs` 的 `buildSyncPlan()` 開頭註解）。

此外，`tools/sync-ga4-page-views.mjs` 會把 GA4 所有網址路徑同步到 `page_views` collection。每列包含
頁面名稱、路徑、內容類型、是否為現行內容、累積觀看、近 30 天觀看、近 30 天平均停留秒數
（`avg_engagement_seconds_30d`，算法與未涵蓋時的行為同上面「平均停留秒數」一節）及同步時間。頁面統計從目前
Astro 新站上線日 2026-07-22 起算；StarJobTW 舊站、非現行路徑與單篇文章不寫入 `page_views`。
單篇文章只同步到 `articles`，避免在文章表格與頁面表格重複出現；`/blog/` 文章列表頁仍算一般頁面。

首次設定與手動同步：

```bash
npm run page-views:create-collection -- --apply
npm run daily-views:create-collection -- --apply
npm run daily-content-views:create-collection -- --apply
npm run audience-metrics:create-collection -- --apply
npm run traffic-sources:create-collection -- --apply
npm run page-views:sync -- --apply
npm run daily-views:sync -- --apply
npm run traffic-sources:sync -- --apply
npm run views:create-dashboard -- --apply
```

最後一行會在「流量統計」直接建立文章觀看次數表格，並建立兩個 Content 原生表格書籤：
「文章觀看次數表格」與「全站頁面觀看次數表格」。Insights 表格使用 Marketplace 的
`@directus-labs/table-view-panel`。
日常自動同步由 Hetzner 主機（`ssh lineliff-prod`）的 crontab 負責（見下方「Hetzner 排程」），依序同步文章、全站頁面、
每日流量與流量入口，不增加前台請求，也不影響頁面載入。Cloudflare Worker `blog-ga4-sync` 與本機四支腳本保留當手動備援。

`daily_views` 會保存新站自 2026-07-22 起每天的總流量、文章流量、一般頁面流量、活躍使用者與
總使用者，供 Insights 畫折線圖。全站使用者數使用日期層級的獨立 GA4 查詢，不會把同一個人看過
多頁的數字相加而重複計算。
`daily_content_views` 會保存每篇文章與每個一般頁面的逐日觀看明細，只寫入有觀看的日期。流量統計內
分成「每篇文章每日流量」與「每個頁面每日流量」兩張表，可依名稱或路徑篩選單一內容，並列出
觀看數、活躍使用者與總使用者。這份明細
直接沿用 `daily_views` 已取得的 GA4 報表，不增加 GA4 查詢，也不增加任何前台請求；同步時使用批次
寫入，避免逐筆請求造成不必要的 CMS 負擔。

同步查詢會要求 GA4 回傳目前的 Property quota，終端輸出會顯示本次消耗與剩餘的每日 tokens，方便確認
實際消耗。標準 GA4 Property 目前每天有 200,000 Core tokens，多數一般查詢少於 10 tokens；排程
每 3 小時同步一次（每天 8 次）。Worker 每次完整同步打 8 個 GA4 查詢，2026-10-21 實測
一次消耗 11～40 tokens（Worker log 的 `usage.ga4TokensConsumed`），8 次／天遠低於每日 200,000 配額。
間隔定為 3 小時，是因為 GA4 標準資源的當日資料處理約需 2-6 小時，更密集同步拿不到更新的數字
（出處：<https://support.google.com/analytics/answer/11198161>）。

`audience_metrics` 固定保存一筆全站摘要，流量統計最上方直接顯示「總使用者」、「近 30 天活躍
使用者」與「當日活躍使用者」。三個區間透過同一個 GA4 多日期範圍請求取得；總使用者從新站
2026-07-22 上線日起算，近 30 天使用 `29daysAgo` 到今天的 30 個曆日，數字都是區間內去重結果，
不會把每日使用者相加。

同一個 collection 另外保存裝置類別拆分，共 8 個欄位，分兩組區間／指標，各自對齊既有的置頂數字：

| 欄位 | 區間 | 指標 | 對齊哪個既有欄位 |
| --- | --- | --- | --- |
| `desktop_users`／`mobile_users`／`tablet_users`／`other_users` | 新站上線至今 | `totalUsers` | `total_users` |
| `desktop_users_30d`／`mobile_users_30d`／`tablet_users_30d`／`other_users_30d` | 近 30 天 | `activeUsers` | `active_users_30d` |

這 8 個欄位來自同一個 `runReport` 查詢（`fetchDeviceMetrics()`）：`dimensions` 只帶
`deviceCategory` 一個，`dateRanges` 用兩組具名區間（`since_launch`／`last_30_days`），`metrics`
同時要 `totalUsers` 與 `activeUsers`。GA4 會把「日期區間」當成隱含維度**附加在明確指定的維度
之後**（回應的 `dimensionValues` 順序是 `[deviceCategory, dateRange]`，不是排在最前面）——這是
拿真實 GA4 Property 實測驗證過的順序，`tools/lib/daily-views-lib.mjs` 的 `parseGa4DeviceMetrics()`
註解與對應測試都照這個順序寫，不是猜的。

`other_users`／`other_users_30d` 收 GA4 回傳但不是 `desktop`/`mobile`/`tablet` 的類別（例如
`smart tv`、`(not set)`），避免這幾類使用者被靜默漏算而看不出加總對不上 `total_users`／
`active_users_30d`。實測（2026-08-28，`aixwang.dev`）：新站上線至今桌機 170／手機 105／平板 1／
其他 0（合計 276，與 `total_users` 一致）；近 30 天活躍桌機 124／手機 72／平板 0／其他 0
（合計 196，與 `active_users_30d` 一致）。
`traffic_sources` 會保存 GA4 的來源、媒介、活動名稱、進站頁、工作階段與觀看數。Instagram 留言、
YouTube 資訊欄等具體位置無法從未加標記的歷史網址反推；分享時需使用 `utm_source`、`utm_medium`
與 `utm_campaign`，例如 `utm_source=ig&utm_medium=comment` 或
`utm_source=youtube&utm_medium=description`，之後同步時會自動分類。

入口分類「Google 搜尋」（`google` / `organic`）**同時包含一般搜尋結果與 AI Overview 點擊，GA4 無法分開**，
不要把這個數字讀成 AI 引用流量（2026-10-21 起從「Google 搜尋／AI Overview」改名，就是因為舊名容易被
誤讀）。明確的 AI 搜尋來源（2026-10-23 起從「AI 助理」改名）另外列：來源名含 `chatgpt`／`openai`、`perplexity`、`claude`／`anthropic`、
`gemini`／`bard.google`、`copilot` 的工作階段分別歸到 ChatGPT、Perplexity、Claude、Gemini、
Microsoft Copilot（依 `sessionSource` 判斷，見 `tools/lib/traffic-sources-lib.mjs` 的 `classifySource()`）。
入口分類共 9 類：Google 搜尋、AI 搜尋、Facebook、Threads、Instagram、YouTube、LINE、直接或不明來源、其他。
2026-10-23 起 YouTube（`youtube`／`yt`／`youtu.be`）與 LINE（`line`／`line.me`／`liff`）不再併入「其他」。
儀表板「熱門入口造訪次數」改用自訂面板 `traffic-channel-bars`：Google 搜尋固定第一、AI 搜尋固定第二，其餘依造訪次數多到少。

所有自動同步查詢都固定篩選 `hostName = aixwang.dev`。因此 `localhost` 本機開發、預覽環境與在本機
執行的 Browser Agent 即使曾載入 GA4，也不會寫進 CMS 的文章、頁面、每日趨勢或流量入口統計。
這個條件也會在每次重算時回溯套用，可清掉早期已進入 GA4、但不屬於正式站的測試流量。

> **更新（2026-08-19）：GA4 Data API 路徑（下方「模式 A」）已經實測驗證過，不是下面這段舊文字寫的
> 「沒有真的打過」。** 依據：`~/.cache/aixwang-ga4-views/cron.log` 顯示自 2026-08-16 起，正式排程
> 每天都有成功的真實 API 執行紀錄（16 篇文章、10 個頁面、27-28 天每日資料、42-45 組流量入口）；
> 這次新增 `avg_engagement_seconds_30d` 欄位時，也已用同一組憑證實測驗證過 `pagePath` 可以跟
> `userEngagementDuration`、`activeUsers` 放在同一個 `runReport` 呼叫裡查詢並拿到合理的數字。
> CSV 解析（「模式 B」）目前仍然沒有拿真實匯出檔案對過格式，這部分維持下面舊文字的說法。
> 以下這段是這份文件與程式碼最初寫成時的背景（當時**沒有任何 GA4／Google Cloud 憑證**），保留
> 原文供參考：兩條路徑都用官方文件描述的格式與寫死的假資料寫測試
> （`tools/lib/ga4-views-lib.test.mjs`），實際串接後如果格式跟預期不同，錯誤訊息會直接印出來，
> 不會默默吃掉或用猜的填資料。

## Hetzner 排程（正式自動同步）

2026-10-23 起，自動同步由 Hetzner 主機（`ssh lineliff-prod`，時區 UTC）的 crontab 執行。
2026-10-21 到 10-22 曾短暫由 Cloudflare Worker 執行；8/28～10/23 因 Directus 金鑰失效，排程一直失敗，
10-23 換上有效的金鑰後，已在 Hetzner 手動跑一次完整同步成功。

| 項目 | 內容 |
| --- | --- |
| 專案目錄 | `~/blog-ga4-sync/`（部落格 repo 的 clone） |
| 排程腳本 | `~/blog-ga4-sync/run-sync.sh`（先 `git pull`，載入 `.env`，依序跑 `tools/sync-ga4-views.mjs`、`sync-ga4-page-views.mjs`、`sync-ga4-daily-views.mjs`、`sync-ga4-traffic-sources.mjs`，皆帶 `--apply`；前一段失敗就不跑後面） |
| crontab | `17 */3 * * * /home/alex/blog-ga4-sync/run-sync.sh`（UTC 每 3 小時第 17 分）；同一份 crontab 另有 `20 3 * * * ~/backups/backup-db.sh`，與本同步無關 |
| 設定檔 | `~/blog-ga4-sync/.env`：`DIRECTUS_TOKEN`、`GA4_PROPERTY_ID`、`GOOGLE_APPLICATION_CREDENTIALS`（指向 `~/.config/aixwang/ga4-views-sync.json`） |
| log | `~/.cache/aixwang-ga4-sync/cron.log`，最後一行以「成功」或「失敗（exit N）」開頭 |
| 防重疊 | `flock` 鎖檔 `~/.cache/aixwang-ga4-sync/sync.lock` |
| 實測用量（2026-10-23 手動跑一次） | 耗時約 16 秒、最大記憶體約 130 MB、CPU 時間約 4 秒（user 3.44 + sys 0.60） |

驗證同步成功：看 `cron.log` 最後一行是「成功」，或查 Directus `traffic_sources` 最新的 `views_synced_at`
是否為最近時間。

### 換金鑰

- 換 Directus token：直接編輯主機 `~/blog-ga4-sync/.env` 的 `DIRECTUS_TOKEN`（先備份 `.env`），
  然後手動跑 `~/blog-ga4-sync/run-sync.sh`，確認 `cron.log` 最後一行為「成功」。
- 換 GA4 金鑰：在 Google Cloud 建新 JSON 金鑰，放到主機 `~/.config/aixwang/ga4-views-sync.json`
  （或改 `.env` 的 `GOOGLE_APPLICATION_CREDENTIALS` 路徑），手動跑一次確認成功，再停用舊金鑰。
- 金鑰不要貼進對話、不進 repo。

## Cloudflare Worker（手動備援）

Worker `blog-ga4-sync` 在 2026-10-21 建立並曾負責排程；2026-10-23 排程搬到 Hetzner 後，
`workers/ga4-sync/wrangler.jsonc` 的 `crons` 已改為空陣列並重新部署，Worker 本身與手動 `POST /run` 保留。
以下的 3 小時閘門、用量與 log 說明是 Worker 排程運作時的資料，現在只在手動觸發或恢復排程時適用。

恢復 Worker 排程的方式：把 `wrangler.jsonc` 的 `crons` 填回 `["17 * * * *"]`，
再 `npx wrangler deploy -c workers/ga4-sync/wrangler.jsonc`，並把 Hetzner crontab 那行註解掉，避免兩邊重複跑。

為什麼是獨立 Worker、不塞進主站 `blog-alex-wang`：主站走 Cloudflare Git 整合，每次 push 都會重新部署；
同步程式需要 GA4 金鑰與 Directus admin token，放在獨立 Worker 可以讓主站完全不持有這些秘密，
同步出錯也不會影響前台。代價是**這個 Worker 不會隨 push 自動部署**，改了 `workers/ga4-sync/` 或
`tools/lib/` 要手動部署：

```bash
npx wrangler deploy -c workers/ga4-sync/wrangler.jsonc
```

### 跟本機腳本的關係

- 計算直接 import 同一份 `tools/lib/*.mjs` 與 `tools/ga4-slug-aliases.json`，查詢參數照抄四支本機腳本
  （文章段走 API 模式預設旗標：`views` 未涵蓋跳過、`views_30d` 未涵蓋寫 0、累積值下降保護開啟）。
  2026-10-21 用 dry-run 對同一時間點比對過：文章 19 篇、頁面 10 筆、每日 92 天、逐篇每日 466 筆、
  置頂數字與裝置拆分、流量入口 92 組，兩邊結果完全相同（同步時間欄位除外）。
- 差異只在 I/O：GA4 改打 REST `runReport`（WebCrypto 簽 RS256 JWT 換 OAuth token，不用 Node 套件）；
  Directus 寫入改成批次（`PATCH`／`POST`／`DELETE /items/<collection>` 帶陣列 body，Directus 11 對應
  `updateBatch`／`createMany`／`deleteMany`，見
  <https://github.com/directus/directus/blob/main/api/src/controllers/items.ts>），一次 250 筆。
- 本機腳本保留當手動備援（Worker 壞掉或要看詳細報表時用），用法不變：
  `bash tools/daily-ga4-views-cron.sh --force` 或個別 `node tools/sync-*.mjs [--apply]`。

### 用量與 Cloudflare 限制

帳號是 **Workers Free 方案**（2026-10-21 用 `limits.cpu_ms` 部署探測，Cloudflare 回
「CPU limits are not supported for the Free plan」）。官方限制
（<https://developers.cloudflare.com/workers/platform/limits/>）與實測用量：

| 項目 | Free 上限 | 實測（2026-10-21） |
| --- | --- | --- |
| Subrequest／次 | 50 | 完整同步 22～24（OAuth 1、GA4 8、閘門讀 1、Directus 讀 6、批次寫入 6～8）；閘門跳過時 1 |
| CPU time／次（Cron） | 10 ms | 完整同步 38～49 ms（首次排程實跑 38 ms）；單段 15～22 ms；閘門跳過 1 ms |
| Wall time／次（Cron） | 15 分鐘 | 10～16 秒 |
| Cron Triggers／帳號 | 5 | 曾用 1 個（現已移除） |

**CPU 超過 Free 方案的 10 ms**：官方文件說每個 isolate 有彈性容許「偶爾」超過，但「持續超過會被終止」
（outcome `exceededCpu`、Error 1102），沒有給明確門檻。實測幾次完整同步都成功，但這不是保證。
若 log 開始出現 `exceededCpu`，處理方式是升級 Workers Paid（Cron 間隔 ≥ 1 小時的 CPU 上限 15 分鐘），
或暫時改回本機 crontab（見下方「退回本機排程」）。逐筆寫入的舊做法約需 230 個 subrequest，
超過 Free 的 50，所以 Worker 版一定要用批次寫入。

### 怎麼看 log

- Cloudflare 後台 → Workers & Pages → `blog-ga4-sync` → Logs（已開 `observability`）。每次執行會留一行 JSON：
  - `ga4-sync-success`：各段筆數與 `usage`（`subrequests`、`ga4Queries`、`ga4TokensConsumed`、`wallMs`）
  - `ga4-sync-skip`：本 3 小時區塊已成功過
  - `ga4-sync-failure`：`console.error`，含錯誤訊息；同時 handler 丟出錯誤，Cron Events 會標成失敗
- Settings → Trigger Events → View events 可看最近 100 次 cron 執行結果（含 CPU／outcome）。
- 即時看：`npx wrangler tail blog-ga4-sync --format pretty`（`--format json` 會帶 `cpuTime`、`wallTime`）。

### 手動觸發

token 存在本機 `.env` 的 `GA4_SYNC_TRIGGER_TOKEN`（與 Worker secret `MANUAL_TRIGGER_TOKEN` 相同）：

```bash
set -a; . ./.env; set +a
URL=https://blog-ga4-sync.js0980420.workers.dev/run
curl -X POST -H "Authorization: Bearer $GA4_SYNC_TRIGGER_TOKEN" "$URL"            # dry-run，回傳算出的完整資料
curl -X POST -H "Authorization: Bearer $GA4_SYNC_TRIGGER_TOKEN" "$URL?apply=1"    # 真的寫入（不受 3 小時閘門限制）
curl -X POST -H "Authorization: Bearer $GA4_SYNC_TRIGGER_TOKEN" "$URL?only=traffic&apply=1"  # 只跑某段：articles,pages,daily,traffic
```

### 秘密與換金鑰

Worker secrets（`npx wrangler secret list -c workers/ga4-sync/wrangler.jsonc` 只列名稱）：
`GA4_PROPERTY_ID`、`GA4_SERVICE_ACCOUNT_JSON`（service account 金鑰 JSON 全文）、`DIRECTUS_TOKEN`、
`MANUAL_TRIGGER_TOKEN`。值一律從本機 `.env` 與憑證檔讀入，不進 repo、不印到終端：

```bash
set -a; . ./.env; set +a
W="npx wrangler secret put -c workers/ga4-sync/wrangler.jsonc"
# 換 GA4 金鑰：先在 Google Cloud 建新 JSON 金鑰、更新 .env 的 GOOGLE_APPLICATION_CREDENTIALS 路徑，再：
python3 -c 'import json,sys; print(json.dumps(json.load(open(sys.argv[1]))),end="")' "$GOOGLE_APPLICATION_CREDENTIALS" | $W GA4_SERVICE_ACCOUNT_JSON
# 換 Directus token：
printf '%s' "$DIRECTUS_TOKEN" | $W DIRECTUS_TOKEN
# 換手動觸發 token：先改 .env 的 GA4_SYNC_TRIGGER_TOKEN（例如 openssl rand -hex 32），再：
printf '%s' "$GA4_SYNC_TRIGGER_TOKEN" | $W MANUAL_TRIGGER_TOKEN
```

換完用上面的 dry-run 手動觸發確認能跑，再到 Google Cloud 停用舊金鑰。secret 更新立即生效，不需重新部署。

### 本機備援

本機 crontab 已不含 GA4 這行（內容統計 `daily-stats-cron.sh` 保留）。`tools/daily-ga4-views-cron.sh`
仍是手動備援，Hetzner 與 Worker 都壞時可手動執行：

```bash
bash tools/daily-ga4-views-cron.sh --force
```

多處同時跑也不會寫壞資料（同樣的計算、整批覆蓋），只是 GA4 查詢會多一倍。

## 你需要準備的東西

### 一定要有：Directus admin token

寫回 Directus 一定要 token，讀 Directus 草稿文章（非 published）也需要。

1. 登入 Directus 後台（`https://cms.aixwang.dev`）。
2. 點左下角自己的使用者頭像 → 進入自己的使用者頁面（User Detail 頁）。
3. 找到 **Token** 欄位，點擊產生一組隨機 token。
4. **馬上複製存好**：存檔後就不會再顯示這組 token 了（Directus 官方文件的原話：
   「Make sure to backup and copy the token above. For security reasons, you will not be able to
   view the token again after saving and navigate off this page.」）。
5. 存檔。

   來源：Directus 官方文件〈Access Tokens〉
   <https://directus.com/docs/guides/auth/tokens-cookies>
   （「Each user can have one static token that does not expire. This can be generated in the
   Data Studio within the user page.」）

跑腳本時帶這個 token：

```bash
export DIRECTUS_TOKEN="你的 token"
```

### 二選一：GA4 資料來源

#### 模式 A：GA4 Data API（自動化、可排程）

需要：

1. **GA4 Property ID（數字，不是 `G-` 開頭那組）**
   到 <https://analytics.google.com/> → Admin（左下角齒輪）→ 選要用的 Property → Property Settings，
   看到「PROPERTY ID」欄位，一串數字（例如 `123456789`）就是這個。
   本站前台埋的是 Measurement ID `G-91Z2F673C0`（`src/layouts/Base.astro:77`），
   **那不是 Property ID**，Data API 要用的是這串數字，兩個不是同一個東西。
   來源：<https://developers.google.com/analytics/devguides/reporting/data/v1/property-id>

2. **Google Cloud 專案 + 啟用 Google Analytics Data API**
   到 Google Cloud Console 建立或選一個專案，啟用「Google Analytics Data API」：
   <https://console.cloud.google.com/flows/enableapi?apiid=analyticsdata.googleapis.com>

3. **Service Account + JSON 金鑰**
   在同一個 Google Cloud 專案：IAM & Admin → Service Accounts → 建立一個 service account
   （不需要在 GCP 專案層級給任何角色，權限是在 GA4 那邊給），建立完後幫它產生一把 JSON 金鑰下載下來。
   （標準 GCP 流程，見 <https://cloud.google.com/iam/docs/service-accounts-create>）

4. **在 GA4 把這個 service account 加成 Property 的檢視者**
   GA4 後台 → Admin → 選對的 Property → **Property access management** → 新增使用者，
   帳號填 service account 的 email（`xxx@xxx.iam.gserviceaccount.com`），角色選 **Viewer**。
   Viewer 角色官方說明：「Can see settings and data … can see shared assets via the user
   interface or **the APIs**」——這就是 Data API 需要的最低權限。
   來源：<https://support.google.com/analytics/answer/9305587>

5. 設定環境變數：

   ```bash
   export GA4_PROPERTY_ID="123456789"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

跑：

```bash
npm run views:sync            # dry-run，只印計畫不寫入
npm run views:sync -- --apply # 真的寫回 Directus（要有 DIRECTUS_TOKEN）
```

腳本會自動查兩次：全期間（預設從 2015-08-14，GA4 官方文件承認的最早可能日期，可用
`--since 2024-01-01` 之類的參數覆蓋）與近 30 天（`30daysAgo` ~ `today`）。
**注意**：GA4 實際能查到多久以前的資料，取決於這個 GA4 資源自己的「資料保留期間」設定
（Admin → Data Settings → Data Retention），不是這支腳本能保證的；如果全期間查詢結果比預期少，
先去確認那邊的保留天數。

#### 模式 B：手動從 GA4 後台匯出 CSV（沒有 API 權限時的備案）

1. 到 GA4 → 報表 → 參與度 → 網頁和畫面（Engagement → Pages and screens）。
2. 維度選「網頁路徑」（Page path，不要選「網頁路徑和畫面類別」以外的組合維度，避免多一堆不相干的欄）。
3. 右上角設定時間區間：先抓一次「近 30 天」，再抓一次「全期間」（或你想要的起訖日）。
4. 每次都用右上角的匯出／分享圖示匯出 CSV，兩份分開存檔（例如 `ga4-total.csv`、`ga4-30d.csv`）。

跑：

```bash
npm run views:sync -- --csv-total ga4-total.csv --csv-30d ga4-30d.csv
npm run views:sync -- --csv-total ga4-total.csv --csv-30d ga4-30d.csv --apply
```

只給其中一份也可以（例如只想更新近 30 天），沒給的那個欄位這次就不會被動到：

```bash
npm run views:sync -- --csv-30d ga4-30d.csv
```

CSV 解析是容錯的：會自動找標題列（忽略前面的 `#` 開頭 metadata 行與空行），欄位比對依優先序
「使用者手動指定 > 英文精確比對（`Page path` / `Views`）> 中文候選字樣 > 英文寬鬆比對（含
`path` / `view` 字樣）」。**全部都找不到就會直接報錯**，不會用猜的欄位順序硬讀。

### CSV 欄名對不到怎麼辦

如果你的 GA4 介面語言是中文，欄名不會是英文的「Page path」「Views」。程式內建了一組**中文欄名候選字樣**：

- 路徑欄候選：`網頁路徑`、`頁面路徑`、`網頁`、`路徑`
- 瀏覽數欄候選：`觀看次數`、`檢視次數`、`瀏覽次數`、`瀏覽量`、`查看次數`

> **這份中文欄名清單是推測的，沒有拿真實的中文 GA4 匯出檔驗證過。** 如果你的 GA4 後台是中文
> 介面，實際欄名有可能跟這份清單不符，導致自動偵測失敗（或更糟，比對到不相關的欄位）。

不管是中文自動偵測失敗、或是任何其他語系／自訂欄名的情況，都可以用手動指定欄名當逃生門，
保證不分語系都能用：

```bash
npm run views:sync -- --csv-total ga4-total.csv --csv-30d ga4-30d.csv \
  --path-col "頁面路徑" --views-col "瀏覽量"
```

`--path-col` / `--views-col` 的比對規則是：把你貼的欄名跟 CSV 實際欄名都去除前後空白、
轉不分大小寫比對，只要「CSV 欄名裡包含你貼的字串」就算命中——所以直接複製 CSV 檔案裡看到的
完整欄名貼上就一定找得到，不用自己精簡。

如果自動偵測（含中文候選）都失敗，錯誤訊息會把**檔案前 15 行的原始內容**直接印出來，
你可以從裡面找出實際的路徑欄與瀏覽數欄欄名，再用 `--path-col` / `--views-col` 帶進去重跑一次。

誤判風險：像「使用者參與度」「工作階段」這類 GA4 也會匯出的欄位，不在瀏覽數欄的中文候選清單裡，
不會被誤判成瀏覽數欄；但如果你的 GA4 中文欄名剛好跟這份候選清單撞名或語意不同，還是有可能抓錯，
**看到【同步計畫】報表的數字明顯不合理時，優先懷疑是不是抓錯欄，改用 `--path-col` / `--views-col`
手動指定再確認一次**。

## Directus 欄位怎麼建立

先建欄位（只需要做一次）：

```bash
node tools/create-views-fields.mjs                 # dry-run，印出要送的 payload，不會真的建立
DIRECTUS_TOKEN=xxx node tools/create-views-fields.mjs --apply   # 真的建立（已存在的欄位會跳過）
```

或用 npm script：

```bash
npm run views:create-fields
DIRECTUS_TOKEN=xxx npm run views:create-fields -- --apply
```

## 同步流程與比對規則

1. 讀 GA4 資料（API 或 CSV），過濾出 `/blog/...` 的路徑。
2. 正規化路徑：去掉 query string 與 hash、統一大小寫、統一補上尾斜線
   （本站文章正規網址固定是 `/blog/<slug>/`；不帶尾斜線會被 307 導到有斜線版本，
   所以 GA4 裡兩種形式都可能出現，正規化後才比得起來）。
3. 套用 `tools/ga4-slug-aliases.json` 的舊 slug → 現在 slug 對應表，把改過 slug 的舊網址流量
   併回現在這篇文章。目前包含 `meta-api-application` → `threads-api-tutorial`：前者內容已整併進
   後者，因此只在統計層合併歷史流量，不代表網站會恢復舊網址轉址。之後改過文章 slug 時，
   請手動把舊 slug 加進這個檔案。
4. 加總同一 slug 的所有路徑變形。
5. 對到 Directus 文章清單（依 slug），同時嘗試讀回每篇文章目前的 `views` 值（給下面的「累積值
   不得倒退」保護用）。
6. 印出：
   - 對應表：哪個 GA4 路徑對到哪個 slug、加總後多少瀏覽數。
   - 對不到任何文章的路徑：`/blog/` 列表頁本身（正常，會排除）、以及 slug 在 Directus 查無此文章的
     （可能是還沒補進別名表的舊 slug、或本來就不存在的頁面產生的 404 流量）。
   - 【同步計畫】：依欄位分四段列出——有資料會更新的、來源未涵蓋而保留現值的、新值比現值小而跳過的、
     來源未涵蓋而明確寫 0 的。詳見下方「未涵蓋資料與累積值保護」。
7. `--apply` 才會真的 `PATCH` 回 Directus；預設一律 dry-run。

## 未涵蓋資料與累積值保護

> 這一節是為了修一個已在 dry-run 實測確認過的資料安全缺陷寫的：舊版邏輯只要 GA4 來源資料裡
> **沒有**某篇文章的 slug，就無條件把 `views` 寫成 `0`。GA4 後台匯出的 CSV 常常是部分資料
> （只有前 N 列、或日期區間沒涵蓋到早期流量），一旦拿部分匯出檔跑 `--apply`，先前已經同步累積的
> `views` 會被整批洗成 0，而且 Directus 沒有版本可以還原這種欄位值——是不可逆的資料破壞。
> 現在的行為改成下面這樣。

### 「來源沒有這篇文章的資料」不等於「這篇文章是 0」

GA4 資料裡完全沒有某篇文章的 slug，通常代表這次的匯出檔／查詢區間沒涵蓋到它，而不是這篇文章真的
沒人看過。兩個欄位的預設處理方式刻意不同：

| 欄位 | 未涵蓋時的預設行為 | 為什麼 |
| --- | --- | --- |
| `views`（累積值） | **跳過**，不寫入該欄位，保留 Directus 現值 | 累積值不該因為一份不完整的匯出檔而被砍成 0 |
| `views_30d`（近 30 天） | **寫 0** | 一篇文章近 30 天真的沒有任何一列，本來就代表近 30 天沒流量；跳過反而會留下過期的舊數字 |

dry-run 的【同步計畫】會把每個欄位分成四段列出，讓你在按 `--apply` 前一眼看出有沒有東西要被動到：

- **有資料，會更新**：GA4 這次的資料裡有對到這篇文章。
- **來源未涵蓋，保留現值不動**：這篇文章不在 GA4 這次的資料裡，依預設（或 `--no-zero-missing`）跳過。
- **新值比現值小，已跳過**：只有 `views` 欄位有這段，見下面「累積值不得倒退」。
- **來源未涵蓋，明確寫入 0**：這篇文章不在 GA4 這次的資料裡，但依預設（`views_30d`）或
  `--zero-missing` 被明確寫成 0。

用 `--zero-missing` / `--no-zero-missing` 可以整支覆蓋兩個欄位的預設行為：

- `--zero-missing`：強制兩個欄位遇到未涵蓋的 slug 都寫 0。**只有在你確定這次的匯出檔／查詢區間
  完整涵蓋所有文章時才該用**（例如你選的日期區間確定涵蓋了網站上線以來的全部流量，或你剛好在
  GA4 後台核對過匯出檔的列數跟文章數對得起來）。對一份不完整的匯出檔用這個旗標，等同於主動選擇
  把 `views` 累積值洗成 0，而且不可逆。
- `--no-zero-missing`：強制兩個欄位遇到未涵蓋的 slug 都跳過、保留現值（包含 `views_30d`）。
  想先確認「有哪些文章完全沒被這次資料涵蓋到」而不想連 `views_30d` 都被歸零時用這個。
- 不加任何一個：用上表的預設值（`views` 跳過、`views_30d` 寫 0）。

### 累積值（views）不得倒退的保護

同步前，腳本會先讀回每篇文章目前存在 Directus 的 `views` 值。如果這次算出的新值**比現有值小**，
預設會**跳過該篇並在報表印出警告**（列出 slug、現值、新值），不寫入，因為累積瀏覽數理論上只增不減，
變小幾乎必然代表這次的資料來源不完整或抓錯了欄位，而不是流量真的倒退。確定要覆蓋（例如你手動
清過 Directus 的 `views` 值、或確定新資料才是對的），才加 `--allow-decrease`。

`views_30d` 是滾動值，本來就可能合理地變小（例如文章退燒），不做這項檢查。

這項保護需要能讀到 `views` 欄位的現值才生效：如果 `views` 欄位還沒建立（例如第一次同步前忘了跑
`views:create-fields`），腳本會自動偵測、印出提示改用不含 `views` 的查詢重試，這次就不會做累積值
下降保護（報表會標示「累積值下降保護：停用」）。

## dry-run 怎麼看

不加 `--apply` 執行，會印出完整報表但不寫入任何東西，最後一行一定是：

```text
這是 dry-run，沒有任何資料被寫入 Directus。要真的寫入，加 --apply 並帶 DIRECTUS_TOKEN。
```

看報表時重點看這幾塊：

- **【同步計畫】**：依 `views` / `views_30d` 兩個欄位分四段列出（有資料會更新的、來源未涵蓋而保留
  現值的、新值比現值小而跳過的、來源未涵蓋而明確寫 0 的），見上方「未涵蓋資料與累積值保護」。
  重點看「保留現值不動」跟「跳過」這兩段的篇數合不合理——如果你以為這份匯出檔涵蓋了全部文章，
  結果這裡出現一大串，代表匯出檔其實不完整，先不要 `--apply`。
- **實際會送出的 PATCH**：這才是真的會寫進 Directus 的欄位與數字，`--apply` 前最後確認一次。
- **對不到任何文章的路徑**：如果看到眼熟的舊 slug，考慮加進 `tools/ga4-slug-aliases.json`
  再重跑一次。
- 所有選項可以跑 `node tools/sync-ga4-views.mjs --help` 看完整說明。

## 跑測試

路徑正規化、CSV 解析、slug 對應、別名合併都有測試，全部用寫死的假資料（沒有真憑證打不到真 API）：

```bash
npm run test:views
```

## 已知限制／沒實測過的部分

- **GA4 Data API 那條路徑（`@google-analytics/data`）已經實測過，不是「完全沒有真的打過」。**
  下面這段原本寫「這台機器沒有 `GOOGLE_APPLICATION_CREDENTIALS`、沒有 `GA4_PROPERTY_ID`，完全沒
  打過真的 API」，那是這份文件最初寫成時的狀態，**現在已經過時**：自 2026-08-16 起，正式排程
  （`tools/daily-ga4-views-cron.sh`）每天都有成功的真實 API 執行紀錄，見
  `~/.cache/aixwang-ga4-views/cron.log`（16 篇文章、10 個頁面、27-28 天每日資料、
  42-45 組流量入口）。`views:sync`／`page-views:sync` 的 dry-run 也已經用真實憑證直接對線上 GA4
  Property 跑過，數字合理（例如近 30 天 `/services/one-on-one/` 平均停留 77 秒、
  `/blog/threads-api-tutorial/` 平均停留 27 秒）。程式碼仍是照官方 quickstart
  （<https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries>）
  與 npm 套件 README 寫的，但這條路徑本身已經跑得動，不是理論上的推測。
- CSV 解析邏輯**仍然**沒有拿過真實匯出檔案驗證，是照 GA4 匯出報表的已知一般格式（開頭幾行 `#` metadata、
  逗號分隔、數字欄位可能有千分位逗號）寫的。內建的中文欄名候選字樣（見上方「CSV 欄名對不到怎麼辦」）
  是推測的，沒有拿真實的中文 GA4 匯出檔驗證過；如果猜錯或猜不到，一定要用 `--path-col` /
  `--views-col` 手動指定欄名，這條路徑不受語系或猜測正確與否影響。CSV 模式也不支援
  `avg_engagement_seconds_30d`（見上方「平均停留秒數」一節），這是既有限制，不是新增的缺口。
- `views:sync` 的 dry-run 已經用真實 GA4 資料對過線上 Directus 的真實文章清單（16 篇已發布文章），
  對應、加總與平均停留秒數的算法都照預期運作。當時一併驗過的別名合併
  （`meta-api-application` → `threads-api-tutorial`）目前仍在 `tools/ga4-slug-aliases.json`
  裡（`remapSlugAliases` 與其單元測試都保留，供之後改 slug 時繼續使用）。
