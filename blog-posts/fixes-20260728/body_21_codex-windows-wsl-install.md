
## 這一篇要裝什麼：兩個工具，10 分鐘開始用

這一篇適用 Windows 和 Mac，只需要安裝兩個工具：

- 工具 1｜VS Code 編輯器（IDE 工具）
- 工具 2｜Codex 插件（外掛）

裝完這兩個，你就能在 VS Code 裡讓 AI 讀你的專案、幫你改檔案、寫程式——全程不用碰終端機。

至於 Codex CLI 與 WSL2，那是想在終端機操作、接自動化流程時才需要的進階安裝，放在[下集](/blog/codex-cli-wsl2-windows/)。先把這一篇完成，日常使用其實就夠了。

如果安裝中途卡住，可以把這篇文章的連結和畫面上的完整錯誤訊息一起貼給 AI：

```text
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

```text
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
