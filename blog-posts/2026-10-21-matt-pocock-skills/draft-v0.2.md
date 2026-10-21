---
title: Matt Pocock 的開源 Skills 怎麼用？從 grill-me 問清楚需求到 AI 寫完程式
description: TypeScript 講師 Matt Pocock 把每天開發用的 Skills 開源在 GitHub，發文當下近 30 萬顆星。grill-me 在 AI 動工前一輪一輪問清楚需求，後面接寫規格、切任務卡、寫程式、檢查、檢討。附 Claude Code、Codex 安裝方式。
slug: matt-pocock-skills
status: published
featured: false
pubDate: 2026-10-21
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

Matt Pocock 把自己每天寫程式用的 Skills 開源在 GitHub：[mattpocock/skills](https://github.com/mattpocock/skills)，MIT 授權，發文當下近 30 萬顆星。他是 TypeScript 課程 Total TypeScript 的作者，之前是 XState 核心團隊成員、在 Vercel 當過 developer advocate，現在經營教工程師用 AI 開發的 AI Hero。

這套裡最多人用的是 `grill-me`：你要 AI 動工之前，它先把你的計畫拷問一頓，問到每個決定都講清楚才開始。

## 這套 Skills 在解決什麼問題？

解決用 AI 寫程式時最常卡的幾件事：做出來跟你想的不一樣、寫完跑不起來、越改越亂。README 把狀況和對應的 Skills 列成這樣：

| 狀況 | 用哪個 |
|---|---|
| AI 做出來的跟你想的不一樣 | `grill-me`、`grill-with-docs`：動工前先問清楚 |
| AI 講話太囉嗦，一個詞能講完的事用二十個詞 | `grill-with-docs`：邊問邊整理專案用語表，之後你和 AI 用同一套詞 |
| 程式寫完跑不起來 | `tdd`：先寫一個會失敗的測試，再寫程式讓它通過；`diagnosing-bugs`：難抓的錯誤照固定步驟查 |
| 程式越改越亂 | `to-spec`：寫規格前先跟你確認要動哪些模組；`improve-codebase-architecture`：定期掃程式碼，找可以整理的地方 |

## grill-me 怎麼運作？

AI 動工前一輪一輪問你問題，問到每個決定都講清楚才開始寫。規則寫在 `grilling` 這個 Skill 裡（`grill-me` 只是叫它）：

1. 先把你的計畫拆成一個個要做的決定。
2. 它不會一口氣丟一堆問題。你還沒決定做網站還是 App，它就不會問你要上架哪個商店。
3. 每題編號、附上它建議的答案，你回「是」就照建議。
4. 你答完一輪，它再問下一輪。
5. 要查的事（檔案裡寫什麼、工具有沒有裝）它自己派子代理去查，不拿來問你。要做決定的，每個都問你。
6. 每個決定都問過、沒有它自己猜的，才算問完。你點頭了，它才動工。

一輪的格式長這樣（原文範本，我翻成中文）：

```output
❓ Q1 - 題目標題：題目內容，可能有好幾段，也可能附選項
➡️ AI 建議的答案
---
❓ Q2 - 題目標題：題目內容
➡️ AI 建議的答案
```

官方說明頁另外提醒幾件事：

- 開新對話再開始，不要接在 AI 已經寫好的計畫後面；也把計畫模式（plan mode）關掉，它會讓 AI 急著交出計畫，少問問題。
- 你要主動。問得不夠細就說，範圍跑掉就說，不知道就答「不知道」。一路回「同意」四十題，等於計畫是 AI 寫的、你只是點頭。
- 有些問題講不出答案，例如「表單做成一長頁還是分三頁」，要看到東西才知道。遇到這種就停下來，用 `prototype` 做一個試用版，看完再回來答。
- 一場正常的拷問是幾輪、幾十題，官方舉的例子是 46 題分 4 輪。問到兩百題通常是範圍太大，先請 AI 把工作切小，再分開問。

`grill-me` 不寫檔、不需要專案資料夾，討論的也可以是事業決定或一篇文章。在程式專案裡，作者建議改用 `grill-with-docs`：問法一樣，另外會讀你的程式碼，把用語和重要決定記成檔案（`GLOSSARY.md` 和 ADR），之後的對話都能接著用。

## 主要流程怎麼走？

問清楚需求、寫成規格、切成任務卡、寫程式、送審、回頭檢討，共六步，寫在 `ask-matt` 這個 Skill 裡：

1. **問清楚需求**：`grill-with-docs`，沒有專案資料夾就用 `grill-me`。遇到要看到實物才答得出來的問題，先繞去用 `prototype` 做試用版。
2. **寫成規格**：`to-spec` 把剛才的對話整理成一份規格，不再重新拷問，只跟你確認要在程式的哪幾個位置做測試，寫好發到你設定的地方（GitHub、GitLab 的 issue，或本機檔案）。
3. **切成任務卡**：`to-tickets` 把規格切成一張張任務卡，每張做完就有一小段功能能用，並寫明要等哪幾張先完成。例如做會員功能，「能註冊」一張、「能登入」一張，登入要等註冊做完。它會先列給你看，問你切得太粗還是太細，你同意才建立。
4. **寫程式**，兩種做法選一種：
   - `implement`：一次做一張卡，每張卡開新對話。過程用 `tdd` 先寫測試再寫程式，做完跑 `code-review`，從兩個方向檢查：有沒有照專案的程式規範、有沒有照規格做。
   - `implement-spec`：一次做完整份規格。它找出已經不用等別張的卡，同時派好幾個子代理去做（「能註冊」和「改大頭貼」互不相干，就一起做），每個也用 `tdd`，做完都合進同一條整合分支，全部完成後整條跑一次 `code-review`。
5. **送審**：`pr` 規定 PR 說明怎麼寫：用最小的圖說明改了什麼、附改前改後的證據、判斷這次合併能不能輕易退回、影響範圍多大。這個 AI 寫 PR 時會自己用，不用你打指令。
6. **回頭檢討**：`retro`，下一節講。

步驟 1 到 3 要在同一個對話裡做完，中間不要壓縮或清空對話，規格和任務卡才會接著剛才的討論寫。

用 `implement-spec` 前要知道這幾件事：

- 它的目標是一條整合分支，不會替每張任務卡各開一個 PR。只有你的 issue 系統靠 PR 結案、或你要求時，才在第一次合併後開一個草稿 PR。
- 同時能做幾張卡，要看任務卡之間誰在等誰，卡片多不代表快幾倍。你的 AI Agent 一次只能跑一個子代理的話，它就只是比較慢的 `implement`。
- `code-review` 拿整份規格比對，只在所有卡完成後跑一次。官方說明頁記錄一位使用者五張卡的功能，檢查和修正來回跑了約四小時；看到第二輪大範圍檢查開始時，可以叫它只確認修過的問題，然後停下。
- 兩個子代理同時改同一個檔案，就像兩個人同時改同一份 Word 檔，合併時可能撞在一起，或替同一個東西取了不同名字。兩張卡會動到同一個檔案時，讓其中一張等另一張做完。

## retro 會檢查什麼？

檢查這次開發 AI 在哪裡卡住，以及專案環境要怎麼調整，下次才不會再卡。它在開發結束後讀對話紀錄，建議依嚴重程度排序，你挑了才改；程式本身寫得對不對交給 `code-review`。

它看七類：

| 類別 | 看什麼 |
|---|---|
| 導航 | AI 是不是花很久才找到某個檔案，要不要在它一定會讀的檔案加一行指路 |
| 自動檢查 | AI 犯的錯，能不能用 lint、型別或測試抓到；專案完全沒有 pre-commit hook 也沒有 CI，本身就算一條問題 |
| 程式規範 | 負責檢查的 AI 漏抓了錯，要不要加規則、刪規則或寫清楚 |
| 全域 AGENTS.md | 這個檔每次對話都會載入，太大時把裡面的規定搬到程式規範或自動檢查 |
| 工具經濟 | 有沒有很耗用量的工具呼叫可以精簡，例如某個工具每次都回一大串用不到的內容 |
| 無效指令 | 設定檔裡有沒有寫了也不會改變 AI 行為的句子，例如「請寫出好程式」 |
| 資訊取得 | AI 缺了哪些資訊，例如開發伺服器的紀錄、第三方服務的唯讀權限 |

程式規範類的錯，它會先分種類。固定寫法的錯，例如用了禁用的函式、檔案放錯位置，做成 lint 規則、pre-commit hook 或 CI，交給程式擋；要靠判斷的，例如跨檔案寫法一致、跟周圍風格相同，才寫進 `CODING_STANDARDS.md`，給負責檢查的 AI 讀。

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

作者經歷：[Total TypeScript 首頁](https://www.totaltypescript.com/)（XState 核心團隊、Vercel developer advocate）、[GitHub 個人頁](https://github.com/mattpocock)（AI Hero）。

以下都對照 mattpocock/skills 在 2026 年 10 月 19 日的版本（commit `5beb35b`）。

- 這套 Skills 在解決什麼問題：[README](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/README.md)
- grill-me 怎麼運作：[grilling 的 SKILL.md](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/productivity/grilling/SKILL.md)、[grill-me 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/productivity/grill-me.md)、[「回答是就採用建議」的變更紀錄](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/.changeset/grilling-yes-accepts-recommendation.md)
- 主要流程怎麼走：[ask-matt 的 SKILL.md](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/ask-matt/SKILL.md)、[implement-spec 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/implement-spec.md)、[CHANGELOG](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/CHANGELOG.md)
- retro 會檢查什麼：[retro 的 SKILL.md](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/skills/engineering/retro/SKILL.md)、[retro 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/retro.md)
- 怎麼安裝：[README 的 Installation](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/README.md#installation-30-second-setup)、[setup-matt-pocock-skills 說明頁](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/docs/engineering/setup-matt-pocock-skills.md)、[插件命名說明](https://github.com/mattpocock/skills/blob/5beb35b040e3de97e54fa9e386d7e42d15c295c2/.out-of-scope/harness-name-collisions.md)
