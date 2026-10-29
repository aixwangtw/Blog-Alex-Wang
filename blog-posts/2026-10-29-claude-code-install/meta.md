---
slug: claude-code-install
title: Claude Code 安裝教學：桌面版、VS Code、CLI 三種裝法
description: Claude Code 要 Pro 以上方案才能用。桌面版不用打指令，VS Code 外掛邊做邊看程式碼，CLI（終端機畫面）一行指令就裝好。Windows、Mac 步驟與常見安裝錯誤的修法都在這篇。
tags: [Claude Code, VS Code, 安裝教學]
faqs:
  - question: Claude 免費版可以用 Claude Code 嗎？
    answer: 不行。Claude Code 要 Pro、Max、Team 或 Enterprise 方案才能用。發文當下 Pro 月繳 20 美元。
  - question: 桌面版、VS Code 外掛、CLI 要裝哪一個？
    answer: 沒用過程式工具的人裝桌面版，全程不用打指令；想邊做邊看程式碼的人裝 VS Code 外掛；想在終端機輸入 claude 直接用的人用 CLI（終端機畫面）的一行指令安裝。三種挑一種就好。
  - question: 裝了桌面版或 VS Code 外掛，終端機就能輸入 claude 嗎？
    answer: 不能。桌面版和外掛各自帶一份 Claude Code，只在自己的視窗裡用。想在終端機輸入 claude，要再用 CLI 的安裝指令裝一次。
  - question: 輸入 claude 出現 not recognized 或 command not found 怎麼辦？
    answer: 先關掉終端機、開一個新視窗再試。還是不行，把完整錯誤訊息連同文末的提示詞貼給 Claude 或 ChatGPT 這類 AI，請它幫你排除。
  - question: Windows 一定要裝 Git for Windows 或 WSL 嗎？
    answer: 都不用。Git for Windows 是官方建議但非必要，沒裝時 Claude Code 改用 PowerShell 執行指令。WSL 是想用 Linux 環境開發時才需要。
  - question: 瀏覽器登入後沒有跳回終端機怎麼辦？
    answer: 瀏覽器顯示登入碼的話，把登入碼貼回終端機 Paste code here if prompted 的地方。瀏覽器根本沒打開，就在終端機按 c 複製登入網址，自己貼到瀏覽器。
---
