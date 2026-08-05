# Code Fence／Blockquote 修改提案（人工確認後才套用）

產生時間：2026-08-05T13:01:18.786Z
資料來源：Directus CMS（https://cms.aixwang.dev），公開讀取，只含 status=published，共 9 篇
本提案只讀 Directus CMS 產生，**沒有寫入或修改任何 CMS 內容，也沒有送出 Authorization header**。
每篇文章下方附上「修改後完整 body」，供人工逐條核對判斷依據後，自行整段複製貼回 Directus CMS 後台存檔——本腳本本身不會、也不能自動送出。

## 使用方式

1. 看下面「建議套用的區塊」，逐條核對判斷依據是否合理。
2. 核對通過後，把該篇「修改後完整 body」整段複製，貼回 Directus CMS 後台該篇文章的 body 欄位並存檔。
3. 「維持原樣不動」清單裡的區塊全部沒有改——這是分類規則判斷不出唯一結果，不是信心不足硬湊；如果人工看過想要另外處理，要自己決定新標記後手動修改，不在本提案範圍內。

## 全站統計

- 掃描到候選區塊的文章：4 篇
- 建議套用（HIGH + MEDIUM）：18 個
  - HIGH：14
  - MEDIUM：4
- 維持原樣（UNSURE，本提案沒有改）：4 個

| 文章 slug | 建議套用 | 維持原樣（UNSURE） |
|---|---|---|
| codex-cli-wsl2-windows | 8 | 0 |
| codex-usage-limit-reset | 6 | 1 |
| codex-windows-wsl-install | 2 | 0 |
| threads-api-tutorial | 2 | 3 |

## 依文章分組

### codex-cli-wsl2-windows（Codex 安裝教學（下）：Windows 版 Codex CLI 與 WSL2 進階安裝）

建議套用 8 個（HIGH 7／MEDIUM 1）；維持原樣 0 個。

#### 建議套用的區塊

##### 1. 第 11 行附近（fence code block）

- 改動前：```text
- 改動後：```output
- 信心度：**HIGH**
- 判斷依據：`R2_URL_ONLY` — 整個區塊只有一行，且該行是完整的 http(s) URL。
- 內容前 120 字：
  > https://aixwang.dev/blog/codex-cli-wsl2-windows/

##### 2. 第 29 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**HIGH**
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請幫我在這台 Windows 電腦安裝最新版 Codex CLI。 請實際執行安裝、設定目前使用者的 PATH，並用 codex --version 確認安裝結果。 完成後，我要能在重新開啟的 PowerShell、Windows Term…

##### 3. 第 91 行附近（fence code block）

- 改動前：```text
- 改動後：```bash
- 信心度：**HIGH**
- 判斷依據：`R6_KNOWN_CLI` — 第一個詞「codex」是已知 CLI 名稱清單裡的指令，內容幾乎沒有中文，符合「短的英文命令列樣式」。
- 內容前 120 字：
  > codex --version

##### 4. 第 101 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**MEDIUM**
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 我已經安裝 Codex CLI，但 codex --version 顯示的不是剛安裝的版本。 請幫我確認電腦裡是否有多份 Codex、目前實際開啟的是哪一份， 並在不要刪除 Node.js、WSL 或其他工具的前提下修正。 完成後請重新執行…

##### 5. 第 138 行附近（fence code block）

- 改動前：```text
- 改動後：```bash
- 信心度：**HIGH**
- 判斷依據：`R6_KNOWN_CLI` — 第一個詞「codex」是已知 CLI 名稱清單裡的指令，內容幾乎沒有中文，符合「短的英文命令列樣式」。
- 內容前 120 字：
  > codex

##### 6. 第 152 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**HIGH**
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請幫我安裝並執行這個 GitHub 開源工具： https://github.com/js0980420/tooka 請先閱讀專案的 README，確認我的電腦環境與安裝方式， 再依照官方說明完成安裝、啟動與測試；如果遇到錯誤，請保留錯誤原…

##### 7. 第 252 行附近（fence code block）

- 改動前：```text
- 改動後：```output
- 信心度：**HIGH**
- 判斷依據：`R4_ERROR_KEYWORD` — 內容含 WARNING / ERROR / error: / warning: / fatal: 等錯誤輸出常見關鍵字。
- 內容前 120 字：
  > WARNING: Multiple managed Codex installs can be ambiguous because PATH order decides which one runs.

##### 8. 第 258 行附近（fence code block）

- 改動前：```text
- 改動後：```output
- 信心度：**HIGH**
- 判斷依據：`R4_ERROR_KEYWORD` — 內容含 WARNING / ERROR / error: / warning: / fatal: 等錯誤輸出常見關鍵字。
- 內容前 120 字：
  > WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary di…

#### 修改後完整 body（可直接整段複製貼回 CMS；UNSURE 區塊維持原樣）

````markdown

> [!note] 本篇是進階安裝，預設你已經裝好 VS Code 和 Codex 插件。還沒裝的請先看[上集：VS Code + Codex 插件版](/blog/codex-windows-wsl-install/)——日常使用其實插件版就夠，確定需要終端機和自動化再回來。

## 這一篇要裝什麼：CLI 為主，WSL2 選用

- 主要工具｜Codex CLI：在終端機用打字的方式操作 Codex
- 選用工具｜WSL2：Windows 裡的 Linux 工作區，遇到偏向 Linux 的專案再裝

如果安裝中途失敗，可以把這篇文章的連結與終端機顯示的完整錯誤原文一起貼給 AI：

```output
https://aixwang.dev/blog/codex-cli-wsl2-windows/
```

複製終端機的錯誤訊息和平常複製文字不太一樣：

1. 先用滑鼠把完整錯誤訊息反白。
2. 在反白的文字上按滑鼠右鍵複製。
3. 回到 Codex 的訊息輸入框，再按滑鼠右鍵貼上。

不要直接在終端機按 `Ctrl+C`。在許多終端機裡，`Ctrl+C` 的用途是停止目前正在執行的指令，不是複製文字。

請保留錯誤訊息原文，不要只描述「安裝失敗」。AI 才能對照本文的安裝環境、指令與實測畫面，判斷你卡在哪一步。

## 第一步：請 Codex 插件用自然語言安裝 Codex CLI

不需要自己複製一長串 PowerShell 指令。回到 VS Code 右側的 Codex 插件，直接貼上下面這段話：

```prompt
請幫我在這台 Windows 電腦安裝最新版 Codex CLI。
請實際執行安裝、設定目前使用者的 PATH，並用 codex --version 確認安裝結果。
完成後，我要能在重新開啟的 PowerShell、Windows Terminal 或 VS Code 終端機中，
進入任何專案資料夾並輸入 codex 啟動。
如果途中出現錯誤，請讀取完整錯誤訊息並繼續排除。
```

Codex 準備執行安裝指令時，畫面可能會要求你確認權限。先看清楚它準備執行的內容，再按下允許。接著等待 Codex 完成安裝、設定 PATH，並顯示 `codex --version` 的驗證結果。

安裝完成後：

1. 完全關閉所有 VS Code、PowerShell 與 Windows Terminal 視窗。
2. 重新開啟 VS Code 與剛才的專案資料夾。
3. 選擇 **終端機（Terminal）→ 新增終端機（New Terminal）**。
4. 輸入 `codex`，確認 CLI 能正常開啟。

這項安裝只需要完成一次。未來可以在任何專案資料夾使用 VS Code、Cursor、Antigravity、PowerShell、CMD 或其他終端工具，輸入 `codex` 啟動，不限定只能在 VS Code 裡使用。

<details>
<summary><strong>補充：為什麼我安裝的是隔離版？</strong></summary>

<p><code>Codex-Isolated</code> 是本文自訂的資料夾名稱，不是 OpenAI 另外推出的 Codex 版本。為了不覆蓋電腦原有版本，本次實測刻意將執行檔與 <code>CODEX_HOME</code> 分開，讓測試用的登入資料、設定、記錄與工作階段不和原本的 Codex 共用。</p>

<p>第一次只需要安裝一套 CLI 的新手，直接請插件依官方預設方式安裝即可，不需要指定 <code>Codex-Isolated</code>，也不要照抄本次實測的特殊路徑。</p>

<p>隔離安裝不代表 Codex 看不到專案。只要檔案位於目前開啟且允許操作的專案資料夾，Codex 仍可讀取其中的文章草稿、安裝紀錄與其他專案檔案。不要把密碼、API 金鑰或其他不希望 AI 讀取的私人資料放進專案資料夾。</p>

<p>本次安裝器辨識為 <code>Windows (x64)</code>，並成功安裝 Codex CLI <code>0.145.0</code>：</p>

<img src="/images/blog/codex-windows-wsl-install/09-codex-windows-isolated-install.png" alt="Codex 在 Windows PowerShell 實際安裝並驗證 Codex CLI">

<p>本次實測使用的 CLI 路徑是：</p>

<pre><code>C:\Users\你的帳號\AppData\Local\Programs\OpenAI\Codex-Isolated\bin\codex.exe</code></pre>

</details>

<details>
<summary><strong>如果輸入 codex 出現 CommandNotFoundException，點此查看實測錯誤</strong></summary>

<pre><code>codex : 無法辨識 'codex' 詞彙是否為 Cmdlet、函數、指令檔或可執行程式的名稱。
請檢查名稱拼字是否正確，如果包含路徑的話，請確認路徑是否正確，然後再試一次。
位於 線路:1 字元:1
+ codex
+ ~~~~~
    + CategoryInfo          : ObjectNotFound: (codex:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException</code></pre>

<img src="/images/blog/codex-windows-wsl-install/06-vscode-codex-installed-cli-not-found.png" alt="尚未安裝 Codex CLI 時，Windows PowerShell 輸入 codex 的實機結果">

<p>這個錯誤代表當時 CLI 尚未安裝，或目前開啟的視窗尚未讀取新的 PATH。請把完整錯誤原文貼回 Codex，請它繼續檢查；如果剛完成安裝，也要先完全關閉並重新開啟 VS Code 與終端機。</p>
</details>

## 第二步：安裝後確認——現在開啟的是不是剛裝好的 Codex？

看到「安裝成功」後，還要做一次簡單確認：

1. 完全關閉並重新開啟 VS Code 與終端機。
2. 用 VS Code 開啟剛才的專案資料夾。
3. 新增終端機並輸入：

```bash
codex --version
```

畫面會顯示目前真正開啟的 Codex 版本。如果版本和剛才安裝完成時顯示的一樣，就可以繼續使用。

如果顯示的數字反而比較舊，通常不是安裝失敗，而是電腦裡原本就有另一份 Codex。可以把它想成電腦裡有兩扇都寫著「Codex」的門；你雖然裝好新的那一份，電腦卻先打開了舊的門。

這時不需要自己研究 PATH，也不要急著刪除 Node.js、WSL 或其他工具。把下面這段話貼給 Codex 插件：

```prompt
我已經安裝 Codex CLI，但 codex --version 顯示的不是剛安裝的版本。
請幫我確認電腦裡是否有多份 Codex、目前實際開啟的是哪一份，
並在不要刪除 Node.js、WSL 或其他工具的前提下修正。
完成後請重新執行 codex --version 驗證。
```

<details>
<summary><strong>查看本次遇到兩份 Codex 的實測紀錄</strong></summary>

<p>本次測試電腦原本有 Codex CLI <code>0.144.6</code>，後來又隔離安裝了 <code>0.145.0</code>。直接輸入 <code>codex</code> 時，電腦仍先開啟原有的舊版本：</p>

<img src="/images/blog/codex-windows-wsl-install/04-codex-version-check.png" alt="兩份 Codex CLI 造成實際開啟版本不同">

<pre><code>安裝器下載的新版本：0.145.0
直接輸入 codex：0.144.6
原因：電腦先找到原本的版本</code></pre>

<p>排查時實際使用的技術指令如下。新手不需要先理解，可以交給 Codex 執行：</p>

<pre><code>type -a codex
which codex
codex --version</code></pre>
</details>

## 第三步：以後怎麼開啟 Codex CLI？

Codex CLI 只需要安裝一次，不必每次開新專案都重新安裝。

最適合新手的開啟方式：

1. 開啟 VS Code。
2. 選擇 **檔案（File）→ 開啟資料夾（Open Folder...）**。
3. 選擇想讓 Codex 操作的專案資料夾。
4. 選擇 **終端機（Terminal）→ 新增終端機（New Terminal）**。
5. 在下方終端機輸入：

```bash
codex
```

按下 Enter 後，終端機會開啟 Codex CLI：

![在 VS Code 下方終端機輸入 codex，成功開啟 Codex CLI](/images/blog/codex-windows-wsl-install/13-vscode-terminal-start-codex-cli.png)

如果畫面要求登入，依照提示使用 ChatGPT 帳號登入。CLI 與 IDE 插件在同一個執行環境下可以共用 Codex 設定與登入資料；若一個安裝在 Windows、另一個安裝在 WSL，則可能各自使用不同的 home 目錄。

VS Code 會自動讓新終端機位於剛開啟的專案資料夾，不需要先輸入 `cd`。Codex 會以這個資料夾作為工作位置，讀取並修改該專案。

可以拿 Tooka 開源專案實測。把下面這段直接貼給 CLI：

```prompt
請幫我安裝並執行這個 GitHub 開源工具：
https://github.com/js0980420/tooka

請先閱讀專案的 README，確認我的電腦環境與安裝方式，
再依照官方說明完成安裝、啟動與測試；如果遇到錯誤，請保留錯誤原文並繼續排查。
```

這類需要連續讀取說明、執行安裝指令、查看結果與排除錯誤的工作，使用 CLI 通常比插件版少切換視窗，也不必一直搬運終端機訊息，操作會順暢許多。

### 選用：把 CLI 權限改成 Bypass

如果不想在 CLI 執行每個步驟時都手動同意，可以在 CLI 的權限選項中改成 **Bypass**。這會略過執行前的確認與沙盒限制，讓安裝流程更連續，但也代表 Codex 能直接執行更多電腦操作。

在已開啟的 Codex CLI 中操作：

1. 點一下畫面下方的訊息輸入框。
2. 輸入 `/permissions`，再按 Enter。
3. 使用方向鍵選擇 **Bypass approvals and sandbox**；部分版本可能只顯示 **Bypass**。
4. 按 Enter 套用。
5. 輸入 `/status`，確認目前使用的核准與沙盒設定。

如果權限選單沒有 Bypass，可以先輸入 `/quit` 離開 CLI，再回到終端機輸入：

```powershell
codex --yolo
```

`--yolo` 是 `--dangerously-bypass-approvals-and-sandbox` 的簡寫，兩者都會讓 Codex 不經確認執行指令，並關閉沙盒限制。

只應在獨立的測試環境、沒有私人資料且可以重新建立的專案中使用 Bypass。專案或電腦中若有私人文件、密碼、API 金鑰或重要檔案，請維持預設權限，不要開啟這個模式。

官方說明：[Codex CLI 權限與沙盒](https://learn.chatgpt.com/docs/agent-approvals-security)、[Codex CLI 指令參數](https://learn.chatgpt.com/docs/cli/reference)。

如果已經熟悉終端機，也可以使用：

```bash
cd 你的專案資料夾
codex
```

這個操作不限定要在 VS Code 裡完成。只要該終端機找得到 `codex` 指令，就可以使用：

- VS Code 的整合終端機；
- Cursor、Antigravity 或其他 IDE 的終端機；
- Windows Terminal；
- PowerShell；
- Windows 命令提示字元（CMD）；
- WSL 的 Ubuntu 終端機；
- 單獨開啟的其他終端工具。

要注意的是：CLI 安裝在哪個環境，就從哪個環境啟動。Windows 安裝的 CLI 從 Windows 終端機使用；WSL 安裝的 CLI 從 WSL 終端機使用，不要把兩邊的路徑混在一起。

## 選用：在 WSL2 安裝 Codex CLI

前面的 Windows 安裝、確認與登入都完成後，再決定是否需要 WSL2。只使用 Windows 的讀者可以直接跳過這一步。

以系統管理員身分開啟 PowerShell：

```powershell
wsl --install
```

重新開機、完成 Ubuntu 使用者設定後，執行：

```powershell
wsl --list --verbose
```

`VERSION` 必須是 `2`。如果顯示 `1`，代表你使用的是較舊的 WSL，不能直接跟著本文繼續。

接著從 Ubuntu 終端機建立專案目錄：

```bash
mkdir -p ~/code
cd ~/code
code .
```

VS Code 左下角應顯示 `WSL: Ubuntu`，整合終端機的路徑應是 `/home/...`，而不是 `C:\...`。

不要把專案放在 `/mnt/c/...`。那相當於讓 WSL 隔著一扇門一直讀取 Windows 裡的檔案，安裝可能比較慢，也容易遇到檔案無法修改的問題。

OpenAI 目前提供獨立安裝腳本。在 WSL 的 Ubuntu 終端機執行：

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

本次為了不覆蓋正在使用的 Codex，我將 `CODEX_HOME` 與 `CODEX_INSTALL_DIR` 指向 `/tmp/codex-article-20260724/` 的隔離位置，並設定 `CODEX_NON_INTERACTIVE=1` 重跑官方安裝器。實際下載並安裝出 `0.145.0`。安裝器正確辨識：

- 作業系統為 Linux x64；
- 最新版本為 0.145.0；
- 電腦上已存在 npm 管理的 Codex；
- 同時存在多份 Codex 時，PATH 順序會決定實際執行哪一份。

![Codex CLI 官方安裝腳本的實際輸出](/images/blog/codex-windows-wsl-install/03-codex-clean-install.png)

這次隔離測試保留了兩段英文警告原文。第一段表示電腦上已經有另一份 npm 管理的 Codex：

```output
WARNING: Multiple managed Codex installs can be ambiguous because PATH order decides which one runs.
```

第二段是正常安裝較少遇到的警告：

```output
WARNING: proceeding, even though we could not create PATH aliases: Refusing to create helper binaries under temporary dir "/tmp" (codex_home: AbsolutePathBuf("/tmp/codex-article-20260724/home"))
```

這不是下載失敗。原因是本次刻意把安裝位置放在 `/tmp`，安裝器拒絕在暫存目錄建立長期 PATH helper；最後仍明確顯示 `Codex CLI 0.145.0 installed successfully.`。一般使用者採用預設安裝位置時，不應照抄本次隔離路徑。

## 官方參考資料

- [OpenAI：Codex CLI](https://learn.chatgpt.com/docs/codex/cli)
- [OpenAI：Codex IDE 插件](https://learn.chatgpt.com/docs/codex/ide)
- [OpenAI：Codex on WSL](https://learn.chatgpt.com/docs/windows/wsl)
- [OpenAI：Codex Windows sandbox](https://learn.chatgpt.com/docs/windows/windows-sandbox)
- [Visual Studio Code：WSL 教學](https://code.visualstudio.com/docs/remote/wsl-tutorial)

## 附錄：這次實測的環境

本次實測環境如下：

- WSL2 Ubuntu 24.04
- VS Code 1.130.0
- Node.js 24.11.0
- npm 11.6.1
- Windows PowerShell 5.1 隔離安裝：Codex CLI 0.145.0
- 已存在的 Codex CLI：0.144.6
- 乾淨隔離安裝取得的 Codex CLI：0.145.0
- VS Code 官方插件：`openai.chatgpt@26.721.30844`

![WSL2、VS Code、Node 與 npm 版本的實際終端紀錄](/images/blog/codex-windows-wsl-install/01-wsl-environment.png)

這一段留給排錯時核對用，新手不需要先理解每個名稱。版本會持續更新，也不必要求你的數字與本文完全相同；只要指令能正常顯示版本即可。

## 裝好之後可以做什麼

到這裡你已經有完整的 Codex 環境：VS Code 裡用插件、終端機裡用 CLI，之後要接自動發文、排程腳本都是在這個基礎上疊加。下一步推薦：

- [Codex 額度燒完怎麼辦？](/blog/codex-usage-limit-reset/)——省 Token 與手動重置
- [免費資源總整理](/blog/free-resources/)——照著影片做就能跑通

WSL2 或 CLI 安裝噴錯了？加 LINE 把畫面截圖傳給我，簡單問題**免費**幫你排。

````

### codex-usage-limit-reset（Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學）

建議套用 6 個（HIGH 5／MEDIUM 1）；維持原樣 1 個。

#### 建議套用的區塊

##### 1. 第 25 行附近（fence code block）

- 改動前：```text
- 改動後：```codex
- 信心度：**HIGH**
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/model」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /model

##### 2. 第 37 行附近（fence code block）

- 改動前：```text
- 改動後：```codex
- 信心度：**HIGH**
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/new」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /new

##### 3. 第 43 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**HIGH**
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請檢查這個專案目前未提交的變更，只整理問題，不要修改檔案。

##### 4. 第 53 行附近（fence code block）

- 改動前：```text
- 改動後：```codex
- 信心度：**MEDIUM**
- 判斷依據：`R5_TOOLCMD_ARTICLE_CONTEXT` — 「/compact」是斜線開頭的工具介面指令；區塊正上方沒有明確提到工具名稱，但整篇文章標題／slug 明確只指向「codex」（標題：Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學，slug：codex-usage-limit-reset），信心度中等。
- 內容前 120 字：
  > /compact

##### 5. 第 76 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**HIGH**
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請把這篇草稿整理成可發布的繁體中文文章。 保留我的語氣與所有實測步驟，不要增加沒驗證過的功能。 完成後檢查標題、description、圖片路徑與站內連結，但先不要發布。

##### 6. 第 143 行附近（fence code block）

- 改動前：```text
- 改動後：```codex
- 信心度：**HIGH**
- 判斷依據：`R5_TOOLCMD_LOCAL_CONTEXT` — 「/usage」是斜線開頭、整行只有一個指令詞的工具介面指令；區塊正上方文字明確提到「codex」，判斷為打在該工具互動介面裡的指令。
- 內容前 120 字：
  > /usage

#### 維持原樣不動（這幾個沒有改，請你自己看）

##### 1. 第 104 行附近（fence code block）—— 維持原樣不動

- 目前標記：`text`（不變）
- 沒有改的原因：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 只看 src/pages/blog 和 src/content.config.ts。 先找出原因並回報，不要掃描 node_modules，也不要修改其他目錄。

#### 修改後完整 body（可直接整段複製貼回 CMS；UNSURE 區塊維持原樣）

````markdown
Codex 額度燒完時，先不要急著升級方案：先到設定→使用量查看有沒有 Full reset 重置券，有就手動兌換，把額度先救回來。接著再調整日常用法，讓下一輪額度別燒這麼快：日常工作改用 Luna 或既有的 GPT-5.5、每個獨立任務開新 session、長任務用 `/compact`。真正需要架構判斷、複雜除錯或風險評估時，才切到 Sol。

## 先分清楚：Token、上下文與使用額度不是同一件事

- **Token**：模型讀取與產生文字時使用的基本單位。提示、檔案、對話紀錄、工具結果與回答都會計入。
- **上下文（context）**：目前 session 中模型需要一起閱讀的內容。對話越長，每次新回合可能需要帶上的舊資料越多。
- **使用額度（usage limit）**：訂閱方案在一段時間內可使用的量。實際消耗會受到模型、上下文、推理深度、工具與任務複雜度影響，不是只看你輸入了幾個字。

因此，「把提示詞縮成一句」不一定最省；如果 AI 因為資訊不足反覆猜錯、重跑與讀錯檔案，反而會用掉更多額度。真正有效的是讓每個 session 只處理一個清楚的結果。

## 第一招：日常用 Luna 或 GPT-5.5，Sol 留給真正需要判斷的任務

我自己的切換原則很簡單：

| 任務 | 建議模型 |
| --- | --- |
| 改文案、整理格式、重新命名、摘要、固定規則修改 | Luna |
| 已在 GPT-5.5 跑穩的既有開發流程 | GPT-5.5 |
| 大量重複、低風險的小任務 | Luna |
| 架構設計、跨系統整合、模糊錯誤的根因分析 | Sol |
| 權限、安全性、資料刪除與其他高風險判斷 | Sol |

在 Codex CLI 輸入：

```codex
/model
```

就能替目前對話切換模型。Luna 的定位本來就是輕量、高頻、重視速度與額度的工作；Sol 則偏向品質與深度推理。GPT-5.5 可以繼續用在已驗證穩定的流程，但若唯一目標是延長額度，優先切 Luna 會更直接。

## 第二招：每完成一個任務，就開新 session

同一個對話做完文章，又接著修網站、查伺服器、寫社群貼文，Codex 之後每次回答都可能需要一起處理前面的紀錄。任務彼此無關時，保留那些上下文沒有幫助。

一個結果完成後，在 Codex CLI 輸入：

```codex
/new
```

它會在相同 CLI 與專案目錄中開始全新對話，不必關掉終端機。下一個提示直接用自然語言描述即可，例如：

```prompt
請檢查這個專案目前未提交的變更，只整理問題，不要修改檔案。
```

如果你使用桌面版，也可以按 **New chat**。不必每講一句話就重開；原則是一個獨立成果、一個 session。

## 第三招：同一個長任務還沒結束，就用 `/compact`

有些工作不能重開，例如已經除錯一小時、做過多個決策，而且下一步仍依賴前面的結果。這時輸入：

```codex
/compact
```

Codex 會把較早的對話整理成摘要，保留關鍵決策與進度，同時釋放上下文空間。適合在下列時機使用：

- 訊息與工具輸出已經很多，但任務還沒完成
- 已完成一個階段，準備進入下一階段
- Codex 開始重複問已回答過的問題，或反應明顯變慢

簡單判斷：換目標用 `/new`，同一目標太長用 `/compact`。

## 第四招：提示詞不用像程式碼，自然語言說清楚四件事

省額度不等於寫超短提示。只要說清楚以下四件事，通常就能減少來回修改：

1. 要完成什麼結果
2. 可以操作哪些範圍
3. 哪些事情不要做
4. 完成後如何驗證

例如：

```prompt
請把這篇草稿整理成可發布的繁體中文文章。
保留我的語氣與所有實測步驟，不要增加沒驗證過的功能。
完成後檢查標題、description、圖片路徑與站內連結，但先不要發布。
```

不需要背特殊 Prompt 公式，也不必先學一堆指令。自然語言只要把結果與界線講清楚，通常比貼入整個專案背景更省。

## 第五招：把固定規則寫進 `AGENTS.md`

Codex 自動 commit 了不該提交的東西、改到指定範圍之外、改完忘了跑 build——事後收拾的來回對話，往往比原任務本身更耗額度。「不要自動提交」、「修改後執行 build」、「只處理指定範圍」這類會反覆使用的固定規則，可以寫進專案根目錄的 `AGENTS.md`，讓它每個 session 都記得：

```md
# 專案工作規則

- 不要自動執行 git commit、push 或部署。
- 修改完成後執行 npm run build。
- 只處理使用者指定的檔案與範圍；發現額外問題先回報。
```

Codex 開始新的 session 時會先讀取這個檔案，規則從第一回合就生效，也不必每次重貼相同要求。只適用單一專案的規則放在專案 `AGENTS.md`；所有專案都共用的個人習慣，才放在 `~/.codex/AGENTS.md`。

但 `AGENTS.md` 不是越長越省。它本身也會進入上下文，所以只保留會反覆使用、能直接影響工作的規則；文章全文、一次性需求與大量背景資料仍留在當次提示中。修改 `AGENTS.md` 後，開一個新 session 才會載入新版內容。

## 第六招：不要一次塞進所有檔案、網站與工具

每多讀一份無關檔案、每多開一個 MCP 或外部工具，都可能增加上下文與消耗。你可以直接限制範圍：

```text
只看 src/pages/blog 和 src/content.config.ts。
先找出原因並回報，不要掃描 node_modules，也不要修改其他目錄。
```

另外，圖片生成通常比純文字工作消耗更多；如果只是要改標題或排版，不要順便要求重新生圖。

## 額度頁面在哪裡？

在 ChatGPT 網頁版或桌面版打開：

**設定 → 使用量**

這個頁面會顯示目前剩餘比例、重置週期，以及你的帳號是否有可用的使用量重置券。重置券在這裡就能直接兌換，不需要另外開 Codex。

想直接跳過去的話，[chatgpt.com/codex/settings/usage](https://chatgpt.com/codex/settings/usage) 是同一份資料的直達網址，兩邊看到的內容一樣。

沒有看到重置券，通常代表帳號目前沒有可用的，可等下一波發放。

<img src="/images/blog/codex-usage-limit-reset/usage-reset-vouchers.png" alt="ChatGPT 使用量頁面顯示每週用量上限與兩張 Full reset 重置券">

上圖是 2026 年 7 月 28 日的實際畫面：每週用量上限仍剩 100%，下方有兩張不同到期日的 Full reset。每個帳號看到的數量、名稱、效期與介面可能不同，以你登入後的畫面為準。

要特別注意：**到期日當天一到，重置券就會失效，不能等到當天才使用。** 例如畫面顯示「8/1 到期」，最晚要在 7/31 使用；建議直接把到期日前一天設成最後使用期限。

如果想掌握之後可能出現的額度重置活動，也可以追蹤 [Tibo 的 X 帳號（@thsottiaux）](https://x.com/thsottiaux)。以 2026 年 7 月中下旬為例，這兩週幾乎天天都有重置消息，發放相當頻繁，而且通常是全體使用者一起獲得。

## 如何手動使用 Full reset 重置券？

1. 先到 **設定 → 使用量**，確認目前真的已接近或到達上限。
2. 在「使用量限制重設」區塊查看可用的 Full reset。
3. 優先選擇較早到期的那一張，並在顯示到期日的前一天以前使用。
4. 點進去閱讀確認畫面，再執行兌換。
5. 回到使用量頁面，確認剩餘額度已更新。

如果畫面仍顯示剩餘 100%，通常沒有必要立刻使用。重置券有期限，但在額度尚未消耗時兌換也可能浪費它；請比較「目前剩餘量」與「券的到期日」後再決定。

Codex CLI 也能直接輸入：

```codex
/usage
```

接著在選單中查看 token 活動，或兌換帳號中可用的 earned reset。若沒有看到兌換選項，通常代表目前帳號沒有可用重置券、尚未登入 ChatGPT 帳號，或該功能尚未開放到你的方案。

## 如果沒有重置券，還有什麼選擇？

依序處理即可：

1. 到 [Tibo 的 X](https://x.com/thsottiaux) 看看有沒有新的重置消息——近期發放很頻繁。
2. 用 `/model` 切到 Luna，先完成低風險工作。
3. 用 `/new` 清掉無關任務的上下文，或用 `/compact` 壓縮長對話。
4. 等待方案的使用週期自動恢復。
5. 急件再評估購買額外 credits，或改用 API Key 按實際 token 計費。
6. 長期每週都不夠，再考慮升級方案；不要因為單次大型任務就立刻升級。

## 最後整理：我的省額度工作流

日常先用 Luna 或 GPT-5.5；真正需要判斷才切 Sol。每完成一個獨立任務就 `/new`，長任務才 `/compact`。提示用自然語言講清楚結果、範圍、禁區與驗證方式，反覆使用的固定規則則精簡寫進 `AGENTS.md`。額度真的快用完時，再到使用量頁面查看並手動使用 Full reset。

這套做法的重點是不要讓高階模型重讀無關歷史、處理模糊需求，或把額度花在可以用輕量模型完成的工作上。

## 官方參考資料

- [OpenAI：Codex 方案、使用額度與節省用量建議](https://learn.chatgpt.com/docs/pricing)
- [OpenAI：Codex 模型選擇](https://learn.chatgpt.com/docs/models)
- [OpenAI：Codex CLI 指令參考](https://learn.chatgpt.com/docs/developer-commands?surface=cli)
- [OpenAI：使用 AGENTS.md 設定 Codex 固定規則](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [OpenAI：Codex 使用量頁面](https://chatgpt.com/codex/settings/usage)

## 相關閱讀

- [Codex 安裝教學（上）：VS Code + Codex 插件版，不用碰終端機](/blog/codex-windows-wsl-install/)
- [Codex 安裝教學（下）：Windows 版 Codex CLI 與 WSL2 進階安裝](/blog/codex-cli-wsl2-windows/)

````

### codex-windows-wsl-install（Codex 安裝教學（上）：VS Code + Codex 插件版，不用碰終端機）

建議套用 2 個（HIGH 2／MEDIUM 0）；維持原樣 0 個。

#### 建議套用的區塊

##### 1. 第 15 行附近（fence code block）

- 改動前：```text
- 改動後：```output
- 信心度：**HIGH**
- 判斷依據：`R2_URL_ONLY` — 整個區塊只有一行，且該行是完整的 http(s) URL。
- 內容前 120 字：
  > https://aixwang.dev/blog/codex-windows-wsl-install/

##### 2. 第 86 行附近（fence code block）

- 改動前：```text
- 改動後：```prompt
- 信心度：**HIGH**
- 判斷依據：`R7_PROMPT_LEADING_QING` — 內容以「請」開頭，符合任務描述「以請開頭」的提示詞特徵。
- 內容前 120 字：
  > 請在我的使用者目錄建立一個名為「你想要的資料夾名稱」的新資料夾， 並用 VS Code 開啟它。

#### 修改後完整 body（可直接整段複製貼回 CMS；UNSURE 區塊維持原樣）

````markdown

## 這一篇要裝什麼：兩個工具，10 分鐘開始用

這一篇適用 Windows 和 Mac，只需要安裝兩個工具：

- 工具 1｜VS Code 編輯器（IDE 工具）
- 工具 2｜Codex 插件（外掛）

裝完這兩個，你就能在 VS Code 裡讓 AI 讀你的專案、幫你改檔案、寫程式——全程不用碰終端機。

至於 Codex CLI 與 WSL2，那是想在終端機操作、接自動化流程時才需要的進階安裝，放在[下集](/blog/codex-cli-wsl2-windows/)。先把這一篇完成，日常使用其實就夠了。

如果安裝中途卡住，可以把這篇文章的連結和畫面上的完整錯誤訊息一起貼給 AI：

```output
https://aixwang.dev/blog/codex-windows-wsl-install/
```

請保留錯誤訊息原文，不要只描述「安裝失敗」。AI 才能對照本文的步驟，判斷你卡在哪一步。

## 第一步：安裝 VS Code

前往 [VS Code 官方網站](https://code.visualstudio.com/)，網站會自動偵測你的作業系統並顯示對應的下載按鈕：

- Windows：執行下載的安裝檔，依照安裝精靈完成安裝。安裝時建議保留「新增至 PATH」與「使用 Code 開啟」相關選項。
- Mac：解壓縮後，把 Visual Studio Code 拖進「應用程式（Applications）」資料夾即可。

安裝完成後，可以先把 VS Code 介面改成繁體中文：

1. 按下 `Ctrl + Shift + P`（Mac 為 `Cmd + Shift + P`）。
2. 輸入並選擇 `Configure Display Language`。
3. 選擇「中文（繁體）」或 `zh-tw`。
4. 如果尚未安裝中文語言包，VS Code 會自動安裝。
5. 依照畫面提示重新啟動 VS Code。

重新開啟後，VS Code 的選單就會顯示繁體中文。這只會改變 VS Code 的介面語言，不會影響 Codex 的回覆語言。[VS Code 官方說明](https://code.visualstudio.com/docs/configure/locales)

## 第二步：在 VS Code 安裝 Codex 插件（外掛）

![先點選 VS Code 左側紅框標示的 Extensions 插件圖示](/images/blog/codex-windows-wsl-install/10-vscode-codex-marketplace-click-extensions.png)

先點選左側紅框標示的 Extensions 插件圖示（快捷鍵：Windows `Ctrl + Shift + X`、Mac `Cmd + Shift + X`），再搜尋 `Codex`。搜尋結果可能不只一個，請選擇同時符合以下三個特徵的官方插件：

- 使用 OpenAI 的黑白 Logo；
- 插件名稱下方的公司名稱是 **OpenAI**；
- 公司名稱旁有藍色驗證勾勾。

確認三項都符合後，再按藍色 **Install** 按鈕。不要只因為名稱包含 Codex 就直接安裝，以免裝到仿冒或非 OpenAI 官方發布的插件。

> [!note] 先確認右側面板目前選到的是 Codex。VS Code 的預設 AI 通常是 Chat（GitHub Copilot）；安裝 Codex 後，點開聊天面板上方的 AI 選擇器，將 Chat／Copilot 切換成 **Codex**。本文後續的安裝與排錯都以 Codex 為準。以需要多步驟規劃、讀取專案並持續修正的工作來說，我認為 Codex 的推理與代理能力比 Copilot 更強，因此不要只看到聊天視窗就以為已經在使用 Codex。

1. 在 VS Code 左側點選「插件」圖示。
2. 搜尋 `Codex` 或 `OpenAI`。
3. 確認發行者是 OpenAI，再按下 Install。
4. 安裝後開啟 Codex 側邊欄並登入 ChatGPT。

畫面上同時看得到插件名稱 Codex – OpenAI’s coding agent、發行者 OpenAI 與藍色 Install 按鈕。

### 使用插件前，先登入 ChatGPT

安裝完成後，開啟 VS Code 右側的 Codex 面板，按下紅框標示的 **Sign in with ChatGPT**，再使用自己的 ChatGPT 帳號登入：

![在 Codex 面板按下紅框標示的 Sign in with ChatGPT](/images/blog/codex-windows-wsl-install/11-vscode-codex-sign-in-button.png)

為了有足夠額度完成安裝與後續排錯，本教學建議先確認帳號已訂閱每月 20 美元的 ChatGPT Plus 或更高方案。OpenAI 目前也讓 Free 與 Go 方案使用部分 Codex 功能，因此 Plus 不是官方規定的最低門檻，但免費或較低方案的可用額度可能較少。方案內容與價格之後可能調整，請以 [OpenAI 官方價格頁](https://learn.chatgpt.com/docs/pricing)為準。

## 第三步：先建立專案資料夾，再用 VS Code 開啟

Codex 必須在已開啟的專案資料夾中使用。請先在自己的使用者目錄建立一個資料夾，資料夾名稱可以自己決定。

你可以選擇以下其中一種方式：

方法一：手動建立

- Windows：在檔案總管進入 `C:\Users\你的帳號\`，在空白處按滑鼠右鍵，選擇 新增 → 資料夾。
- Mac：在 Finder 開啟「個人專屬」資料夾，按 `Cmd + Shift + N` 新增資料夾。

接著開啟 VS Code，從上方選單依序點擊 **檔案（File）→ 開啟資料夾（Open Folder...）**，再選擇剛建立的資料夾：

![在 VS Code 的 File 選單選擇 Open Folder](/images/blog/codex-windows-wsl-install/08-vscode-file-open-folder.png)

方法二：請 Codex 插件建立

如果 VS Code 已經開啟另一個可使用的專案資料夾，而且 Codex 已登入並能正常送出訊息，可以直接輸入：

```prompt
請在我的使用者目錄建立一個名為「你想要的資料夾名稱」的新資料夾，
並用 VS Code 開啟它。
```

送出前，記得把「你想要的資料夾名稱」換成自己決定的名稱。

如果目前是完全空白的 VS Code 視窗，Codex 可能會先要求你開啟專案，無法代替你建立第一個資料夾。這種情況請使用方法一。確認資料夾名稱出現在 VS Code 左側後，再開啟 Codex 並送出訊息，就能避免沒有開啟專案造成的錯誤。

<details>
<summary><strong>如果出現 Unable to send message，點此查看實測錯誤</strong></summary>

<p>本次在沒有開啟任何資料夾的 VS Code 空白視窗送出訊息時，實際出現：</p>

<pre><code>Unable to send message

Add a project to use ChatGPT</code></pre>

<img src="/images/blog/codex-windows-wsl-install/07-vscode-unable-to-send-no-project.png" alt="VS Code 沒有開啟專案時，Codex 顯示 Unable to send message">

<p>遇到相同訊息時，依照上面的步驟建立並開啟專案資料夾，再重新送出即可。</p>
</details>

## 選用：減少每一步都按同意

Codex 插件預設使用 Ask for approval，執行操作時可能經常要求你手動確認。如果不想每一步都按同意，可以在 Codex 訊息輸入框下方點開權限選單，改選紅框標示的 **Approve for me**：

![在 Codex 插件權限選單選擇紅框標示的 Approve for me](/images/blog/codex-windows-wsl-install/12-vscode-codex-approve-for-me.png)

Approve for me 會讓 Codex 自動執行一般操作，只在系統判定可能不安全時詢問，比每一步都確認更流暢。提高權限也代表 Codex 可以代你執行更多電腦操作，因此只在信任目前開啟的專案與安裝來源時使用。

畫面中的 **Full access** 是不受限制地存取網路與電腦檔案，本教學不需要選擇這個選項。

到這裡，插件版就安裝完成了。你可以開始在 Codex 面板用自然語言請它讀取專案、修改檔案、寫程式，修改結果會直接顯示在編輯器裡，也能逐項檢查差異。

## 插件版就夠了嗎？

對大多數人來說，夠了。日常讓 AI 讀專案、寫程式、改檔案，插件版全部做得到，你可以先用一陣子再說。

繼續看下集的訊號：

- 你想在終端機直接下指令操作 Codex，不開 VS Code 也能用
- 你想把 Codex 接進自動化流程（排程、腳本、CI）
- 你在 Windows 上遇到套件相容問題，需要 WSL2 的 Linux 環境

符合任何一條，就往下集走：

👉 [Codex 安裝教學（下）：Windows 版 Codex CLI 與 WSL2 進階安裝](/blog/codex-cli-wsl2-windows/)

安裝過程卡住了？加 LINE 把錯誤訊息貼給我，簡單問題免費幫你看。

````

### threads-api-tutorial（Threads API 申請教學：從拿 Token、發出第一篇貼文到 Token 自動永久延期）

建議套用 2 個（HIGH 0／MEDIUM 2）；維持原樣 3 個。

#### 建議套用的區塊

##### 1. 第 71 行附近（blockquote）

- 改動前：blockquote（`>`）
- 改動後：```prompt（blockquote 轉成 fence：拿掉每行開頭的 `> ` 前綴，內容文字不變）
- 信心度：**MEDIUM**
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 這步別跳過，沒接受邀請就去拿 Token 只會得到 401。

##### 2. 第 81 行附近（blockquote）

- 改動前：blockquote（`>`）
- 改動後：```prompt（blockquote 轉成 fence：拿掉每行開頭的 `> ` 前綴，內容文字不變）
- 信心度：**MEDIUM**
- 判斷依據：`R8_PROMPT_CHINESE_WITH_QING` — 中文字元比例高（≥30%）、長度足夠，且內文含「請」這個指令語氣詞，但不是在句首，信心度中等。
- 內容前 120 字：
  > 這裡生的短期 Token 1 小時就過期。請 Claude Code 用 API 換成長期 Token（60 天），換完加進 `.env` 環境變數。

#### 維持原樣不動（這幾個沒有改，請你自己看）

##### 1. 第 43 行附近（blockquote）—— 維持原樣不動

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`（不變）
- 沒有改的原因：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 送出前再三確認：用例選錯不能改，只能整支 App 重建。

##### 2. 第 53 行附近（blockquote）—— 維持原樣不動

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`（不變）
- 沒有改的原因：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 💡 「應用程式角色」分頁是新手最常找不到的入口——記住這個位置，後面所有測試人員設定都從這裡進。

##### 3. 第 89 行附近（blockquote）—— 維持原樣不動

- 目前標記：`blockquote（markdown 引用語法，開頭是 >）`（不變）
- 沒有改的原因：`R9_CHINESE_NO_QING` — 中文字元比例高、長度也夠，讀起來像自然語言，但沒有「請」這類指令語氣詞，無法確定是要貼給 AI 的提示詞、還是單純的中文說明文字。
- 內容前 120 字：
  > 兩個都要勾，scope 缺一個，發文時拿到的就是 403。

#### 修改後完整 body（可直接整段複製貼回 CMS；UNSURE 區塊維持原樣）

````markdown
Threads API 的申請流程是——用你的 Facebook 帳號登入 Meta 開發者後台 → 建立應用程式 → 選 Threads 用例 → 把自己加成測試人員 → 生成 Access Token。拿到 Token 之後，就能用官方 API 自動發文。下面有完整教學影片＋每一步的實際畫面截圖。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/nTYrG7EuFHA" title="Threads API 申請教學" loading="lazy" allowfullscreen></iframe></div>

這支教學最初發布在 Threads——下面的 FAQ 有一部分就是從留言區的真實提問整理出來的。

<blockquote class="text-post-media" data-no-copy data-text-post-permalink="https://www.threads.com/@alex_wang.ai/post/DXnWnLSEuMH" data-text-post-version="0" id="ig-tp-DXnWnLSEuMH" style="background:#FFF; border-width:1px; border-style:solid; border-color:#00000026; border-radius:16px; max-width:650px; margin:1px auto; min-width:270px; padding:0; width:calc(100% - 2px);">
<a href="https://www.threads.com/@alex_wang.ai/post/DXnWnLSEuMH" style="background:#FFFFFF; line-height:0; padding:0; text-align:center; text-decoration:none; width:100%; font-family:-apple-system,BlinkMacSystemFont,sans-serif;" target="_blank">
<div style="padding:40px; display:flex; flex-direction:column; align-items:center;"><div style="display:block; height:32px; width:32px; padding-bottom:20px;"><svg aria-label="Threads" height="32px" role="img" viewBox="0 0 192 192" width="32px" xmlns="http://www.w3.org/2000/svg"><path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/></svg></div>
<div style="font-size:15px; line-height:21px; color:#000000; font-weight:600;">在 Threads 查看</div></div></a></blockquote>
<script async src="https://www.threads.com/embed.js"></script>

<p class="social-quote-note">上方卡片的讚數、留言、轉發、分享由 Threads 即時提供；另外這則貼文的瀏覽數在 2026-07-30 擷取時為 7,696 次（瀏覽數不在官方卡片顯示範圍內）。</p>

## 申請前的準備

1. **一個可用的 Facebook 帳號**——Meta 開發者後台要用它登入
2. **你要自動化的 Threads 帳號**——要跟這個 FB 帳號完成綁定

## 先講重要的：不被鎖的 4 條規則（我踩過坑的）

Threads API 是 Meta 官方推出的，不是第三方爬蟲工具——功能合法，但要照規則用：

1. 發文上限是 250 則 / 24 小時（rolling window），超過會被限流
2. 連續發完全相同的內容會觸發 Meta 的 spam 偵測，Threads 直接被鎖 24 小時，期間不能自動發文、自動回覆
3. 回覆也一樣：官方上限雖然寫 1000 / 24h，我實測一則 thread 同時回 10 個人就被鎖了 24 小時，別 burst 連發
4. 長期 Token 效期 60 天，到期的解法在文末

## Step 1：建立 Meta App

打開 `developers.facebook.com`，點「建立應用程式」，填 App 名稱。

![在 Meta 開發者後台點建立應用程式](https://cms.aixwang.dev/assets/b74da1b9-7b2a-4bf1-b23a-6679bf56c6fc)

![填寫應用程式名稱](https://cms.aixwang.dev/assets/01bef9d1-fb45-4b4b-a8d9-9179ef359bcf)

下一頁選用例——**選跟 Threads 相關的存取類別**，然後確認。

![選擇 Threads 相關的用例](https://cms.aixwang.dev/assets/c6a3c366-037a-422a-91e9-22f99915ca51)

![確認應用程式資訊](https://cms.aixwang.dev/assets/2926fd22-9219-4082-bb29-b5dc8c2eef9b)

> 送出前再三確認：用例選錯不能改，只能整支 App 重建。

## Step 2：設定使用案例＋應用程式角色

進 App 主控台，左欄找到「應用程式角色」，點進去切到「角色」分頁。

![進入使用案例設定](https://cms.aixwang.dev/assets/7c64a566-85b9-4638-9972-e7957abda493)

![進入應用程式角色的角色分頁](https://cms.aixwang.dev/assets/a34b9c35-39f4-4bca-b595-0cf2d0fe86a8)

> 💡 「應用程式角色」分頁是新手最常找不到的入口——記住這個位置，後面所有測試人員設定都從這裡進。

## Step 3：加自己當測試人員

點「新增測試人員」，填自己 Meta 帳號的使用者名稱，送出。

![新增測試人員彈窗](https://cms.aixwang.dev/assets/6c9e6599-8355-43bb-827c-6e3452138e5c)

![邀請送出後的待確認狀態](https://cms.aixwang.dev/assets/750e4e88-da17-4276-a230-f1df68610320)

然後去 Threads App 的設定（或信箱）**接受邀請**：

![Threads App 的網站權限設定](https://cms.aixwang.dev/assets/04f8ea5e-fb91-476f-b6a1-188c1fd73b14)

![接受測試人員邀請](https://cms.aixwang.dev/assets/7726eb2b-f685-4f85-a329-6b47e0151dd4)

![邀請接受後的狀態](https://cms.aixwang.dev/assets/7e742cb1-da28-4de1-a0fa-902fde8436cd)

```prompt
這步別跳過，沒接受邀請就去拿 Token 只會得到 401。
```

## Step 4：生成 Access Token

進測試工具（Token Generator），點生成 Access Token。

![開啟 Threads 測試工具](https://cms.aixwang.dev/assets/14c331db-b05a-4813-a8db-8d42097483ee)

![生成 Access Token](https://cms.aixwang.dev/assets/e29253ee-53a8-470c-a4b5-0732a8ecbaee)

```prompt
這裡生的短期 Token 1 小時就過期。請 Claude Code 用 API 換成長期 Token（60 天），換完加進 `.env` 環境變數。
```

## Step 5：OAuth 同意

OAuth 同意頁要勾兩個 scope：`threads_basic` + `threads_content_publish`，確認授權。

![OAuth 同意頁勾選兩個 scope](https://cms.aixwang.dev/assets/9ff04e3f-bf21-48a3-a90e-5b1f9451e6dd)

> 兩個都要勾，scope 缺一個，發文時拿到的就是 403。

## Step 6：測試 API

先拿 Token 打 `/me` 端點確認身分：

![用 /me 端點測試 Token 身分](https://cms.aixwang.dev/assets/3609b0c9-f744-46ac-ad88-0806e16aef16)

再試發一則貼文——Threads 發文是三段式：建立容器 → 輪詢狀態 → 發布。

![測試發文 API](https://cms.aixwang.dev/assets/cdef60f2-f297-42af-a927-ac1254d25dc1)

最後用 Token Debugger 確認 Token 剩餘有效時間：

![Token 偵錯工具查看效期](https://cms.aixwang.dev/assets/00e1dcbc-baba-472d-9163-40b927f87928)

## Token 60 天過期怎麼辦？

長期權杖效期 60 天。你可以在到期前手動重新換發，但更省事的做法：我開源的 [Tooka](/blog/free-resources/) 內建 API 串接面板，Token 填進去會**自動延期**——第一次手動申請後就不用再管過期問題。

## 拿到 API 之後可以做什麼？

- 自動發文與排程：AI 寫好內容定時發佈，注意上面的防鎖規則
- 搭配 AI Agent：用中文對話就能操作，不用自己寫程式
- 搭配 [Tooka](/blog/why-i-built-tooka/)：連 1080×1350 的輪播圖文都自動生成、一鍵發佈

照著做卡關了，歡迎加 [LINE 免費諮詢](https://line.me/ti/p/jejH4FkQn-)，或直接約[一對一教學](/services/one-on-one/)手把手帶你跑通。
````

## UNSURE 總覽（這幾個我沒有改，請你自己看）

共 4 個區塊維持原標記不動：

- **codex-usage-limit-reset**（Codex 額度燒完怎麼辦？省 Token 與 Full reset 手動重置教學）：第 104 行（`R9_CHINESE_NO_QING`）
- **threads-api-tutorial**（Threads API 申請教學：從拿 Token、發出第一篇貼文到 Token 自動永久延期）：第 43 行（`R9_CHINESE_NO_QING`）、第 53 行（`R9_CHINESE_NO_QING`）、第 89 行（`R9_CHINESE_NO_QING`）
