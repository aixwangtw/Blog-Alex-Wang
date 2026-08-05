# Code Fence／Blockquote 分類待確認清單

產生時間：2026-08-05T13:01:18.786Z
資料來源：Directus CMS（https://cms.aixwang.dev），公開讀取，只含 status=published，共 9 篇
本報告只讀 Directus CMS，不曾寫入任何資料；本檔案本身之外，沒有修改任何檔案。

## 統計摘要

- 掃描文章數：9 篇
- 待改區塊總數（fence `text`/無標記 ＋ 非說明性 blockquote）：22
  - 建議 `bash`：2
  - 建議 `prompt`：8
  - 建議 `output`：4
  - 建議 `toolcmd`（AI 工具介面指令）：4，其中 `codex` 4 個
  - UNSURE（待人工判斷，不硬猜）：4

| 文章 slug | fence 待改 | blockquote 待改 | 其中 UNSURE |
|---|---|---|---|
| codex-cli-wsl2-windows | 8 | 0 | 0 |
| codex-usage-limit-reset | 7 | 0 | 1 |
| codex-windows-wsl-install | 2 | 0 | 0 |
| threads-api-tutorial | 0 | 5 | 3 |

沒有待改區塊的文章：free-resources、from-part-time-to-freelance、ig-carousel-size、instagram-api-tutorial、why-i-built-tooka

## 分類目標與規則對照

| 目標標記 | 內容 |
|---|---|
| `bash` / `powershell` | 終端機指令（現有標記已準確，不在本次掃描範圍） |
| `prompt` | 提示詞——要貼進 AI 對話框的自然語言指示 |
| `output` | 執行結果、錯誤訊息、版本號字串、純網址 |
| `toolcmd`（語言標記用工具名，如 `codex`／`claude-code`） | 打在 AI 工具互動介面裡的指令（例如 Codex CLI 的 `/model`），不是系統終端機指令、也不是自然語言提示詞 |

規則清單（依判斷順序）：R1 空區塊 → R2 純 URL → R3 純版本字串 → R4 含錯誤關鍵字 → 
R5 AI 工具介面斜線指令（判斷是哪個工具：區塊正上方文字明確提到工具名稱 → HIGH；退而看全文標題／
slug 是否唯一指向某工具 → MEDIUM；兩層都對不到唯一工具則 UNSURE，不用猜的湊一個工具名） → 
R6 已知 CLI 名稱開頭 → R7 以「請」開頭 → 
R8 中文比例高且含「請」→ R9 中文比例高但沒有「請」（UNSURE） → R10 都不命中（UNSURE）。
每條規則的完整依據寫在 `tools/scan-code-fences.mjs` 的 `classifyText()` 函式註解裡，
R5 用到的工具名稱關鍵字清單在同檔案的 `TOOL_CONTEXT_MARKERS`，之後要支援 Gemini CLI、Cursor
等新工具，在該清單加一筆 `{ tool, pattern }` 即可，不用改判斷邏輯本身。

## 依文章分組的待改清單（已排除 UNSURE，UNSURE 集中在最後一節）

### codex-cli-wsl2-windows（Codex 安裝教學（下）：Windows 版 Codex CLI 與 WSL2 進階安裝）

#### 1. 第 11 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`output`**
- 信心度：HIGH
- 判斷依據：`R2_URL_ONLY` — 整個區塊只有一行，且該行是完整的 http(s) URL。
- 內容前 120 字：
  > https://aixwang.dev/blog/codex-cli-wsl2-windows/

#### 2. 第 29 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：HIGH
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請幫我在這台 Windows 電腦安裝最新版 Codex CLI。 請實際執行安裝、設定目前使用者的 PATH，並用 codex --version 確認安裝結果。 完成後，我要能在重新開啟的 PowerShell、Windows Term…

#### 3. 第 91 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`bash`**
- 信心度：HIGH
- 判斷依據：`R6_KNOWN_CLI` — 第一個詞「codex」是已知 CLI 名稱清單裡的指令，內容幾乎沒有中文，符合「短的英文命令列樣式」。
- 內容前 120 字：
  > codex --version

#### 4. 第 101 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：MEDIUM
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 我已經安裝 Codex CLI，但 codex --version 顯示的不是剛安裝的版本。 請幫我確認電腦裡是否有多份 Codex、目前實際開啟的是哪一份， 並在不要刪除 Node.js、WSL 或其他工具的前提下修正。 完成後請重新執行…

#### 5. 第 138 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`bash`**
- 信心度：HIGH
- 判斷依據：`R6_KNOWN_CLI` — 第一個詞「codex」是已知 CLI 名稱清單裡的指令，內容幾乎沒有中文，符合「短的英文命令列樣式」。
- 內容前 120 字：
  > codex

#### 6. 第 152 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：HIGH
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請幫我安裝並執行這個 GitHub 開源工具： https://github.com/js0980420/tooka 請先閱讀專案的 README，確認我的電腦環境與安裝方式， 再依照官方說明完成安裝、啟動與測試；如果遇到錯誤，請保留錯誤原…

#### 7. 第 252 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`output`**
- 信心度：HIGH
- 判斷依據：`R4_ERROR_KEYWORD` — 內容含 WARNING / ERROR / error: / warning: / fatal: 等錯誤輸出常見關鍵字。
- 內容前 120 字：
  > WARNING: Multiple managed Codex installs can be ambiguous because PATH order decides which one runs.

#### 8. 第 258 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`output`**
- 信心度：HIGH
- 判斷依據：`R4_ERROR_KEYWORD` — 內容含 WARNING / ERROR / error: / warning: / fatal: 等錯誤輸出常見關鍵字。
- 內容前 120 字：
  > WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary di…

### codex-usage-limit-reset（Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學）

#### 1. 第 25 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`codex`**
- 信心度：HIGH
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/model」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /model

#### 2. 第 37 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`codex`**
- 信心度：HIGH
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/new」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /new

#### 3. 第 43 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：HIGH
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請檢查這個專案目前未提交的變更，只整理問題，不要修改檔案。

#### 4. 第 53 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`codex`**
- 信心度：MEDIUM
- 判斷依據：`R5_TOOLCMD_ARTICLE_CONTEXT` — 「/compact」是斜線開頭的工具介面指令；區塊正上方沒有明確提到工具名稱，但整篇文章標題／slug 明確只指向「codex」（標題：Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學，slug：codex-usage-limit-reset），信心度中等。
- 內容前 120 字：
  > /compact

#### 5. 第 76 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：HIGH
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請把這篇草稿整理成可發布的繁體中文文章。 保留我的語氣與所有實測步驟，不要增加沒驗證過的功能。 完成後檢查標題、description、圖片路徑與站內連結，但先不要發布。

#### 6. 第 143 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`codex`**
- 信心度：HIGH
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/usage」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /usage

### codex-windows-wsl-install（Codex 安裝教學（上）：VS Code + Codex 插件版，不用碰終端機）

#### 1. 第 15 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`output`**
- 信心度：HIGH
- 判斷依據：`R2_URL_ONLY` — 整個區塊只有一行，且該行是完整的 http(s) URL。
- 內容前 120 字：
  > https://aixwang.dev/blog/codex-windows-wsl-install/

#### 2. 第 86 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**`prompt`**
- 信心度：HIGH
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請在我的使用者目錄建立一個名為「你想要的資料夾名稱」的新資料夾， 並用 VS Code 開啟它。

### threads-api-tutorial（Threads API 申請教學：從拿 Token、發出第一篇貼文到 Token 自動永久延期）

#### 1. 第 71 行附近（blockquote）

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`
- 建議標記：**`prompt`**
- 信心度：MEDIUM
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 這步別跳過，沒接受邀請就去拿 Token 只會得到 401。

#### 2. 第 81 行附近（blockquote）

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`
- 建議標記：**`prompt`**
- 信心度：MEDIUM
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 這裡生的短期 Token 1 小時就過期。請 Claude Code 用 API 換成長期 Token（60 天），換完加進 `.env` 環境變數。

## UNSURE 集中處理（優先看這裡）

### codex-usage-limit-reset（Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學）

#### 1. 第 104 行附近（fence code block）

- 目前標記：`text`
- 建議標記：**UNSURE（不確定，需人工判斷）**
- 信心度：LOW
- 判斷依據：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 只看 src/pages/blog 和 src/content.config.ts。 先找出原因並回報，不要掃描 node_modules，也不要修改其他目錄。

### threads-api-tutorial（Threads API 申請教學：從拿 Token、發出第一篇貼文到 Token 自動永久延期）

#### 1. 第 43 行附近（blockquote）

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`
- 建議標記：**UNSURE（不確定，需人工判斷）**
- 信心度：LOW
- 判斷依據：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 送出前再三確認：用例選錯不能改，只能整支 App 重建。

#### 2. 第 53 行附近（blockquote）

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`
- 建議標記：**UNSURE（不確定，需人工判斷）**
- 信心度：LOW
- 判斷依據：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 💡 「應用程式角色」分頁是新手最常找不到的入口——記住這個位置，後面所有測試人員設定都從這裡進。

#### 3. 第 89 行附近（blockquote）

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`
- 建議標記：**UNSURE（不確定，需人工判斷）**
- 信心度：LOW
- 判斷依據：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 兩個都要勾，scope 缺一個，發文時拿到的就是 403。
