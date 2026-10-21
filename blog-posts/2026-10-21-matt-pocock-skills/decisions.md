# matt-pocock-skills 改寫：已定案事項（2026-10-22）

給下一個 session 用 `/writing-shape` 接手。素材檔是同資料夾的 `fragments.md`，成稿寫在 `draft-v0.4.md`（已寫完開場，從下一段接著寫）。舊版 `draft-v0.3.md` 只當參考，不再改。

## 規則
- 遵守部落格 `AGENTS.md` 的寫文規則、本站專屬補充、本站錯誤範例，以及 de-ai-slop（`.agents/skills/de-ai-slop`）。
- 文章審過才上線：只改本機草稿，不推 CMS。文章目前在 CMS 是 draft，導覽卡片暫時連到 IG。
- 一次只寫一段，使用者點頭才寫下一段；每段都討論格式（段落、條列、表格）。
- 素材檔 `fragments.md` 在 shape 階段不改；缺例子就直接跟使用者講。
- 例子只用真實紀錄，沒有事故紀錄的不能寫成「曾經出過事」。

## 包裝
- 核心詞：避免改 A 壞 B，提升開發效率
- 標題：Matt Pocock 開源 Skills：避免 AI 寫程式改 A 壞 B，提升開發效率
- 導覽卡片：Matt Pocock 開源 Skills，避免改 A 壞 B（文章上線時再改）
- 第一句：用 AI 寫程式，最怕一個問題一直修不好：改好 A，B 又壞了。

## 讀者
- 會用 Claude Code 或 Codex 叫 AI 寫程式的人，不是資深工程師。
- 已懂：用 Claude Code／Codex 叫 AI 寫程式、Skills 是什麼、改一處壞別處的感覺。
- 沒懂、要在文中用例子帶出：模組、抽共用、深模組、解耦。程式名稱放各節末的表格，內文講白話。

## 範圍與結構
- 只講跟核心詞有關的：抽共用、深模組、解耦，加上 grill-me／grill-with-docs、tdd、retro 怎麼配合。pr、implement-spec、to-tickets 一句帶過並連官方 README。
- 例子全部用桌遊揪團網站（heavy-board-games），不用數學題庫：
  - 抽共用：名額計算前後端 10 份收成 1 份（dabfe8760923697480e60517a3a6b950c1355921），順帶「散彈式修改（Shotgun Surgery）」一詞，不展開；後台還殘留一份，照實寫。
  - 深模組：按一下報名，背後八件事（fda2ee78b39cd9f8c0ebbde047f8ea69c4a69bcf）；真實事故是同時核准可能超額（4ad12db69c1805cf250fbfd4b79843ff5c7e3f11），那是超額問題，不寫成改 A 壞 B。
  - 解耦：報名只說「通知團主」，寄不寄信交給通知那塊（e17489f44a648d39047d7d14c071fbf5df5b65d3）；舊大程式還留轉接入口，照實寫。
- 每個例子都要寫「通常怎麼黏在一起」和「怎麼分開」。
- 安裝方式放文末，FAQ 保留。
- 文末延伸閱讀放 Gary 的〈AI 改 code 一直改 A 壞 B？你缺的是這五個步驟〉https://www.youtube.com/watch?v=CMs8YMU6_RM（他講流程面，這篇講架構面）。

## 已寫的段落（draft-v0.4.md）
- 開場用 A「名額算了 10 份」。「數字可能對不起來」是從兩套算法推論的，沒有使用者回報紀錄，所以寫「可能」。

## 待使用者回答
- Q29：第二段用這版？
  > 這種問題，軟體工程早就有對付的老方法：抽共用、深模組、解耦。TypeScript 講師 Matt Pocock 把這些方法寫進他開源的 Skills，讓 AI 寫程式時照著做。他是有 9 年開發經驗的大神，做過 Total TypeScript 課程，也在 Vercel 負責過開發者推廣。他的 Skills 在發文當下近 30 萬顆星。

## 事實限制
- 三個概念不是 Matt 提出的：深模組出自 Ousterhout《A Philosophy of Software Design》（Matt README 列為參考）；重複程式碼、散彈式修改是 Fowler《Refactoring》第 3 章的壞味道（Matt 的 code-review 清單有）；解耦是通用說法，Matt repo 沒用 decouple 這個詞。文末原文依據要補這兩本書。
- 「9 年」出自 This Dot 2023 訪談整理（2017 開始寫網頁程式），是第二手來源，使用者決定照寫。
- grill-me 現行版是一輪問完現在問得下去的問題、每題附建議答案、題目寫成回答「是」就採用建議；Gary 影片說的「一次問一題」是舊版。
- 星數寫「發文當下近 30 萬」，不寫查詢日期。
