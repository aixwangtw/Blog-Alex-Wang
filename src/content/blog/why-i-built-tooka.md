---
title: AI 圖文生成工具怎麼選？我為什麼自己開發開源的 Tooka
description: 市面上的 AI 圖文製作工具分三類：生圖模型直出（會失真跑版）、Canva 類套版（要手動排）、模板框架 + AI Agent（程式渲染、不跑版）。Tooka 屬於第三類，開源免費。
pubDate: 2026-07-22
updatedDate: 2026-07-22
tags: [AI 圖文生成, Tooka, 社群圖文, AI Agent]
featured: true
faqs:
  - question: 為什麼用 Midjourney、DALL·E 做的社群圖文常常跑版失真？
    answer: 因為生圖模型是用「畫」的，文字對它來說只是圖形——中文字常畫錯、人物容易失真、排版無法精準控制。適合做插圖素材，不適合直接產出帶文字、真人的圖文卡片。
  - question: Tooka 跟 Canva 差在哪？
    answer: Canva 是人拖拉介面套模板；Tooka 是 AI Agent 用程式渲染模板——你用中文描述內容，AI 生成整組 1080×1350 的輪播圖，字是真的字不是畫的，所以不會失真也不會跑版，還能一鍵發佈到 IG / FB / Threads。
  - question: Tooka 要付費嗎？
    answer: Tooka 本身開源免費，放在 GitHub 上。你需要的是一個 AI Agent（如 Claude Code 或 Codex 的訂閱，每月 20 美元起）來驅動它。
---

**AI 圖文生成工具分三類——生圖模型直出、Canva 類套版、模板框架＋AI Agent。前兩類的問題分別是「會失真」和「要手動排」，所以我開發了第三類的開源工具 [Tooka](https://github.com/js0980420/tooka)：文字用程式渲染、版型用模板鎖定，從根本上不跑版、不失真。**

## 三類工具的差別

| 類型 | 代表 | 優點 | 致命傷 |
| --- | --- | --- | --- |
| 生圖模型直出 | ChatGPT 生圖、Midjourney、各種 AI 生圖 | 畫面精美 | 文字是「畫」出來的——中文常出錯、人物會失真、排版不可控 |
| 套版工具 | Canva、簡報軟體 | 版型穩定 | 每張圖手動排，十張輪播排十次，AI 只能幫你想文案 |
| 模板框架＋AI Agent | **Tooka**（開源） | 程式渲染、批量生成、不跑版 | 需要會用 AI Agent（或用我做好的模板直接套） |

## 我在演講現場看到的痛點

我在[台中、雲林場講座](/services/speaking/)教「如何用 AI 製作不跑版、不失真的社群圖文」時，現場最常看到的挫折畫面很一致：指令下得沒什麼問題，但生出來的圖**文字是錯的、人物是歪的、每張風格都不一樣**。

根本原因：大家把「生圖模型」當成「排版工具」在用。**帶文字、真人的圖文不要用 ChatGPT 生圖，用模板工具來生**——字是真的字、版型是鎖定的模板，這樣才穩定。

## Tooka 怎麼運作

先看 30 秒的實際工作流示範：

<video src="/videos/tooka-workflow-demo.mp4" controls preload="metadata" playsinline style="width:100%;border-radius:1rem;"></video>

1. 你對 AI Agent（Claude Code / Codex）說：「把這篇文章做成 6 張知識型輪播」
2. Agent 透過 Tooka 的模板系統生成 React 元件——統一的品牌視覺（配色、字體、間距）
3. 輸出 [1080×1350 標準尺寸](/blog/ig-carousel-size/)的 PNG 輪播
4. 透過 Meta 官方 API [一鍵發佈到 IG / FB / Threads](/blog/auto-posting-permissions/)

整套是開源的：[github.com/js0980420/tooka](https://github.com/js0980420/tooka)。

## 怎麼開始？

- **會用 AI Agent 的人**：直接 clone repo 照 README 走
- **還不會 AI Agent**：先看[ AI Agent 是什麼](/blog/what-is-ai-agent/)和[零基礎入門路線](/blog/how-to-start-learning-ai/)，或約我的[一對一教學](/services/ai-tutor/)，從安裝到做出自己的圖文流程一次帶完
