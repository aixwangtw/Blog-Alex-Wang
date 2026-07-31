# Blog 內容統計報告

產生時間：2026-07-31T05:05:36.040Z
資料來源：公開讀取（未帶 token，只含 status=published，不含草稿）
統計篇數：9 篇

## 1. 基本盤點

- 總篇數：9
- status 分布：published=9
- featured 篇數：6（占 66.7%）
- 最早發佈：2026-07-22
- 最新發佈：2026-07-28

## 2. 產出節奏

### 每日發文數

- 2026-07-22：6 篇
- 2026-07-24：1 篇
- 2026-07-25：1 篇
- 2026-07-28：1 篇

### 每週發文數（ISO 週）

- 2026-W30：8 篇
- 2026-W31：1 篇

### 相鄰兩篇發文間隔（依發佈日排序，同日發文間隔記為 0 天）

- 2026-07-22 `free-resources` → 2026-07-22 `from-part-time-to-freelance`：0 天
- 2026-07-22 `from-part-time-to-freelance` → 2026-07-22 `ig-carousel-size`：0 天
- 2026-07-22 `ig-carousel-size` → 2026-07-22 `why-i-built-tooka`：0 天
- 2026-07-22 `why-i-built-tooka` → 2026-07-22 `threads-api-tutorial`：0 天
- 2026-07-22 `threads-api-tutorial` → 2026-07-22 `instagram-api-tutorial`：0 天
- 2026-07-22 `instagram-api-tutorial` → 2026-07-24 `codex-windows-wsl-install`：2 天
- 2026-07-24 `codex-windows-wsl-install` → 2026-07-25 `codex-cli-wsl2-windows`：1 天
- 2026-07-25 `codex-cli-wsl2-windows` → 2026-07-28 `codex-usage-limit-reset`：3 天

最長空窗：3 天（2026-07-25 `codex-cli-wsl2-windows` → 2026-07-28 `codex-usage-limit-reset`）

## 3. 更新狀態（距今天數，由久到近排序）

| slug | updated_date | 距今天數 | 備註 |
|---|---|---|---|
| ig-carousel-size | 2026-07-22 | 9 |  |
| free-resources | 2026-07-22 | 9 |  |
| why-i-built-tooka | 2026-07-22 | 9 |  |
| codex-cli-wsl2-windows | 2026-07-25 | 6 |  |
| codex-windows-wsl-install | 2026-07-25 | 6 |  |
| codex-usage-limit-reset | 2026-07-30 | 1 |  |
| from-part-time-to-freelance | 2026-07-31 | 0 |  |
| threads-api-tutorial | 2026-07-31 | 0 |  |
| instagram-api-tutorial | 2026-07-31 | 0 |  |

## 4. 正文字數

定義：body 依序移除 fenced code block、inline code、圖片語法（含 alt 與 url）、連結語法（僅留文字）、
HTML 標籤本身、標題／清單／引言／表格／水平線等 markdown 標記與粗體斜體符號，剩餘文字以「非空白字元」逐字計數。

- 平均：1855.9 字
- 中位數：1484 字
- 最短：701 字
- 最長：4182 字

| slug | 字數 |
|---|---|
| codex-cli-wsl2-windows | 4182 |
| codex-usage-limit-reset | 2979 |
| codex-windows-wsl-install | 2506 |
| instagram-api-tutorial | 1897 |
| from-part-time-to-freelance | 1484 |
| threads-api-tutorial | 1390 |
| why-i-built-tooka | 808 |
| ig-carousel-size | 756 |
| free-resources | 701 |

## 5. 門檻檢查

- description 規則：40–80 字（來源：src/content.config.ts schema 註解，SKILL.md 本文未訂 description 長度規則）
- title 規則：未找到任何文件訂定 title 長度門檻（SKILL.md、content.config.ts 皆無），僅列分布，不做達標判定
- description 達標：1 篇；未達標：8 篇；缺 description：0 篇
- title 長度分布：最短 25 字、最長 50 字、平均 38 字

| slug | title 長度 | description 長度 | description 狀態 |
|---|---|---|---|
| ig-carousel-size | 36 | 91 | 未達標（超過 80 字） |
| free-resources | 25 | 97 | 未達標（超過 80 字） |
| from-part-time-to-freelance | 28 | 86 | 未達標（超過 80 字） |
| why-i-built-tooka | 30 | 91 | 未達標（超過 80 字） |
| threads-api-tutorial | 47 | 119 | 未達標（超過 80 字） |
| instagram-api-tutorial | 50 | 120 | 未達標（超過 80 字） |
| codex-cli-wsl2-windows | 45 | 85 | 未達標（超過 80 字） |
| codex-usage-limit-reset | 41 | 79 | 達標 |
| codex-windows-wsl-install | 40 | 94 | 未達標（超過 80 字） |

> 注意：description 40–80 字的門檻來自 `src/content.config.ts` schema 註解，並非 `SKILL.md` 本文；
> 目前有 8 / 9 篇不在此範圍內，未達標比例偏高，
> 建議跟人工確認這個門檻是否仍在使用、或需要更新（本報告只如實列出差異，不代表門檻本身有誤）。

## 6. 標籤

- 不重複標籤總數：24
- 平均每篇標籤數：3.8
- 孤兒標籤（只出現 1 次）：AI Agent、AI 自學、ChatGPT、IG 圖文、Instagram API、Threads API、Token、VS Code、WSL2、使用額度、免費資源、接案、教學影片、社群圖文、講師故事、輪播貼文、轉職心得

| 標籤 | 篇數 |
|---|---|
| Tooka | 3 |
| 新手入門 | 3 |
| Codex | 3 |
| AI 圖文生成 | 2 |
| 自動發文 | 2 |
| API 教學 | 2 |
| 安裝教學 | 2 |
| IG 圖文 | 1 |
| 輪播貼文 | 1 |
| 免費資源 | 1 |
| 教學影片 | 1 |
| 轉職心得 | 1 |
| 接案 | 1 |
| AI 自學 | 1 |
| 講師故事 | 1 |
| 社群圖文 | 1 |
| AI Agent | 1 |
| Threads API | 1 |
| Instagram API | 1 |
| WSL2 | 1 |
| ChatGPT | 1 |
| Token | 1 |
| 使用額度 | 1 |
| VS Code | 1 |

## 7. FAQ

- 平均每篇 FAQ 題數：6.3
- 完全沒有 FAQ 的文章：無

| slug | FAQ 題數 |
|---|---|
| ig-carousel-size | 3 |
| free-resources | 3 |
| why-i-built-tooka | 3 |
| codex-usage-limit-reset | 6 |
| codex-windows-wsl-install | 6 |
| from-part-time-to-freelance | 8 |
| threads-api-tutorial | 9 |
| instagram-api-tutorial | 9 |
| codex-cli-wsl2-windows | 10 |

## 8. 內文結構

| slug | H2 | H3 | 程式碼區塊 | 圖片 | 外部連結 | 站內連結 |
|---|---|---|---|---|---|---|
| ig-carousel-size | 4 | 0 | 0 | 0 | 2 | 3 |
| free-resources | 3 | 2 | 0 | 0 | 5 | 8 |
| from-part-time-to-freelance | 4 | 0 | 0 | 0 | 2 | 6 |
| why-i-built-tooka | 4 | 0 | 0 | 0 | 3 | 6 |
| threads-api-tutorial | 10 | 0 | 0 | 17 | 2 | 9 |
| instagram-api-tutorial | 10 | 0 | 0 | 26 | 8 | 5 |
| codex-cli-wsl2-windows | 8 | 1 | 14 | 6 | 7 | 3 |
| codex-usage-limit-reset | 13 | 0 | 8 | 1 | 8 | 2 |
| codex-windows-wsl-install | 6 | 1 | 2 | 5 | 3 | 2 |

## 9. 站內連結網絡

只統計 body 內指向 `/blog/<slug>` 的連結（markdown 連結與 HTML `<a href>` 皆算），同一篇文章重複連到同一個目標只算一次入連，自我連結不計入。

| slug | 被連入次數 |
|---|---|
| why-i-built-tooka | 3 |
| ig-carousel-size | 2 |
| free-resources | 2 |
| threads-api-tutorial | 2 |
| codex-cli-wsl2-windows | 1 |
| codex-windows-wsl-install | 1 |
| from-part-time-to-freelance | 0 |
| instagram-api-tutorial | 0 |
| codex-usage-limit-reset | 0 |

- 零連入的孤島文章：from-part-time-to-freelance、instagram-api-tutorial、codex-usage-limit-reset
- 沒有連出任何站內文章的死路文章：無
- 連到的 slug 在目前資料集中找不到對應文章（可能是草稿、已下架或 slug 打錯，本次未帶 token 故看不到草稿）：auto-posting-permissions、claude-or-codex-budget、how-to-start-learning-ai、meta-api-application、no-tech-background、what-is-ai-agent、what-to-prepare-before-learning-ai、why-desktop-claude-code-codex

## 10. slug

| slug | 長度 | 含非 ASCII 字元 |
|---|---|---|
| ig-carousel-size | 16 | 否 |
| free-resources | 14 | 否 |
| from-part-time-to-freelance | 27 | 否 |
| why-i-built-tooka | 17 | 否 |
| threads-api-tutorial | 20 | 否 |
| instagram-api-tutorial | 22 | 否 |
| codex-cli-wsl2-windows | 22 | 否 |
| codex-usage-limit-reset | 23 | 否 |
| codex-windows-wsl-install | 25 | 否 |

