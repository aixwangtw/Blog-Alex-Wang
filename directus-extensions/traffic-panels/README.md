# directus-extension-traffic-panels

流量統計儀表板用的自訂 Directus 擴充（bundle），相容 Directus 11.17.4
（`@directus/extensions-sdk` 17.1.4，與 11.17.4 映像內建的版本相同）。資料用登入者自己的權限查（`useApi`），沒有寫死 token。

| Panel id | 用途 | 選項 |
| --- | --- | --- |
| `traffic-summary-card` | 並排顯示「當日／近 30 天／累積」三個數字，滑鼠移上去彈出細項 | `kind`：`users`／`articles`／`pages`；`timezone` |
| `traffic-content-table` | 每篇文章（或每頁）一列，可排序、拖拉欄寬、點一列展開逐日明細 | `kind`：`articles`／`pages`；`timezone` |
| `traffic-source-table` | 流量入口表：入口｜進站頁（中文標題，hover 顯示路徑）｜造訪次數｜觀看次數；可排序、拖拉欄寬（localStorage `traffic-panels:widths:sources`） | 無 |

- 資料來源：`audience_metrics`（key=site）、`articles`、`page_views`、`daily_content_views`。
- 文章與逐日明細的對應鍵是路徑 `/blog/<slug>/`（與 `tools/sync-ga4-daily-views.mjs` 一致），頁面用 `page_views.path`。
- 「當日」以 `timezone`（預設 `Asia/Taipei`）判斷今天，需與 GA4 Property 時區一致；這點只是預設值，沒有查證 Property 實際時區。
- 欄寬存在瀏覽器 localStorage（`traffic-panels:widths:articles`／`:pages`），清掉就回預設。

## 建置

```bash
cd directus-extensions/traffic-panels
npm install
npm run build        # 產生 dist/app.js、dist/api.js（dist/ 與 node_modules/ 不進 git）
```

## 安裝到主機（Hetzner `lineliff-prod`）

**未安裝前，不要對儀表板跑 `node tools/create-views-dashboard.mjs --apply`**（腳本會偵測到擴充不存在而中止，避免建出空 panel）。

擴充只在 Directus 啟動時載入（沒開 `EXTENSIONS_AUTO_RELOAD`），所以安裝一定要重啟 `directus` 容器一次；
預估中斷約 15～30 秒（本機 SQLite 實測重啟到可連線 13.6 秒；主機用的資料庫與關機等待時間不同，這個數字是估計）。

### 方案 A（建議）：`docker cp` 進具名 volume

不改 compose；容器內 `/directus/extensions` 就是 volume `directus-extensions`，複製進去就寫入 volume。

```bash
# 在本機
cd directus-extensions/traffic-panels && npm ci && npm run build
tar czf /tmp/traffic-panels.tgz --transform 's,^,directus-extension-traffic-panels/,' package.json dist
scp /tmp/traffic-panels.tgz lineliff-prod:/tmp/

# 在主機（ssh lineliff-prod）
cd ~/directus
CID=$(docker compose ps -q directus)            # 服務名稱以 docker-compose.yml 為準
docker exec "$CID" ls /directus/extensions       # 先確認現況（應看到 @directus-labs 的 table-view-panel）
tar xzf /tmp/traffic-panels.tgz -C /tmp
docker cp /tmp/directus-extension-traffic-panels "$CID":/directus/extensions/
docker exec -u root "$CID" chown -R node:node /directus/extensions/directus-extension-traffic-panels   # 使用者名稱以映像為準
docker compose restart directus                  # 這一步才會中斷服務

# 驗證
curl -s https://cms.aixwang.dev/server/ping
# 後台 Settings > Extensions 應出現 directus-extension-traffic-panels（含三個 panel）
```

之後更新擴充：重複 build、`docker cp` 覆蓋、`docker compose restart directus`。

### 方案 B：bind mount（之後更新較方便，但要改 compose）

在 `~/directus/docker-compose.yml` 的 `volumes:` 多加**單一資料夾**的 bind mount（不要取代具名 volume，否則會蓋掉已裝的 registry 擴充）：

```yaml
    volumes:
      - directus-extensions:/directus/extensions
      - ./local-extensions/directus-extension-traffic-panels:/directus/extensions/directus-extension-traffic-panels:ro
```

把 `package.json` 與 `dist/` 放到 `~/directus/local-extensions/directus-extension-traffic-panels/`，再 `docker compose up -d`（會重建容器，中斷時間與重啟相近）。
比較：A 不動 compose、步驟少；B 擴充檔案在 compose 旁邊、版本一目了然，但多一個要維護的路徑，且 compose 設定與 repo 外的主機檔案分離。

### 裝好之後

```bash
DIRECTUS_TOKEN=... node tools/create-views-dashboard.mjs          # 先 dry-run
DIRECTUS_TOKEN=... node tools/create-views-dashboard.mjs --apply  # 覆蓋儀表板，舊 panel 會被移除
```

## 回復

- 還沒跑 `--apply`：刪掉主機上的資料夾後重啟即可，儀表板完全沒動過。
  `docker exec "$CID" rm -rf /directus/extensions/directus-extension-traffic-panels && docker compose restart directus`
- 已跑 `--apply`：先 `git revert` 本次對 `tools/create-views-dashboard.mjs` 的修改，再 `--apply`（舊 panel 會依名稱重建，新 panel 要手動刪或加進 OBSOLETE），最後才移除擴充。順序反過來會留下空 panel。
- 標題中文化與時間格式（`tools/localize-traffic-fields.mjs`）獨立於擴充，不必回復。

## 本機驗證（可重做）

用臨時容器掛上擴充試用：

```bash
docker run -d --name dx-test -p 18055:8055 -e SECRET=x1234567890123 -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=testpass123 \
  -e DB_CLIENT=sqlite3 -e DB_FILENAME=/directus/database/data.db \
  -v "$PWD":/directus/extensions/directus-extension-traffic-panels:ro directus/directus:11.17.4
docker rm -f dx-test    # 用完刪除（連同匿名 volume：docker volume prune）
```
