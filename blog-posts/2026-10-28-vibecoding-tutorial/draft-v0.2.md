# Vibecoding 一對一教學：Claude Code 安裝、開發、除錯、測試、部署都能自動化

我幫數學老師做的題庫系統，現在只要說一句「修好推上去」，Claude Code 就會改程式、跑測試、上傳，再部署到老師的網站。開發、除錯、測試、部署都能這樣自動化，前提是第一次要設定好下面這些。

## 自動化前的設定

- **訂閱 Claude，裝 Claude Code**：月繳 20 美元的 Pro 方案就能用 Claude Code，免費方案不能用。不會寫程式也能做網站，用中文講你要什麼就好。沒用過程式工具的人裝桌面版，想邊做邊看程式碼的人裝 VS Code 擴充套件。安裝步驟看[Claude Code 安裝教學：桌面版、VS Code、終端機三種裝法](https://aixwang.dev/blog/claude-code-install/)。

- **裝 grill-me**：為了提升開發效率，一開始就讓 AI 釐清完整需求，避免 AI 理解錯誤、反覆修改。

- **開 Claude Code 的 Auto 模式**：不用守在電腦前每個指令都按同意，整套流程才跑得完。

- **申請 GitHub**：每次修改都有紀錄，改壞能退回；推上 GitHub 也能接自動部署。

- **部署設定**：一頁式網站用 Cloudflare，免費，建一組 API Token 給 Wrangler；有資料庫、後台的複雜系統用 GCP，新帳號 90 天內有 300 美元額度，設定好 SSH 連線。設定一次，之後部署都交給 Claude Code。

## 開發

先在本機開資料夾，從最簡單的一頁式形象網站開始，完成第一個專案。我會教：

- 常用的 Debug 做法
- 怎麼節省 Token 用量
- 怎麼避免改 A 壞 B
- 怎麼改善 UI/UX

## 進階

- Windows 想用 Linux 環境，裝 WSL：[Windows 版 Codex CLI 與 WSL2 進階安裝](https://aixwang.dev/blog/codex-cli-wsl2-windows/)

上面這些設定和開發技巧，都是一對一課程會帶著做的內容。看[教學方案](https://aixwang.dev/course/)，雙北咖啡廳或線上都可以約，用 LINE 預約：
https://lin.ee/raoKSVR
