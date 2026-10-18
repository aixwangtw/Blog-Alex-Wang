---
title: feedback-desk 開源回報系統：客戶開單、團隊寫調整說明、客戶確認，都在同一張單
description: feedback-desk 是跟客戶、團隊夥伴溝通系統調整的回報工具：客戶開單附截圖，團隊改好後寫調整說明，客戶確認後結案。MIT 授權開源，架在自己的主機、用自己的網域。
slug: feedback-desk
status: published
featured: false
pubDate: 2026-10-18
tags: [開源工具, 客製開發, 回報系統]
faqs:
  - question: feedback-desk 要付費嗎？
    answer: 不用。feedback-desk 以 MIT 授權開源在 GitHub，可以免費使用、修改，主機費用由自己負擔。
  - question: 回報的資料存在哪裡？
    answer: 存在你自己架設的主機上。系統架在自己的主機、用自己的網域。
  - question: 可以直接架在 Cloudflare Workers 或 Pages 上嗎？
    answer: 不行。feedback-desk 是 PHP 程式，要有自己的主機才能架。沒有主機可以租一台 VPS，網域交給 Cloudflare 管理，再用 Cloudflare Tunnel 連到主機。
  - question: 團隊自己建立的單，客戶看得到嗎？
    answer: 看不到。團隊建立的單只有團隊看得到，客戶的清單、數量統計和單頁都不會出現。
  - question: 一次可以回報幾個問題？截圖有限制嗎？
    answer: 一次可以加多個問題，送出後每個問題各自成一張單。每題最多 5 張截圖，每張 10 MB 以內，格式可以是 JPG、PNG 或 WebP。
---

feedback-desk 是我們用來跟客戶、團隊夥伴溝通系統問題的回報工具，現在開源在 GitHub：[aixwangtw/feedback-desk](https://github.com/aixwangtw/feedback-desk)，MIT 授權，可以架在自己的主機上免費使用。

我跟一位補習班老師合作開發[數學題庫系統](/blog/math-teacher-question-bank/)，老師想調整的地方都在這套系統開單。下圖是實際使用的畫面，介面上的「客戶」改稱為「老師」：

<img src="/images/blog/feedback-desk/teacher-list.jpg" alt="實際使用中的問題清單：介面稱呼改為老師，共 4 題，分別是待處理、待審核和已完成" width="720">

以下截圖用的是虛構的「晴天咖啡 線上訂位系統」示範資料。

## 回報流程

一張單從開單到結案有三種狀態：待處理、待審核、已完成。

1. **客戶開單**：寫下想調整的地方、附截圖，送出後是「待處理」。
2. **團隊處理**：改好後在同一張單寫「調整說明」、附修改後的圖，狀態改成「待審核」。
3. **客戶確認**：看過調整說明和圖，沒問題就改成「已完成」。

過程中有問題要問，就在那張單的留言串來回。

<img src="/images/blog/feedback-desk/client-list.jpg" alt="示範資料：客戶看到的問題清單，上方說明三種狀態，表格列出每題的狀態、圖片和調整說明" width="720">

## 客戶開單

在問題清單按「新增問題」。一次可以加多個問題，送出後每個問題各自成一張單。每題最多附 5 張截圖，每張 10 MB 以內。

<img src="/images/blog/feedback-desk/client-new-issue.jpg" alt="示範資料：新增問題視窗，填問題標題、問題說明、上傳截圖，下方可以再加一個問題或送出全部問題" width="720">

## 調整說明與留言

客戶打開單，可以看到團隊寫的調整說明和修改後的圖。下方的處理紀錄是留言串，客戶和團隊都能留言，也能附圖。

<img src="/images/blog/feedback-desk/client-detail.jpg" alt="示範資料：客戶端的單頁，依序是問題說明、調整說明、處理紀錄留言串和補充訊息輸入框" width="720">

## 團隊端

團隊看得到專案的全部單，清單多了「建立者」欄位，可以依建立者篩選。團隊自己建立的單是內部單，客戶看不到。客戶刪掉的單只是隱藏，團隊還看得到，也能還原。

<img src="/images/blog/feedback-desk/team-list.jpg" alt="示範資料：團隊端的問題清單，多了建立者欄位與建立者、客戶已刪除兩個篩選" width="720">

清單可以切換成看板，拖拉卡片到另一欄就會改狀態。

<img src="/images/blog/feedback-desk/team-kanban.jpg" alt="示範資料：看板檢視，待處理、待審核、已完成三欄，每張卡片顯示編號、建立者和調整說明" width="720">

調整說明只有團隊能寫，客戶只能看。

<img src="/images/blog/feedback-desk/team-detail.jpg" alt="示範資料：團隊端的單頁，調整說明下方有僅開發團隊可用的編輯調整說明" width="720">

我和夥伴分別用 Claude Code 和 Codex 處理這些單，處理結果寫在單上。

## 手機也能用

手機上清單會排成一張張卡片，單頁的調整說明和留言也能直接看、直接回。

<img src="/images/blog/feedback-desk/mobile-list.jpg" alt="示範資料：手機上的問題清單，每題一張卡片，顯示狀態、截圖縮圖和調整說明" width="320">

<img src="/images/blog/feedback-desk/mobile-detail.jpg" alt="示範資料：手機上的單頁，問題說明、調整說明和處理紀錄由上往下排列" width="320">

## 自己架起來用

- **MIT 授權**：可以免費使用、修改。
- **自己的主機與網域**：系統架在自己的主機、用自己的網域，資料存在自己的主機上。
- **多個專案**：一套系統可以開多個專案，每個專案的單和截圖分開，各自有入口。
- **稱呼可改**：介面上的稱呼可以換成自己的用語，例如把「客戶」改成「老師」。
- **登入預填**：登入頁預先填好帳號密碼的功能預設關閉，需要時可以在設定打開。

安裝步驟寫在 [README](https://github.com/aixwangtw/feedback-desk)。可以把 repo 網址交給 Claude Code、Codex 這類 AI Agent，請它照 README 安裝：

```prompt
請照這個 repo 的 README 幫我安裝
https://github.com/aixwangtw/feedback-desk
```

要架這套系統，需要一台自己的主機。沒有的話可以租一台 VPS，網域交給 Cloudflare 管理，再用 Cloudflare Tunnel 連到主機。feedback-desk 是 PHP 程式，不能直接架在 Cloudflare Workers 或 Pages 上。
