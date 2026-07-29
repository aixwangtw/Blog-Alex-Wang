---
title: Codex Record & Replay 怎麼用？錄一次操作教會 Codex 你的流程，加上 Fork 與手機遠端
description: Record & Replay 是 Codex 外掛：左上角外掛程式搜尋安裝，錄一次螢幕操作就整理成可重複使用的 Skill。同場整理 Fork、側邊對話、引導與手機遠端的用法。
slug: codex-record-replay
status: draft
featured: false
pubDate: 2026-07-29
tags: [ChatGPT, Codex, Record & Replay, Skill, 手機遠端]
---

這篇整理自 Gary Chen（[@garytalksstuff](https://www.youtube.com/@garytalksstuff)）2026 年 7 月 12 日的影片[《Codex 新功能教學，Record & Replay、對話快搜、Fork、手機遠端操控一次講清楚》](https://www.youtube.com/watch?v=pJR6I9_06e4)，片長 15 分 30 秒，是他 Codex 新手入門教學的續集。影片講了四組更新：懸停式導航欄搭配 Fork、側邊對話與引導、Record & Replay、手機遠端操控。

我把每個功能的操作步驟按影片時間點整理成文字，方便之後要用的時候查。文末另外整理了影片留言區實際出現的問題——找不到功能、品牌整併的混淆、手機平台限制這些，影片正片沒有回答到的，我補上目前查得到或判斷得出的說法。完整示範還是建議看原影片。

## 懸停式導航欄＋Fork：回到上下文髒掉的那一輪（影片 0:44）

第一個更新很小，但跟 Fork 放在一起就有意思了。在很長的 Codex 對話裡，把滑鼠移到對話區左側空白處的橫線上，會浮出一個小視窗，預覽附近幾輪你說了什麼、Codex 回了什麼。點一下，直接跳到那一段，不用往上滑，也不用靠記憶猜是哪一輪講過。

<img src="/images/blog/codex-record-replay/shot_0060s.jpg" alt="Codex 對話左側懸停出現預覽小視窗，顯示該輪的提問與回覆摘要">

Fork 則是每則回覆下方的分叉按鈕：從那個時間點複製出一條一模一樣的對話，前面的上下文全部保留，之後兩條 session 各走各的。

Gary 給的場景是專案來回二十幾輪之後畫面不對了——前面說過首頁標題保守一點、中間又說第三屏別太 sales，最後成品走樣，你想找出是哪一輪改壞的，又不想把舊上下文全部重看。做法就是先用導航欄定位 context 髒掉的那個節點，從那裡 Fork 一條新 session 出來，原本那條留著，新的那條當平行宇宙重試一次。

<img src="/images/blog/codex-record-replay/shot_0114s.jpg" alt="原 Session 與 Fork Session 對照：原線二十幾輪上下文變髒畫面不對，Fork 線找到髒掉節點後開新分支重試">

## 側邊對話與引導：主線在跑，怎麼插手不打斷（影片 1:54）

這兩個功能解決同一件事的兩種情況：任務跑到一半，你有話要說。

側邊對話（side chat）是點右上角的切換側邊面板按鈕，在旁邊開一條支線。主任務繼續跑，你在支線問「剛剛這個改法為什麼比較好」「你刪掉的那段有沒有值得留的」，答案不會進主線上下文。CLI 使用者對應的是 `/side` 和 `/btw` 這兩個 slash command，本質同一個東西，只是介面不同。

有個坑要先知道：主任務跑很久、重新連線過、或關過 App，側邊對話可能整條消失。所以支線適合問問題；真的問出重要結論，回主線再講一次。

引導（steering）是主線還在跑時，直接在對話框補一句新要求。桌面版這裡有個容易踩的細節——直接按 Enter 是排隊，等這一輪跑完才輪到你那句；按 `Command + Enter` 送出，才是現在就介入，在它燒掉更多時間和 token 之前把方向拉回來。

<img src="/images/blog/codex-record-replay/shot_0174s.jpg" alt="Steering 引導實際畫面：主線任務執行中，使用者直接補送指令要求先修手機版 overflow，Codex 停下桌面版改動轉向處理">

分流原則 Gary 講得很清楚：只是想理解，放側邊對話；真的要改方向，用引導。新手最常犯的錯是想到什麼都丟回主線，一句加一段，最後 Codex 收到一堆互相打架的要求，任務開始變形。

<img src="/images/blog/codex-record-replay/shot_0264s.jpg" alt="示意圖：想法 A 加一句、想法 B 補一段全丟進主線上下文，要求互相衝突導致主線任務變形">

## Record & Replay：錄一次操作，讓 Codex 整理成 Skill（影片 4:24）

這是整支影片的重頭戲。它針對的痛點很具體：想讓 Codex 學會你日常的工作流程，但你寫不出乾淨的 prompt，也不會自己做 Skill。很多流程難的地方在「我平常就是這樣做，但我不知道怎麼講」。

Record & Replay 的邏輯是把「講」換成「做」：錄下你的螢幕操作，Codex 分析之後整理成一個專屬 Skill，之後叫它做類似任務，它照這份流程一比一模仿你的步驟。

安裝方式（影片 5:14）：

1. 點左上角的「外掛程式」
2. 搜尋 Record and Replay
3. 點選 Plugin

<img src="/images/blog/codex-record-replay/shot_0324s.jpg" alt="Record & Replay 安裝方法三步驟：外掛程式、搜尋 Record and Replay、點選 Plugin">

觸發有三種：slash 指令、小老鼠符號，或最直覺的——在聊天框直接打「錄製我的操作並學習紀錄，變成可復用的 Skill」。單次最長錄 30 分鐘，錄製期間游標點到哪、鍵盤按了什麼都會記下來，結束時按停止鍵或輸入「完成錄製」。

影片舉的例子是每週固定的社群提案流程：開 Canva 選固定模板、依主題做五頁簡報、匯出 PPT、上傳 Google Drive、在 Gmail 草擬給主管的信。開錄之前有一句話很關鍵——先把整條流程的目的講給 Codex 聽，別讓它只看你點了什麼。知道目的，它理解錄影內容和整理 Skill 時才不容易跑偏。

錄完先別急著相信它學會了。**打開 Skill 檢查流程順序，再讓它實際跑一次**；跑偏就用自然語言修。Gary 提到重跑時它有機會反過來幫你把流程整理得更乾淨，修掉一些不穩定的步驟。整個體驗像在教實習生：你做一遍給他看，他整理完回頭問你「是不是這個意思」。

更進一步的玩法是跨 AI 工具聯動。影片示範了一條 Agent 接力：Gemini 負責看懂爆款短片（多模態分析畫面、節奏、鏡頭），分析結果貼給 Claude 重新發想成水果主題腳本，最後整理進 Excel 表。整條錄成 Skill 之後，下次丟一支新影片說「用水果影片改寫 Skill 跑一次」，Codex 就知道先找 Gemini、再找 Claude、最後自己整表。

<img src="/images/blog/codex-record-replay/shot_0444s.jpg" alt="跨 AI 工具聯動分工：Gemini 做多模態分析、Codex 負責錄製與串接、Claude 負責重新發想">

<img src="/images/blog/codex-record-replay/shot_0564s.jpg" alt="錄製示範中的 Claude 畫面：產出分幕腳本表格與節奏設計說明，下一步示範貼進 Excel">

界線也要講清楚。這功能本質上依賴 Codex 的 Computer Use，靠螢幕視覺辨識模擬你的游標和鍵盤，Gary 自己測下來每一步要十幾秒的思考時間。適合固定、重複、步驟明確的流程——每週一次的整理、固定格式的報告、把某個工具的輸出轉成固定格式。搶票、打遊戲這類即時任務，做不到。

## 手機遠端操控：人離開電腦，任務不中斷（影片 10:48）

這段講的功能推出比較久了，Gary 說是因為自己最近用得頻繁才拿出來講。背景畫面感十足：Business Insider 在 2026 年 5 月報導過，很多 AI 開發者出門時筆電不闔上、留一條縫，就為了讓 agent 在背景繼續跑。

現在的解法是用手機上的 ChatGPT 直接連到你電腦的 Codex。不只收通知——可以從手機開任務、接續任務、批准操作、看結果，還支援檔案預覽、側邊對話和 inline review comment，等於一個遠端控制面板。

連線步驟（影片 11:47）：到 Codex 設定裡選「連線」，開啟「可控制此電腦的裝置」並允許連線，按右上角新增，會出現一個 QR Code，拿手機掃完就連上了。

<img src="/images/blog/codex-record-replay/shot_0708s.jpg" alt="Codex 設定的連線頁面，跳出 Connect a device to this Mac 視窗，說明手機可接續任務、接收通知與發起新任務">

影片的使用情境：早上出門前交辦一份市場研究報告，通勤路上用手機看檔案預覽，發現第三段太繞，留一句 inline comment「第三段改短一點，直接講結論」，到公司時已經改好了。對長任務差別很大——以前離開電腦就只能等，回來才知道跑完沒；現在小決策在外面就能先做掉，進度不會因為你人不在就卡住。

兩個限制要知道。第一，真正跑 code、讀檔案、動 repo 的還是你的電腦或雲端環境，手機只是把指令送過去。第二，手機打不開你電腦上的 `localhost:3000`——localhost 指的是「這台設備自己」，手機上打這個網址，它找的是手機自己，你的預覽頁根本不在那裡。

<img src="/images/blog/codex-record-replay/shot_0828s.jpg" alt="localhost 圖解：Mac 的 localhost 指 Mac 自己，手機的 localhost 指手機自己，localhost:3000 的門牌掛在執行預覽的那台設備上">

遇到要看預覽頁的情況，合理做法是讓 Codex 在電腦端用瀏覽器打開頁面、檢查畫面、截圖回報，你在手機上看結果再給下一步 feedback。而這一切有個大前提：**電腦要開著、連著網，而且 Codex 連得上**，不然全部免談。

## 四個功能放在一起看

導航欄加 Fork 處理「過去」——找到髒掉的節點，回去改寫。側邊對話和引導處理「當下」——任務中途怎麼插手不打斷。Record & Replay 把你的操作習慣變成可重複的技能。手機遠端讓你人不在電腦前，任務照樣往前走。Gary 的總結我覺得貼切：Codex 越來越像一個能長時間陪你工作、跨裝置接續、把人類示範變成技能的 Agent Workspace。

## 大家都在問

以下問題都出自這支影片的留言區，有幾題正片沒有正面回答，我用查得到的資訊補上；查不到的我直接說查不到。

### 為什麼我找不到 Record & Replay？

它是外掛，預設沒有裝。桌面版左上角進「外掛程式」，搜尋 Record and Replay，點 Plugin 安裝，之後才會出現在聊天裡（影片 5:14 有完整畫面）。照做還是找不到的話，影片和留言區都沒有給出確定答案；比較可能的方向是 App 版本太舊，或功能還沒開放到你的帳號方案，可以先把桌面版更新到最新再找一次。

### Codex 不是被合併了嗎，怎麼還有 Codex？

留言區真的有人這樣問，Gary 本人有回覆：影片是在品牌整併之前錄的，整併之後功能沒有太大變動，介面左上角仍然選得到 Codex。名字和入口變了，這支影片教的操作照樣能用。

### 手機遠端只有 iPhone 能用嗎？

影片的示範環境是 Mac 配 iPhone 上的 ChatGPT App，留言區有觀眾反映 Windows 那邊連不起來。官方支援到哪裡影片沒講死，我也不想用猜的；實際判斷方式很直接——打開你電腦上的 Codex 設定，看有沒有「連線」和掃 QR Code 的選項，有就代表你的環境開放這個功能。另外記得，遠端要能動的前提是那台電腦開著、連著網。

### 大家都在介紹 Claude Code，Cursor 差很多嗎？

形態不一樣。Cursor 是一個編輯器，你在裡面寫程式，AI 在旁邊補；Claude Code 和 Codex 這類 agent 是接到任務後自己讀檔、改檔、跑指令，你負責驗收。教學影片偏愛後者，因為「交辦一整件事」的示範效果比「補全一段程式碼」明顯。哪個適合你要看工作方式，預算只夠選一個的話，我另外寫過一篇比較：[ChatGPT 跟 Claude 比較：預算只夠訂閱一個該選哪個？](/blog/claude-or-codex-budget/)

### 這跟以前的按鍵精靈有什麼不一樣？

留言區有人這樣類比，蠻傳神的。按鍵精靈錄的是滑鼠座標和按鍵序列，畫面一變就整組壞掉；Record & Replay 錄完後由 Codex 分析你在做什麼，整理成一份流程描述（Skill），重跑時靠視覺辨識找目標，跑偏還能用自然語言修。代價是慢——每一步十幾秒的思考時間，即時性任務別想。

## 內容來源

本文內容整理自 Gary Chen 的影片，所有功能示範與操作步驟皆出自原片，截圖亦取自影片畫面，特此註明並感謝原創作者：

- 影片：[Codex 新功能教學，Record & Replay、對話快搜、Fork、手機遠端操控一次講清楚](https://www.youtube.com/watch?v=pJR6I9_06e4)（2026-07-12）
- 頻道：[Gary Chen @garytalksstuff](https://www.youtube.com/@garytalksstuff)

## 相關閱讀

- [ChatGPT 跟 Claude 比較：預算只夠訂閱一個該選哪個？](/blog/claude-or-codex-budget/)
- [Claude Code 是什麼？為什麼要用桌面版 AI Agent？](/blog/why-desktop-claude-code-codex/)
