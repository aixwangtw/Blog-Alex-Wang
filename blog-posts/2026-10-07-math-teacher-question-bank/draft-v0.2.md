---
title: 數學題庫系統介紹：考卷匯入、AI 出題、AI 詳解，補習班老師可以直接試用
description: 幫補習班數學老師把瑣碎的出題流程自動化，不用再挑題挑到青光眼：上傳 PDF、Word 或照片，AI 幫你把考卷拆成一題一題，老師對照原卷確認後收進題庫；出卷時勾選、排序，就能匯出圖片或貼進 Word。Demo 還能試 AI 出題、AI 詳解和學生練習打卡。
slug: math-teacher-question-bank
status: draft
featured: false
pubDate: 2026-10-10
tags: [客製開發, AI 導入, 題庫系統]
faqs:
  - question: 開發怎麼進行？費用怎麼算？
    answer: 基礎範圍有三大塊。第一塊是整理考卷：考卷匯入（可擴充為一次匯入多份）、AI 辨識、審核、單元分類、出卷，以及匯出 PNG、複製到 Word、複製（MathType 用）。另外兩塊是 AI 出題和 AI 詳解。其他需求都可以客製，再個別報價，例如學生線上作答（現有的學生練習打卡也算在這裡）、讓更多種圖形可以改數值、匯出時直接產生 Word 檔等等。進行方式是先聊需求、試用 Demo，確認功能後報價，再分階段開發、每階段都讓老師試用，上線時教老師使用，之後持續維護。費用依需要的功能報價，接受分期付款。AI 使用費另計，見下一題。
  - question: AI 的使用費用怎麼算？
    answer: 系統使用 Google 的 Gemini AI，額度由我們協助老師申請、設定好。正式使用建議改成付費方案，考卷內容不會被拿去訓練 AI；可以選擇預付，最低先儲值 5 美元，用完再補，也能設定每月上限避免超支。費用依實際用量計算：辨識考卷（每份 4 頁）1 份不到 1 元、100 份約 85 元；AI 出題 1 題約 0.1 元、100 題約 8 元；AI 詳解 1 題約 0.1 元、100 題約 7 元。測試期間通常每月 10 元以內，可以忽略；正式上線後一般每月大約 20～150 元，用量很大時（每月 150 份考卷、上千題詳解）大約 300～600 元。以上為新台幣，依 2026 年 10 月 Google 官方價格與台灣銀行匯率估算；考卷頁數、題目附圖和重試次數都會影響實際金額。
  - question: 可以先用免費額度嗎？大概能做幾題？
    answer: Google 的免費方案限制的是每天、每分鐘可以使用 AI 的次數，沒有給一筆金額，實際上限以 Google AI Studio 帳號頁面顯示的為準。以常見的每天約 1,000 次估算，大約可以辨識 1,000 頁考卷（約 250 份 4 頁的考卷），或產生約 1,000 題詳解，這幾項功能共用同一個次數上限。免費方案的使用內容可能會被 Google 用來改進產品，每分鐘的次數限制也比較緊，一次大量匯入時速度會變慢，所以測試時可以先用免費方案，正式使用建議改成付費方案。
  - question: 一次可以上傳幾份考卷？檔案有大小限制嗎？
    answer: 目前一次上傳一個檔案，上限 20MB，可以是 PDF、Word 或照片。一次匯入多份考卷包含在基礎範圍內，可以在開發時一起建置。
  - question: 可以自動把題目分到單元嗎？
    answer: 匯入考卷時，AI 會逐題建議單元、難易度和題型，上傳時也可以先填好單元，都要老師在審核頁確認。AI 出的類似題，單元和難易度可以在產生前指定，沒指定就由 AI 判斷或沿用範本題。已經在題庫裡的題目，目前沒有一鍵自動分類，可以當作客製需求提出。
  - question: 國中、高中都可以用嗎？
    answer: 目前內建的是高中數學單元（第一冊到第六冊）。國中或其他版本的單元，可以跟我們討論，我們幫老師加上去。
  - question: 貼進 Word 之後，公式和字體會跑掉嗎？
    answer: 用「複製到 Word」貼上後，公式是 Word 內建的方程式，可以點開來改。字體也會一起帶過去：中文是新細明體，數字和英文是 Times New Roman。
  - question: 我習慣用 MathType，可以用嗎？
    answer: 可以。用「複製（MathType 用）」貼上後，公式是一段 LaTeX 文字碼，用 MathType 轉換就會變回公式。
  - question: 可以直接下載成 Word 檔嗎？
    answer: 目前沒有。直接產生 Word 檔有一定的開發難度，可以當作客製項目討論。
  - question: 考卷上的圖可以改數字嗎？
    answer: AI 出的類似題裡，直角三角形、坐標直線、圓與弦可以直接改數字，圖會跟著重畫。從考卷匯入的圖目前是照片，可以換圖，但不能改數字。要讓圖能改，電腦得先看懂點、線、直角和標示，改一個數字其他地方也要跟著動，所以我們從最常用的圖形一種一種加入支援。
  - question: Demo 的 AI 是真的在運算嗎？
    answer: Demo 用的是模擬 AI，用來讓老師走一遍操作流程。
  - question: Demo 裡我建的資料，別人會看到嗎？
    answer: 不會。每個人（每個瀏覽器）看到的是自己的一份 Demo 資料，互相看不到，7 天沒使用會自動清除。
  - question: 學生上傳練習有什麼規則？
    answer: 一次最多 5 張照片，要填這次做了幾題，練習日期可以補登最近 7 天內的。老師發現照片和題數對不上，可以把那筆標成無效，不計入排行。
---

這是一套幫數學老師把瑣碎出題流程自動化的題庫系統，讓老師不用再挑題、出題挑到青光眼。想直接試用，可以[點這裡進 Demo](https://demo-question.aixwang.dev/admin/auth/login)，登入頁已經預填帳號 demo&#64;demo.com 和密碼 demo1234，按「登入」就能進去。

## 考卷匯入與審核

上傳 PDF、Word 檔或考卷照片，AI 會把考卷拆成一題一題，題目、選項和附圖分開存，附圖會自動裁切。AI 也會建議每一題的單元、難易度和題型。

**每一題都要老師按下通過**才會進題庫。審核頁把原卷和辨識結果對照著擺，AI 出錯就直接在那一題修改，改好再通過。

題目依冊、章分單元，另外有難易度、題型、學校、卷別標籤，題目清單可以用這些標籤篩選。

<img src="/images/blog/math-teacher-question-bank/import-review.jpg" alt="考卷匯入的審核頁：左邊是原本的考卷，右邊是 AI 辨識出的題目，每題標示待審核，旁邊有通過並啟用按鈕" width="720">

## 出卷與匯出

後台分成「題庫建立」和「出卷」兩區，另外的「學生管理」是給學生練習打卡用的。出卷區只列出已啟用的題目，勾選題目、拖曳排好順序，就能匯出：

- **匯出 PNG**：一整份排好版的考卷圖片。
- **複製到 Word**：貼上後，公式可以在 Word 裡直接編輯。
- **複製（MathType 用）**：給習慣用 MathType 的老師。

匯出時可以分成「題目卷」和「詳解卷」兩份。

<img src="/images/blog/math-teacher-question-bank/exam-export.jpg" alt="出卷視窗：考卷題目順序可上下移動或拖曳，底部有匯出 PNG、題目卷與詳解卷各自的複製到 Word、複製（MathType 用）按鈕" width="720">

## AI 出題與 AI 詳解

- **AI 出題**：挑 1～5 題當範本，AI 產生類似題，老師審核後才進題庫。直角三角形、坐標直線、圓與弦這幾種附圖，會配合新題目重畫，改了數值也能再畫一次。
- **AI 詳解**：一鍵產生詳解草稿，老師確認或修改後存檔；也可以自己寫，或上傳詳解截圖。匯出詳解卷時，缺詳解的題目會自動補上。

這兩個功能都可以到 [Demo](https://demo-question.aixwang.dev/admin/auth/login) 試用。

<img src="/images/blog/math-teacher-question-bank/ai-similar-triangle.jpg" alt="AI 出題結果：左邊範本是邊長 6、8 的直角三角形，右邊新題改成 5、12，附圖跟著重畫，標示 AI 草稿待老師確認" width="720">

## 學生練習打卡（進階功能）

學生用老師給的邀請碼註冊，之後用手機拍照上傳練習、填做了幾題，可以看自己的紀錄和每週排行。老師在後台管理學生、群組、上傳紀錄和排行。

可以從 Demo 的[學生登入頁](https://demo-question.aixwang.dev/student/login)試用，登入頁已經預填 Demo 學生帳號，按「登入」就能看到學生的手機畫面。

<img src="/images/blog/math-teacher-question-bank/student-home-mobile.jpg" alt="學生端手機首頁：本週題數、本週排名、連續天數，下方是最近上傳的練習" width="320">

<img src="/images/blog/math-teacher-question-bank/admin-submissions.jpg" alt="老師後台的上傳紀錄：其中一筆因照片題數和登錄題數對不上，被標為無效" width="720">

## 立即試用與聯絡

[進入 Demo](https://demo-question.aixwang.dev/admin/auth/login)：登入頁已經預填帳號 demo&#64;demo.com 和密碼 demo1234，按「登入」就能進去。

試完之後，歡迎[加官方 LINE](https://lin.ee/raoKSVR)。詢問的人很多，建議加好友後直接列出你的需求，寫得再長也沒關係，我跟夥伴都會一一看過，這樣能更快回覆你。需求可以這樣寫：

- 希望匯出的考卷有學校、班級、姓名欄
- 常用的圖形是拋物線和數線，希望也能改數字
- 學生寫完考卷後，想看到全班答錯最多的題目
- 希望詳解卷先列簡答再列解析

我們會依需求評估，再回覆可行性。

<p><a href="https://lin.ee/raoKSVR" target="_blank" rel="noreferrer" style="text-decoration:none"><img src="https://scdn.line-apps.com/n/line_add_friends/btn/zh-Hant.png" alt="加入好友" height="44" border="0" style="display:inline-block;height:44px;width:auto"></a></p>
