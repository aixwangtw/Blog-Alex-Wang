---
title: "IG 輪播貼文尺寸是多少？用 AI 一句話生成 1080×1350 圖文"
description: "IG 輪播貼文建議尺寸是 1080×1350（4:5 直式），版面最大、觸及表現最好。不會設計工具也沒關係——用我開源的 Tooka，一句話就能讓 AI 生成整組標準尺寸的輪播圖文。"
faqs: [
 {
  "question": "IG 輪播貼文的標準尺寸是多少？",
  "answer": "建議用 1080×1350 像素（4:5 直式），這是動態消息裡佔版面最大的比例。正方形 1080×1080 也支援，但直式的曝光面積多了 25%。"
 },
 {
  "question": "輪播每一張的尺寸要一樣嗎？",
  "answer": "要。IG 會以第一張的比例裁切整組輪播，尺寸不一致就會出現不預期的裁切——這正是很多人「圖文跑版」的原因。"
 },
 {
  "question": "不會用 Photoshop 或 Canva 也能做輪播圖文嗎？",
  "answer": "可以。用 AI Agent 搭配 Tooka 這類模板工具，用中文描述內容就能生成整組統一尺寸、統一風格的輪播圖，直接匯出 PNG 發佈。"
 }
]
---
<p><strong>IG 輪播貼文建議尺寸是 1080×1350 像素（4:5 直式）。</strong> 這是動態消息中版面最大的格式，比正方形多 25% 的曝光面積；而且<strong>整組輪播的每一張都要同尺寸</strong>，IG 會用第一張的比例裁切全部，尺寸混用就是圖文跑版的主因。</p>
<h2 id="ig-各格式尺寸速查">IG 各格式尺寸速查</h2>
<table>
<thead>
<tr>
<th>格式</th>
<th>建議尺寸</th>
<th>比例</th>
</tr>
</thead>
<tbody><tr>
<td>輪播／貼文（直式，推薦）</td>
<td>1080×1350</td>
<td>4:5</td>
</tr>
<tr>
<td>貼文（正方形）</td>
<td>1080×1080</td>
<td>1:1</td>
</tr>
<tr>
<td>貼文（橫式）</td>
<td>1080×566</td>
<td>1.91:1</td>
</tr>
<tr>
<td>限時動態／Reels</td>
<td>1080×1920</td>
<td>9:16</td>
</tr>
</tbody></table>
<p>（平台規格可能調整，發佈前以 IG 官方說明為準。）</p>
<h2 id="為什麼手動做輪播圖這麼容易跑版">為什麼手動做輪播圖這麼容易跑版？</h2>
<ol>
<li><strong>尺寸不一致</strong>：第一張 4:5、第二張正方形，整組就被裁切</li>
<li><strong>文字安全區</strong>：邊緣的字會被介面元素蓋住</li>
<li><strong>多張圖風格不統一</strong>：每張分開做，字級、配色、間距慢慢跑掉</li>
</ol>
<p>用 Canva 可以解決一部分，但每張圖還是要手動排——十張輪播就是十次人工。</p>
<h2 id="用-ai-一句話生成整組輪播">用 AI 一句話生成整組輪播</h2>
<p>我在台中、雲林的講座帶學員實作時，發現多數人卡在「不會設計工具、也還不會用 AI Agent」，所以開發了開源工具 <strong><a href="https://github.com/js0980420/tooka">Tooka</a></strong>：</p>
<ul>
<li>你用中文描述內容（「幫我把這篇文章做成 6 張知識型輪播」）</li>
<li>AI Agent（Claude Code / Codex）透過 Tooka 的模板系統生成 React 元件</li>
<li>直接輸出 <strong>1080×1350 標準尺寸</strong> 的 PNG，整組風格、字級、間距完全一致</li>
<li>還能一鍵發佈到 Instagram、Facebook、Threads（走 Meta 官方 API）</li>
</ul>
<p>因為尺寸和版型是程式渲染出來的，<strong>從根本上不存在跑版問題</strong>——這就是「模板 + AI 生成」和手動拖拉的差別。實際工作流長這樣：</p>
<p><video src="/videos/tooka-workflow-demo.mp4" controls preload="metadata" playsinline style="width:100%;border-radius:1rem;"></video></p>
<h2 id="想學這套流程">想學這套流程？</h2>
<p>Tooka 是<a href="https://github.com/js0980420/tooka">開源專案</a>，會用 AI Agent 的人可以直接上手；如果你還不熟 AI Agent，我的<a href="/services/ai-tutor/">一對一教學</a>可以從安裝 Claude Code / Codex 開始，帶你做出自己的圖文自動化流程，也歡迎<a href="/services/speaking/">邀請我到你的社群演講</a>這個主題。</p>
