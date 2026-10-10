---
title: "AI 圖文生成工具怎麼選？我為什麼自己開發開源的 Tooka"
description: "市面上的 AI 圖文製作工具分三類：生圖模型直出（會失真跑版）、Canva 類套版（要手動排）、模板框架 + AI Agent（程式渲染、不跑版）。Tooka 屬於第三類，開源免費。"
faqs: [
 {
  "question": "為什麼用 Midjourney、DALL·E 做的社群圖文常常跑版失真？",
  "answer": "因為生圖模型是用「畫」的，文字對它來說只是圖形——中文字常畫錯、人物容易失真、排版無法精準控制。適合做插圖素材，不適合直接產出帶文字、真人的圖文卡片。"
 },
 {
  "question": "Tooka 跟 Canva 差在哪？",
  "answer": "Canva 是人拖拉介面套模板；Tooka 是 AI Agent 用程式渲染模板——你用中文描述內容，AI 生成整組 1080×1350 的輪播圖，字是真的字不是畫的，所以不會失真也不會跑版，還能一鍵發佈到 IG / FB / Threads。"
 },
 {
  "question": "Tooka 要付費嗎？",
  "answer": "Tooka 本身開源免費，放在 GitHub 上。你需要的是一個 AI Agent（如 Claude Code 或 Codex 的訂閱，每月 20 美元起）來驅動它。"
 }
]
---
<p><strong>AI 圖文生成工具分三類——生圖模型直出、Canva 類套版、模板框架＋AI Agent。前兩類的問題分別是「會失真」和「要手動排」，所以我開發了第三類的開源工具 <a href="https://github.com/js0980420/tooka">Tooka</a>：文字用程式渲染、版型用模板鎖定，從根本上不跑版、不失真。</strong></p>
<h2 id="三類工具的差別">三類工具的差別</h2>
<table>
<thead>
<tr>
<th>類型</th>
<th>代表</th>
<th>優點</th>
<th>致命傷</th>
</tr>
</thead>
<tbody><tr>
<td>生圖模型直出</td>
<td>ChatGPT 生圖、Midjourney、各種 AI 生圖</td>
<td>畫面精美</td>
<td>文字是「畫」出來的——中文常出錯、人物會失真、排版不可控</td>
</tr>
<tr>
<td>套版工具</td>
<td>Canva、簡報軟體</td>
<td>版型穩定</td>
<td>每張圖手動排，十張輪播排十次，AI 只能幫你想文案</td>
</tr>
<tr>
<td>模板框架＋AI Agent</td>
<td><strong>Tooka</strong>（開源）</td>
<td>程式渲染、批量生成、不跑版</td>
<td>需要會用 AI Agent（或用我做好的模板直接套）</td>
</tr>
</tbody></table>
<h2 id="我在演講現場看到的痛點">我在演講現場看到的痛點</h2>
<p>我在<a href="/services/speaking/">台中、雲林場講座</a>教「如何用 AI 製作不跑版、不失真的社群圖文」時，現場最常看到的挫折畫面很一致：指令下得沒什麼問題，但生出來的圖<strong>文字是錯的、人物是歪的、每張風格都不一樣</strong>。</p>
<p>根本原因：大家把「生圖模型」當成「排版工具」在用。<strong>帶文字、真人的圖文不要用 ChatGPT 生圖，用模板工具來生</strong>——字是真的字、版型是鎖定的模板，這樣才穩定。</p>
<h2 id="tooka-怎麼運作">Tooka 怎麼運作</h2>
<p>先看 30 秒的實際工作流示範：</p>
<p><video src="/videos/tooka-workflow-demo.mp4" controls preload="metadata" playsinline style="width:100%;border-radius:1rem;"></video></p>
<ol>
<li>你對 AI Agent（Claude Code / Codex）說：「把這篇文章做成 6 張知識型輪播」</li>
<li>Agent 透過 Tooka 的模板系統生成 React 元件——統一的品牌視覺（配色、字體、間距）</li>
<li>輸出 <a href="/blog/ig-carousel-size/">1080×1350 標準尺寸</a>的 PNG 輪播</li>
<li>透過 Meta 官方 API 一鍵發佈到 <a href="/blog/instagram-api-tutorial/">IG</a> / FB / <a href="/blog/threads-api-tutorial/">Threads</a></li>
</ol>
<p>不想安裝或 clone repo，可以直接開啟 <a href="https://tooka.js0980420.workers.dev/">Tooka 線上版</a> 在瀏覽器使用。</p>
<p>需要自行部署、修改模板或查看完整原始碼，可以前往 <a href="https://github.com/js0980420/tooka">GitHub：js0980420/tooka</a>。</p>
<h2 id="怎麼開始">怎麼開始？</h2>
<ul>
<li><strong>會用 AI Agent 的人</strong>：直接 clone repo 照 README 走</li>
<li><strong>還不會 AI Agent</strong>：約我的<a href="/services/ai-tutor/">一對一教學</a>，從安裝到做出自己的圖文流程一次帶完</li>
</ul>
