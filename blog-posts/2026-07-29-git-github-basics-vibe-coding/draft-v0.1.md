---
title: AI 一直問要不要 commit？寫給非工程師的 Git 與 GitHub 白話筆記
description: 整理 Gary Chen 的 19 分鐘 GitHub 教學：commit 是遊戲存檔、branch 是平行時空、worktree 讓多個 AI 平行開發，最後從影片 162 則留言挑出七個大家都在問的問題，一次補完答案。
slug: git-github-basics-vibe-coding
status: draft
featured: false
pubDate: 2026-07-29
tags: [Git, GitHub, Vibe Coding, Claude Code]
faqs:
  - question: branch 跟 worktree 差在哪？全部都開 worktree 不就好了？
    answer: branch 是版本紀錄裡的一條線，worktree 是把某條線攤開成一個實體資料夾。在同一個資料夾裡切 branch，一次只能停在一條線上；worktree 等於多擺幾張桌子，每張桌子各停一條線。一個人做一件事的時候，切 branch 就夠了，成本最低；要讓多個 AI 同時各做各的任務，才值得開 worktree。開了也記得用完收掉（git worktree remove），一堆資料夾放著不管，之後會分不清哪個是哪個。
  - question: stash 是什麼？影片沒講到。
    answer: 改到一半、還不想 commit，卻臨時要切去處理別的事，這時可以把桌上未完成的修改先掃進抽屜，這個抽屜就是 stash。之後 git stash pop 拿回來繼續改。它跟 commit 的差別在於 stash 只是暫存，不會進版本紀錄。用 AI 開發時它多半會幫你小步 commit，實際用到 stash 的機會不多，知道有這個抽屜就好。
  - question: branch 依賴的資料結構被 main 改掉了，合併不就把程式改壞了嗎？
    answer: 會，而且這種壞法 Git 抓不到。兩邊改的可能是不同檔案，文字上完全不衝突，Git 就直接合併過去，邏輯上卻已經壞了。所以合併不能只看「沒有 conflict」：merge 完要跑測試，或至少實際打開程式操作一輪。比較安全的順序是先把 main 的最新版合回自己的 branch，在 branch 上修到能動、測試通過，再開 PR 收回 main。
  - question: AI 邊做邊改，留下一堆用不到的程式碼，後期怎麼瘦身？
    answer: 開一條專門的 branch（例如取名 cleanup），叫 AI 只做一件事：找出沒有被使用的程式碼和重複邏輯，逐步刪除，每刪一步就確認功能正常再 commit。分小步存檔，改壞了隨時退回上一步。留言區網友 @bruce1101036 的建議也是這個方向：直接要求 AI 重構、檢查並清除冗碼。切記別在做新功能的同一條 branch 上順手大掃除，兩件事混在一起，出問題會分不清是誰弄壞的。
  - question: 為什麼叫 commit 不叫 save？push 不叫 upload？
    answer: save 的意思通常是「覆蓋目前的檔案」，commit 則是「把這一步永久記進歷史」，有承諾、定案的意味，資料庫領域也用 commit 表示這筆交易確定寫入、不能反悔。push 和 pull 是一對，以你為主詞：把你的紀錄推上去、把別人的紀錄拉下來。它們同步的是整段版本歷史，要把兩邊的紀錄接起來，跟單純傳一個檔案的 upload/download 是不同層次的動作，所以用了不同的字。
  - question: fork 是什麼？跟 clone 差在哪？
    answer: clone 是把專案抓一份到你的電腦；fork 是在 GitHub 雲端上，把別人的專案複製成一份掛在你帳號底下的副本。因為別人的專案你沒有上傳權限，開源協作的標準流程是先 fork 出自己的副本，clone 下來修改，push 回自己的 fork，最後對原專案開 PR 請對方收下。改自己的專案不需要 fork，clone 就夠了。
  - question: AI 對話紀錄（session）可以用 Git 在多台電腦之間同步嗎？
    answer: 可以，只要是文字檔都能進 Git。Gary 在留言區回覆 @YuShaoChen 時也是這個方向：session 紀錄、memory.md 這類檔案放進 repo，commit 加 push 之後，另一台電腦 pull 下來就接得上。要注意對話紀錄常夾帶 API key 或私人資訊，repo 記得設 private，金鑰類檔案照樣走 .gitignore 排除。
---

用 Claude Code 或 Cursor 寫程式的人，大概都遇過同一個場面：功能做到一半，AI 突然停下來問「要不要先 commit？」「需要開一個 PR 嗎？」。按了同意，又不確定自己到底同意了什麼。

Gary Chen（[@garytalksstuff](https://www.youtube.com/@garytalksstuff)）在 2026 年 7 月 15 日發了一支 19 分 16 秒的影片[《給非技術人員的 Github 教學，Vibe Coding 必學的基礎技能》](https://www.youtube.com/watch?v=atqcAb7MFAM)，專門講給沒有程式背景、但天天被這些名詞轟炸的人。留言區最高讚（50 讚）的評價是「直接把我 3 個月 Vibe coding 摸到的經驗說得明明白白」；也有自稱寫了十年程式的觀眾留言說，第一次聽到 worktree 這個詞。

這篇是我看完影片的整理筆記，順著影片六個章節走，截圖都出自影片畫面。文末的 FAQ 則是另外從全部 162 則留言裡，挑出真的有人問、影片沒展開回答的七個問題，一題一題補完。想看完整講解，請直接看原片。

## 寫好的程式，放哪裡？（1:02 GitHub 和 Git 的差別）

影片開場丟出一個所有人都遇過的問題。AI 幫你把程式寫好了，放在自己電腦的資料夾裡，然後呢？不想只留在這台電腦、想換台電腦接著寫、想分享給朋友看——三個念頭，指向同一個答案。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0062s.jpg" alt="影片投影片：寫好的程式放哪裡？不想只留在這台電腦、換台電腦接著寫、分享給朋友看">

GitHub 就是放程式碼的雲端空間，角色類似工程師版的 Google Drive。而 Git 是另一個東西：裝在你電腦裡、負責建立版本紀錄的工具。影片用反面情境講這件事——如果今天沒有 Git，你只能靠手動複製資料夾備份，「最終版」「真的最終版」「打死不改版」那種災難。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0122s.jpg" alt="影片投影片：如果今天沒有 Git——Git 是建立版本紀錄的關鍵工具">

分工其實很單純。Git 在你的電腦上記錄每一個版本；GitHub 在雲端存放這些紀錄，讓多人（或多個 AI）協作。

## commit 是遊戲存檔（3:21 commit 與 push）

影片用 Gary 自己做的「記帳小幫手」App 當例子：登入頁面終於能順利運作了，這時冒出「想要存檔」的念頭，那個動作就是 commit。比喻是打電動——**打大魔王前，先手動存檔**。等一下 AI 要大改程式（打大魔王），先 commit 一次，改壞了才有存檔點可以讀。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0201s.jpg" alt="影片投影片：想要存檔的念頭 = commit，打大魔王前先手動存檔">

commit 只存在你的電腦裡。想把存好的進度丟到網路上備份、分享給朋友，就要 push：把本地的版本紀錄推上 GitHub 雲端。

這一章還藏了整支影片最重要的安全提醒。push 上去的東西，公開 repo 人人看得到，所以 API key、密碼這類金鑰檔案要用 `.gitignore` 排除，叫 Git 從頭到尾別追蹤它們：

<img src="/images/blog/git-github-basics-vibe-coding/shot_0321s.jpg" alt="影片投影片：.gitignore 列出 .env、*.key、secrets/、credentials.json，標示不追蹤">

`.env`、`*.key`、`secrets/`、`credentials.json`，這幾行出現在影片 5:21 的畫面上。金鑰一旦 push 到公開 repo，就當作已經外洩，改金鑰比刪紀錄實際。

## clone、pull 與 branch（6:11）

朋友想跑你的 App，他從 GitHub 把整個專案抓一份到自己電腦，這叫 clone，整個專案含歷史紀錄完整複製一份。之後你又推了新功能上去，朋友的電腦裡還是舊版，他問「我要怎麼拿到最新版？」答案是 pull：把雲端的新紀錄拉下來。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0431s.jpg" alt="影片投影片：朋友的電腦透過 pull 從 GitHub 雲端取得新功能">

這一章的後半進入 Git 的關鍵概念：branch。main 這條線代表穩定運行中的版本，要做新功能就從 main 分出一條新的線去做，做壞了也不影響 main。

影片給了一個很好記的畫面：專案資料夾是一張「神奇辦公桌」，branch 是平行時空切換按鈕。切到 main，桌上呈現穩定版本的程式碼；切到新功能的 branch，桌上瞬間換成那個時空的內容。桌子只有一張，同一時間只能停在一條 branch 上。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0551s.jpg" alt="影片投影片：專案資料夾 = 神奇辦公桌，branch = 平行時空切換按鈕，桌上呈現穩定版本的程式碼">

記住「桌子只有一張」這個設定，下一章 worktree 的存在理由就不用背了。

## worktree 與 PR：讓多個 AI 平行開發（10:42）

情況又變了。你開了兩個 Claude Code，一個做資料庫任務，一個重新設計 UI，兩個同時在同一個資料夾裡改——影片的原話：絕對是一場災難。桌子只有一張，兩個 AI 互相蓋掉對方的東西。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0611s.jpg" alt="影片投影片：兩個 Claude Code 同時操作同一個資料夾，標示絕對是一場災難">

以前的工程師一次專心做一件事，切 branch 就夠用；AI 時代你會想同時開好幾個任務，worktree 因此變得重要。它讓每條 branch 擁有自己的實體資料夾，等於多擺幾張桌子，每個 AI 在自己的桌上工作，互不干擾。

功能做完之後呢？開 PR（pull request），請求把這條 branch 的成果收回 main。GitHub 上可以掛自動檢查，測試都通過、（或你自己或 AI）審過改動沒問題，就按下 merge 合併。

<img src="/images/blog/git-github-basics-vibe-coding/shot_0762s.jpg" alt="影片投影片：branch 功能完成、檢查通過後合併回 main 主線">

合併時最頭痛的狀況是 conflict。影片講得很直白：**Git 很死板，同一行被兩個人各動過一次，就直接判定衝突**，就算兩邊的改動在人類看來根本不矛盾——例如 Gary 在分類清單最後一行加了「理財分類」，朋友剛好也在同一行加了別的東西。Git 不會替你決定要留誰的，它只負責把問題攤在你面前。

處理方式也很 vibe coding：把取捨的方向講清楚，讓 AI 動手。影片示範的提示詞是這樣寫的：

<img src="/images/blog/git-github-basics-vibe-coding/shot_0942s.jpg" alt="影片投影片：對 Claude Code 下指令——幫我解掉這個 conflict，分類列表的邏輯以朋友的為主，但把我的理財分類移到右邊的進階選單裡面">

「幫我解掉這個 conflict。分類列表的邏輯以朋友的為主，但是把我的『理財分類』，移到右邊的進階選單裡面。」——決策你下，苦工 AI 做。

## 改壞了怎麼救（15:53）

影片把這章叫做「Vibe Coder 每天都在怕的時刻」。AI 把程式碼改壞了，怎麼辦？

<img src="/images/blog/git-github-basics-vibe-coding/shot_0953s.jpg" alt="影片投影片：Vibe Coder 每天都在怕的時刻——AI 改壞了，怎麼救？">

前面每一次 commit 都是存檔點，救法就是讀檔。而且這些指令你不用硬背，直接用自然語言跟 Claude Code 說「回到上一個 commit」「這個檔案還原成改壞之前的樣子」就行，前提是你有在打大魔王之前存檔。整支影片繞了一圈，又回到 commit 的重要性。

總結的「進階武器」表把觀念收得很乾淨：branch 是安全的實驗沙盒；worktree 讓每條 branch 有自己的實體資料夾；PR + merge 把成果正式收回 main；conflict 不是末日，等你下產品決策。

<img src="/images/blog/git-github-basics-vibe-coding/shot_1073s.jpg" alt="影片總結投影片：branch、worktree、PR + merge、conflict 四項進階武器與各自的一句話定義">

## 看完之後：留言區比影片更誠實

這支影片下面的 162 則留言，大多是感謝，但零星的提問反而畫出了「聽懂基礎之後，下一步會卡在哪」的地圖：branch 跟 worktree 到底差在哪、stash 和 fork 是什麼、合併真的不會把程式改壞嗎、AI 留下的冗碼怎麼清、為什麼這些指令的名字這麼怪。下面的 FAQ 就從這些真實提問來，影片沒展開的部分，我用自己的理解補上；有一題（session 同步）Gary 本人在留言區回過，我把方向一併整理進去。

最後再說一次出處：本文所有觀念與截圖都來自 Gary Chen 的原片[《給非技術人員的 Github 教學，Vibe Coding 必學的基礎技能》](https://www.youtube.com/watch?v=atqcAb7MFAM)，比喻是他的，功勞也是他的，這裡只是筆記加上留言區的整理。影片結尾提到他的 Patreon 有更完整的 Git 情境對照表，有需要的人可以自己去翻。

## 相關閱讀

- [Claude Code 是什麼？為什麼要用桌面版 AI Agent？](/blog/why-desktop-claude-code-codex/)
- [ChatGPT 跟 Claude 比較：預算只夠訂閱一個該選哪個？](/blog/claude-or-codex-budget/)
