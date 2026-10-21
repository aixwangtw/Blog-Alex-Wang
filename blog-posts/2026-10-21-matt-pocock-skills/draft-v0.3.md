---
title: Matt Pocock 開源 Skills 怎麼用？讓 AI 寫程式先問清楚，提升開發效率
description: TypeScript 講師 Matt Pocock 把每天開發用的 Skills 開源在 GitHub，發文當下近 30 萬顆星。grill-me 在 AI 動工前一輪一輪問清楚需求，後面接寫規格、切任務卡、寫程式、檢查、檢討。附 Claude Code、Codex 安裝方式。
slug: matt-pocock-skills
status: published
featured: false
pubDate: 2026-10-21
updatedDate: 2026-10-22
tags: [Skills, Matt Pocock, grill-me, AI 開發]
faqs:
  - question: 不會寫程式也能用 grill-me 嗎？
    answer: 可以。grill-me 不需要專案資料夾、不寫任何檔案，討論的也可以是事業決定或一篇文章。寫規格、切任務卡、寫程式那段流程才需要程式專案。
  - question: 輸入 /grill-me 跑出別的東西怎麼辦？
    answer: 改輸入 /mattpocock-skills:grill-me。用 Claude Code 插件安裝時，每個 Skill 都能加上插件名稱叫用，跟內建指令撞名時這樣寫就會叫到這套的。
  - question: grill-me 一次丟出很多題，可以改成一次問一題嗎？
    answer: 可以。在全域的 CLAUDE.md 加一行 When grilling, ask one question at a time.，這是官方說明頁給的做法。
  - question: 不知道現在該用哪個 Skill 怎麼辦？
    answer: 輸入 /ask-matt，描述你現在的狀況，它會告訴你該走哪條流程、用哪個 Skill。
  - question: 這套 Skills 要付費嗎？
    answer: 不用。Skills 以 MIT 授權開源，執行時用的是你自己 AI Agent 的方案額度，例如 Claude 或 ChatGPT 的訂閱。
---
Matt Pocock 把自己每天寫程式用的 Skills 開源在 GitHub：[mattpocock/skills](https://github.com/mattpocock/skills)，MIT 授權，發文當下近 30 萬顆星。他是有 9 年開發經驗的大神，做了 TypeScript 課程 Total TypeScript，也在 Vercel 負責過開發者推廣。

這套裡最多人用的是 `grill-me`：你要 AI 動工之前，它先把你的計畫拷問一頓，問到每個決定都講清楚才開始。

## 這套 Skills 在解決什麼問題？

讓 AI 少做重工。`grill-me` 在動工前把需求問清楚，`tdd` 先寫測試再寫程式，`improve-codebase-architecture` 定期找出可以整理的程式。README 把常卡的狀況和對應的 Skills 列成這樣：

| 狀況 | 用哪個 |
|---|---|
| AI 做出來的跟你想的不一樣 | `grill-me`、`grill-with-docs`：動工前先問清楚 |
| AI 講話太囉嗦，一句話能講完的拖成一大段 | `grill-with-docs`：邊問邊把專案裡的用詞整理起來，之後你跟 AI 講同一套話 |
| 程式寫完跑不起來 | `tdd`：先寫一個會失敗的測試，再寫程式讓它通過；`diagnosing-bugs`：難找的 bug 照固定步驟一步步抓 |
| 程式越改越亂 | `to-spec`：寫規格前先跟你確認要改程式的哪幾塊；`improve-codebase-architecture`：定期掃程式碼，找可以整理的地方 |

越改越亂最常見的就是改 A 壞 B。Matt 的做法是：同一件事的判斷只寫在一個地方，其他程式都來問它，不各寫一份。

我做的題庫系統，「題目能不能啟用」就是這樣（啟用的題目才能出卷）。缺詳解、選擇題沒標正確答案、非選擇題沒填答案、附圖沒抓到，這些檢查集中在題目資料的一個判斷裡。列表開關、編輯頁存檔、匯入頁「審核通過並啟用」、批次「全部啟用」，四個入口都只問它「還缺什麼」。後來加了「圖形選項還沒補圖不能啟用」，四個入口的程式一行都沒動，改的是那個判斷，再加上編輯頁畫面上提早提醒老師的那份檢查。（Matt 叫這種寫法 deep module。）

對應的 Skills：

- `improve-codebase-architecture`：輸入 `/improve-codebase-architecture`，它先看最近常改的地方，找出「要懂一件事得在好幾個檔案之間跳來跳去」這類可以收攏的程式，做成一份網頁報告，每個建議附改前改後的圖；你挑一個，它再跟你一題一題討論怎麼改。它只出報告、不改程式，作者建議每隔幾天跑一次。
- `codebase-design`：決定要收攏哪一塊之後，用它設計其他程式要怎麼來問：要給什麼、會拿回什麼，越少越好。可以輸入 `/codebase-design`，AI 遇到設計問題也會自己拿來用。
- `tdd`：測試從其他程式問的那個入口打進去，不管裡面怎麼判斷，之後重構時測試不會跟著亂壞。

想對照題庫程式的話：

| 內文說的 | 對應檔案／程式 |
|---|---|
| 題目資料裡「還缺什麼」的判斷 | `app/Models/Question.php` 的 `missingContentRequirements()`（逐題）、`scopeWithCompleteContent()`（批次查詢） |
| 列表開關 | `QuestionController::enable()` → `ApproveQuestionReviewAction::enable()` |
| 編輯頁存檔 | `QuestionController::update()` → `Question::syncEnabledWithRequirements()` |
| 匯入頁「審核通過並啟用」 | `QuestionImportController` → `ApproveQuestionReviewAction::enableQuery()` |
| 批次「全部啟用」 | `QuestionController::bulkEnable()` → `ApproveQuestionReviewAction::enableQuery()` |
| 編輯頁畫面上的提早提醒 | `resources/views/admin/question/_card_script.blade.php` 的 `enableBlockers()` |
| 加上「圖形選項還沒補圖不能啟用」 | commit `44463db` |

## grill-me 怎麼運作？

AI 動工前一輪一輪問你問題，每個決定都講清楚才開始寫。規則寫在 `grilling` 這個 Skill 裡（`grill-me` 只是叫它）：

1. 先把計畫拆成一個個要做的決定，只問現在答得出來的。你還沒決定做網站還是 App，它就不會問你要上架哪個商店。
2. 每題編號、附它建議的答案，你回「是」就照建議。
3. 要查的事（檔案裡寫什麼、工具有沒有裝）它另外開一個 AI 去查；要做決定的，每個都問你。
4. 每個決定都問過、你點頭了，它才動工。

一輪的格式長這樣（原文範本，我翻成中文）：

```output
❓ Q1 - 題目標題：題目內容，可能有好幾段，也可能附選項
➡️ AI 建議的答案
---
❓ Q2 - 題目標題：題目內容
➡️ AI 建議的答案
```

官方說明頁的提醒：

- 開新對話再開始，並關掉計畫模式（plan mode），它會讓 AI 急著交計畫、少問問題。
- 問得不夠細或跑題就直接講，不知道就回「不知道」。一路回「同意」四十題，計畫等於是 AI 寫的。
- 「表單做成一長頁還是分三頁」這種要看到東西才答得出來的，先用 `prototype` 做個能點的樣品。
- 官方舉的例子是 4 輪共 46 題。問到兩百題，通常是一次想做的事太多，先請 AI 把工作拆小。

### 有程式碼時，為什麼改用 grill-with-docs？

因為它會把專案自己的用語記下來，開新對話不用再跟 AI 重講一遍。問法跟 `grill-me` 一樣，多做兩件事：

- 用語表：它會先讀程式碼和用語表。你講的詞跟用語表寫的不一樣，或講得太模糊，它當場問你指的是哪個；一個詞談定了，馬上寫進用語表。
- 決策紀錄（也就是 ADR）：只記同時符合三個條件的決定：之後想改代價很大、沒有前因後果會看不懂、當初真的有別的選項。換一個隨時能換掉的套件就不用記。

其他談好的事只留在這次對話裡，所以談完要在同一個對話接著用 `to-spec` 寫規格。沒有程式碼的事，例如規劃活動、寫一篇文章，就用 `grill-me`，它不寫任何檔案。

我的題庫系統沒有用語表，「啟用」這個詞就是例子。10 月 15 日凌晨，「啟用」和「審核」還是兩件事，啟用後要再按一次審核通過；不到一小時改成啟用就是審核通過；當天晚上又改成啟用＝可命題，有缺的題目不能啟用，因為列表上顯示啟用中的題目，有的卻不能出卷。「待審核」到現在也有兩個意思：列表上方那張卡片是所有還不能出卷的題目，包含老師手動停用的；題幹、答案、詳解旁邊的小標籤，則是那一部分還沒人看過。有用語表的話，這幾個詞各寫一行定義，開新對話時我不用再解釋一次，AI 也不會把兩種待審核混成一個。

決策紀錄的部分，題庫的專案規矩檔有類似的東西。例如「待審核的部分不擋啟用」：老師確認啟用本身就算審核，如果規定審核完才能啟用，又規定啟用才算審核，兩邊會互相卡死。沒寫下這段，之後看程式的人會疑惑為什麼有待審核部分的題目也能啟用。

官方說明頁也寫了：有人認為用語表對 AI 本身幫助不大，主要是讓一起做專案的人講同一套話。

| 內文說的 | 對應檔案／程式 |
|---|---|
| 用語表 | 專案根目錄的 `GLOSSARY.md`（較早的影片裡叫 `CONTEXT.md`，2026 年 8 月改名） |
| 決策紀錄 | `docs/adr/` 底下，一個決定一個檔 |
| 「啟用」三次改定義 | 題庫 commit `a498c0ea`、`9b31c13b`、`c1f4a59b` |
| 兩種「待審核」 | 卡片：`resources/views/admin/question/index.blade.php`；部分狀態：`Question::REVIEW_PENDING` |
| 題庫的專案規矩檔 | `.ai/rules/question-enable.md` |

## 主要流程怎麼走？

問清楚需求、寫成規格、切成任務卡、寫程式、送審、回頭檢討，共六步，寫在 `ask-matt` 這個 Skill 裡。

我的題庫系統（補習班老師用的數學題庫，用 Laravel 寫）是在我裝這套 Skills 之前做的。下面拿我做題庫時真的遇到的決定，對照每一步會怎麼處理。系統大致長這樣：

- 資料庫：題目是中心，一題底下有多個選項；每份匯入的考卷記成一批，掛著它匯入的題目；題目和章節單元等標籤多對多；考卷另外存。
- 後端：收請求的那層只轉手、回結果，實際工作拆成 35 支小程式，一支做一件事。例如考卷上傳後丟到背景處理，由其中一支依序請 AI 讀考卷、解開 AI 回傳的資料、統一數學式寫法、建立題目。
- 前端：後台的匯入檢查頁左邊放原始考卷、右邊逐題卡片原地修改；題目編輯頁的數學式點了就能改；出卷頁可以複製到 Word。

1. **問清楚需求**：`grill-with-docs`。10 月 15 日那晚，啟用改成等於可命題之後，規則又改了一次：先定「補齊後由老師手動啟用」，不到一小時改成「補齊、三個部分都審核過就自動啟用，老師手動關掉的不自動打開」，又多加一個欄位記錄手動停用。「補齊後要不要自動啟用」「老師手動關的要不要自動開」動工前就問得出來，先問完就不用改第二次。
   - 要看到東西才答得出來的，先用 `prototype` 做樣品。我調根號和向量橫線的高度時，一個下午寫了六支資料轉換改全部題目的數學式，之後在瀏覽器量才發現直線和向量還差約 7 像素，寫法又得換。先拿一題在瀏覽器量過再套全部，就是這一步。
2. **寫成規格**：`to-spec` 把剛才聊的整理成規格，只跟你確認要動哪幾塊程式、測試從哪裡下手，寫好放到你指定的地方（GitHub、GitLab 的 issue，或電腦裡的檔案）。題庫的考卷匯入原本在上傳當下等 AI 讀完，老師要卡在上傳頁 10～30 秒；改成背景處理要動的是：接收上傳的程式、一個背景工作、搬進背景的匯入邏輯，再加一個讓畫面查進度的網址。規格要先跟你對的就是這張清單。
3. **切成任務卡**：`to-tickets` 把規格切成一張張任務卡，每張做完就有一小段功能能用，並寫明要等哪幾張先完成；它先列給你看，你說好才開卡。題庫匯入曾經只要一題附圖抓不到，整份考卷就 0 題入庫。修法可以切成「附圖失敗只標那一題待補圖」「整頁詳解直接略過」兩張，互不相干可以同時做；再加一張「還標著待補圖的題目不能啟用」，它要等第一張做完，因為它要找第一張加上的提示字。
4. **寫程式**，兩種做法選一種。`implement` 一次做一張卡、每張開新對話；`implement-spec` 一次做完整份規格，同時開好幾個 AI 分頭做，最後合進同一條分支。兩種都用 `tdd` 先寫測試。題庫的例子：Word 裡用 MathType 打的數學式，AI 讀不到內容會自己編，同一份 Word 匯入兩次，同一題的數學式兩次不一樣。我改成上傳時直接擋下、提示改存 PDF。那支測試有 8 個情況，像是 MathType 要擋、Word 內建方程式要放行、嵌 Excel 表格也要放行，全部從上傳入口打進去，不管裡面怎麼判斷。
5. **檢查和送審**：`code-review` 檢查兩件事，寫法有沒有照專案的規矩、做出來的有沒有照規格。題庫的規矩檔有一條：會改題目內容或審核狀態的流程，結尾都要呼叫同一個同步啟用狀態的方法，不能自己直接把題目設成啟用；新流程漏了這行，就是它該抓的。`pr` 規定送審說明要寫什麼：用最簡單的方式講改了哪裡（一張圖、一份檔案清單或改動片段都行）、附改前改後的對照、這次改動好不好退回、會影響到多少地方。AI 寫 PR 時會自己套用。
6. **回頭檢討**：`retro`，下一節講。上面那 7 像素就是它要處理的事：原本的檢查只看數學式原始碼，沒看畫面上的橫線實際在哪。我除了修正，也把「在瀏覽器量看得到的橫線」寫進規矩檔，人工輸入、AI 匯入、舊資料、匯出都照這個方式驗。

步驟 1 到 3 要在同一個對話裡做完，中間不要壓縮或清掉對話，規格和任務卡才接得上剛才聊的內容。

用 `implement-spec` 前要知道：

- 它最後交出一條分支，不會每張卡各開一個 PR。只有你的 issue 要靠 PR 才能關、或你主動要求時，它才在第一次合併後開一個草稿 PR。
- 同時能做幾張卡，看任務卡之間誰在等誰。你的 AI Agent 一次只能多開一個 AI 的話，它就只是比較慢的 `implement`。
- `code-review` 在所有卡完成後拿整份規格比對一次。官方說明頁記錄一位使用者五張卡的功能，檢查和修正來回跑了約四小時；它又開始第二輪全面檢查時，可以叫它只看剛修過的地方。
- 兩個 AI 同時改同一個檔案，就像兩個人同時改同一份 Word 檔，合併時可能撞在一起。兩張卡會動到同一個檔案時，讓其中一張等另一張做完。

| 內文說的 | 對應檔案／程式 |
|---|---|
| 收請求的那層 | `app/Admin/Controllers/` |
| 35 支小程式 | `app/Actions/`（一支一個 Action 類別） |
| 背景處理考卷的那支 | `ProcessQuestionImportAction`，由背景工作 `app/Jobs/ProcessQuestionImport.php` 呼叫 |
| 接收上傳的程式、查進度的網址 | `QuestionImportController`、它的 `status()` |
| MathType 那支 8 個情況的測試 | `tests/Feature/Admin/QuestionImportDocxOleTest.php` |
| 同步啟用狀態的方法 | `Question::syncEnabledWithRequirements()` |
| 規矩檔：同步啟用狀態 | `.ai/rules/question-enable.md` |
| 規矩檔：在瀏覽器量橫線 | `.ai/rules/general.md` |

## retro 會檢查什麼？

檢查這次開發 AI 在哪裡卡住，以及專案環境要怎麼調整，下次才不會再卡。它在開發結束後讀對話紀錄，建議依嚴重程度排序，你挑了才改；程式本身寫得對不對交給 `code-review`。

它看七類：

| 檢查項目 | 在看什麼 |
|---|---|
| 找檔案 | AI 是不是花很久才找到某個檔案，要不要在它一定會讀的檔案加一行指路 |
| 能不能交給工具擋 | AI 犯的錯，能不能用 lint、型別或測試自動抓到；專案完全沒設 pre-commit hook 也沒有 CI，這本身就是一個問題 |
| 專案規矩寫清楚沒 | 負責檢查的 AI 漏掉錯誤，是不是規矩沒寫、寫錯或寫得不清楚 |
| 每次都讀的設定檔太長 | 這個檔每次對話都會讀，太長就把裡面的規定搬去專案規矩，或改成交給工具擋 |
| 工具太吃用量 | 哪些工具一跑就吃掉一大堆用量、能不能省，例如某個工具每次都回一大串用不到的內容 |
| 寫了沒用的規定 | 設定檔裡有沒有寫了 AI 也不會照做不同的句子，例如「請寫出好程式」 |
| AI 拿不到的資訊 | AI 卡在缺什麼資訊，例如看不到開發伺服器的紀錄、沒有第三方服務的唯讀權限 |

專案規矩這類錯，它會先分開處理。有固定答案的，例如用了禁止的寫法、檔案放錯資料夾，就做成 lint 規則、pre-commit hook 或 CI，讓工具自動擋；要靠判斷的，例如不同檔案寫法要一致、要跟旁邊的程式風格一樣，才寫進專案規矩檔給負責檢查的 AI 看。

| 內文說的 | 對應檔案 |
|---|---|
| 每次對話都會讀的設定檔 | `AGENTS.md`、`CLAUDE.md`（專案裡的和你電腦全域的都算） |
| 專案規矩檔 | `CODING_STANDARDS.md`（檢查時才讀，寫程式時不讀） |

## 怎麼安裝？

貼一段話給 AI Agent 請它裝，或自己下指令，兩種選一種；同一個 AI Agent 兩種都裝，每個 Skill 會出現兩次。

### 方式一：貼給 AI Agent 安裝

把這段貼進 Claude Code 或 Codex，確認來源是 mattpocock/skills 再允許它執行安裝：

```prompt
請幫我安裝這個 Skills
https://github.com/mattpocock/skills
```

### 方式二：自己下指令

Claude Code 用插件安裝，預設會自動更新：

```bash
claude plugin install mattpocock-skills@claude-plugins-official
```

Codex 也有插件，每次啟動時自動更新：

```bash
codex plugin marketplace add mattpocock/skills
codex plugin add mattpocock-skills@mattpocock
```

其他 AI Agent 用 npx 安裝，`<agent>` 換成你用的工具名稱（例如 cursor），不加 `-a` 會讓你自己選：

```bash
npx skills@latest add mattpocock/skills -a <agent>
```

npx 是把檔案複製進你的專案，可以自己改，但不會自動更新，要更新時跑 `npx skills@latest update`。安裝程式問要裝哪些 Skills 時，記得勾 `setup-matt-pocock-skills`。

### 每個專案跑一次設定

要用寫規格、切任務卡這段開發流程的專案，在 AI Agent 裡跑一次：

```agent
/setup-matt-pocock-skills
```

它會問三件事：任務卡放哪（GitHub、GitLab、本機檔案或其他）、分類任務卡用哪些標籤、文件存在哪。它先讀你的專案提出建議，等你確認才寫檔。只用 `grill-me` 的話不用跑這步。

裝好後開一個新對話，輸入 `/grill-me` 就能開始。

## 看影片介紹

<video src="/videos/grill-me-reel.mp4" poster="/images/grill-me-reel-poster.webp" controls preload="metadata" playsinline width="360" style="display:block;max-width:100%;height:auto;margin:0 auto" aria-label="grill-me Skill 介紹影片"></video>

[在 Instagram 查看這支影片](https://www.instagram.com/reel/DbwqIJkydIQ/)

## 原文依據

作者經歷：[Total TypeScript 首頁](https://www.totaltypescript.com/)（Total TypeScript、Vercel 開發者推廣）、[This Dot 的訪談整理](https://www.thisdot.co/blog/get-100k-followers-by-teaching-typescript-with-matt-pocock-author-of-total)（2017 年開始寫網頁程式，9 年開發經驗由此推算）。

題庫系統的例子出自我自己題庫系統的提交紀錄和專案規矩檔。

以下都對照 mattpocock/skills 在 2026 年 10 月 19 日的版本（commit `5beb35b`）。

- 這套 Skills 在解決什麼問題：[README](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/README.md)；改 A 壞 B 與深模組：[codebase-design 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/codebase-design/SKILL.md)、[codebase-design 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/codebase-design.md)、[improve-codebase-architecture 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/improve-codebase-architecture.md)、[tdd 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/tdd/SKILL.md)
- grill-me 怎麼運作：[grilling 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/productivity/grilling/SKILL.md)、[grill-me 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/productivity/grill-me.md)、[「回答是就採用建議」的變更紀錄](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/.changeset/grilling-yes-accepts-recommendation.md)；有程式碼時用 grill-with-docs：[grill-with-docs 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/grill-with-docs.md)、[domain-modeling 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/domain-modeling/SKILL.md)、[用語表改名的 commit](https://github.com/mattpocock/skills/commit/d80fa0f4ebe0c5714af0adf8670336065233ecc6)
- 主要流程怎麼走：[ask-matt 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/ask-matt/SKILL.md)、[implement-spec 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/implement-spec.md)、[CHANGELOG](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/CHANGELOG.md)
- retro 會檢查什麼：[retro 的 Skill 原文](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/retro/SKILL.md)、[retro 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/retro.md)
- 怎麼安裝：[README 的 Installation](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/README.md#installation-30-second-setup)、[setup-matt-pocock-skills 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/setup-matt-pocock-skills.md)、[插件命名說明](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/.out-of-scope/harness-name-collisions.md)
