---
title: Claude Code Skill 是什麼？讓 AI 記住你的發文習慣和工作流
description: Skill 是把你的工作流程和偏好寫成 AI 可重複使用的指令文件，等於強化 AI 的記憶——關掉對話框之後 AI 不會失憶，之後改文案、改排程、改流程都能一句話完成。
pubDate: 2026-06-30
updatedDate: 2026-07-22
tags: [Skill, AI 工作流, Claude Code, Codex]
faqs:
  - question: Skill 和一般的 Prompt 有什麼不同？
    answer: Prompt 是一次性的指令，關掉對話就沒了；Skill 是存在專案裡的文件，每次開新對話 AI 都會照著執行，等於把你的習慣和流程變成 AI 的長期記憶。
  - question: 不會寫程式也能寫 Skill 嗎？
    answer: 可以。Skill 本質上是用中文（或任何語言）寫的說明文件，描述清楚「什麼情況、做什麼、注意什麼」即可，也可以請 AI 幫你把口述的流程整理成 Skill。
  - question: 只有 Claude Code 有 Skill 嗎？Codex 或其他 Agent 呢？
    answer: 這個概念（Agent Skills）已是各家 Agent 的通用做法，Codex、OpenClaw（龍蝦）、Hermes（愛馬仕）都有對應機制，寫法大同小異，學會一套就能通用。
---

**Skill 就是把你的工作流程、文案風格、發文習慣，整理成 AI 可以重複使用的指令文件。你可以把它理解成「強化 AI 的記憶」——沒有 Skill，關掉對話框 AI 就失憶了；有了 Skill，每次開新對話 AI 都記得你的規矩。**

## 沒有 Skill 的世界 vs 有 Skill 的世界

**沒有 Skill：**每次都要重新解釋一遍——「我的貼文開頭要有 hook、結尾要放社團連結、語氣要口語、每天早上 9 點發」……講到第五次你就不想用 AI 了。

**有 Skill：**這些規矩寫成一份文件放在專案裡。之後你只要說「發今天的文」，AI 自動照你的風格、你的排程、你的流程執行。要改，也是一句話：「以後改成晚上 8 點發」。

## Skill 實際上長什麼樣？

以自動發文為例，一份 Skill 大概會描述：

- **文案規則**：語氣、開頭 hook、hashtag 習慣、結尾 CTA
- **排程規則**：發文時間、平台順序（先 Threads 再 IG）
- **執行流程**:呼叫哪支腳本、用哪組 API 設定、發完怎麼確認
- **注意事項**：發文頻率上限、哪些內容要先給你過目

它就是一份用人話寫的說明書，AI 每次執行任務前都會先讀它。

## 為什麼 Skill 是課程的最後一塊拼圖？

前面三個模組（[桌面版安裝](/blog/why-desktop-claude-code-codex/)、[Meta API 申請](/blog/threads-api-tutorial/)、[自動發文與權限](/blog/auto-posting-permissions/)）讓流程「能跑」，Skill 讓流程「能長期用」：

1. 把常用任務封裝成可重用的工作流
2. 讓 AI 記住你的發文習慣，不用每次重教
3. 之後改內容、改時間、改流程，都是快速調整

學會寫 Skill 之後，你等於擁有一個懂你規矩的自動化助理——這也是從「玩 AI」到「用 AI 工作」的分水嶺。想針對你自己的工作流設計 Skill，可以約[一對一教學](/services/ai-tutor/)客製。
