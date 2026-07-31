# GA4 文章瀏覽數同步回 Directus

把 GA4（Google Analytics 4）記錄的 `/blog/<slug>/` 瀏覽數，定期同步回 Directus `articles`
collection 的三個欄位：

| 欄位 | 型別 | 說明 |
| --- | --- | --- |
| `views` | integer | 累積（全期間）瀏覽數 |
| `views_30d` | integer | 近 30 天瀏覽數 |
| `views_synced_at` | timestamp | 最後一次同步時間 |

三個欄位在 Directus 後台都是**唯讀**（`meta.readonly = true`），手動改了也會在下次同步時被覆蓋。

> 這份文件與對應的程式碼是在**沒有任何 GA4／Google Cloud 憑證**的環境下寫的。GA4 Data API 路徑
> （下方「模式 A」）完全沒有真的打過 API 驗證，CSV 解析（「模式 B」）也沒有拿真實匯出檔案對過格式。
> 兩者都用官方文件描述的格式與寫死的假資料寫測試（`tools/lib/ga4-views-lib.test.mjs`），
> 實際串接後如果格式跟預期不同，錯誤訊息會直接印出來，不會默默吃掉或用猜的填資料。

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
   併回現在這篇文章。**這個檔案目前是空的 `{}`**——原本有一組 `meta-api-application` →
   `threads-api-tutorial`，2026-07-31 依指示連同該網址的轉址一起移除。改過文章 slug 時，
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

- GA4 Data API 那條路徑（`@google-analytics/data`）完全沒有真的打過，因為這台機器沒有
  `GOOGLE_APPLICATION_CREDENTIALS`、沒有 `GA4_PROPERTY_ID`。程式碼是照官方 quickstart
  （<https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries>）
  與 npm 套件 README 寫的，第一次真的跑之前要有心理準備可能要修。
- CSV 解析邏輯沒有拿過真實匯出檔案驗證，是照 GA4 匯出報表的已知一般格式（開頭幾行 `#` metadata、
  逗號分隔、數字欄位可能有千分位逗號）寫的。內建的中文欄名候選字樣（見上方「CSV 欄名對不到怎麼辦」）
  是推測的，沒有拿真實的中文 GA4 匯出檔驗證過；如果猜錯或猜不到，一定要用 `--path-col` /
  `--views-col` 手動指定欄名，這條路徑不受語系或猜測正確與否影響。
- `views:sync` 的 dry-run 已經用手刻的假 CSV 對過線上 Directus 的真實文章清單（9 篇已發布文章），
  對應與加總邏輯照預期運作；但這只驗證了「Directus 讀取＋比對邏輯」，沒有驗證「GA4 資料真的長這樣」。
  當時一併驗過的別名合併（`meta-api-application` → `threads-api-tutorial`）已於 2026-07-31 移除，
  別名機制本身仍在（`remapSlugAliases` 與其單元測試都保留），只是對應表目前是空的。
