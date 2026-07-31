**這一頁整理我所有的免費資源——教學影片跟開源工具，全部不用付費就能用。** 建議的用法：先照影片自學，把流程跑一次；卡關了再來[找我一對一](/services/one-on-one/)，把時間花在刀口上。

## 教學影片

### Threads API 申請教學

自動發文、留言回覆與 token 申請的完整流程，我的教學代表作。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/nTYrG7EuFHA" title="Threads API 申請教學" loading="lazy" allowfullscreen></iframe></div>

搭配文章：[Meta 三大 API 申請教學](/blog/threads-api-tutorial/)

### Instagram API 申請教學

從 Meta 開發者後台設定，一路做到自動發文的第一步。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/O1qfeDIZRkQ" title="Instagram API 申請教學" loading="lazy" allowfullscreen></iframe></div>

更多影片在我的 [YouTube 頻道](https://www.youtube.com/channel/UCQUY_h3ic_oPmuoRJrLvE3g)。

## 開源工具 Tooka：社群圖卡模板＋一鍵發布 Meta 三大平台

這是我用 Fable 5 參考 Open-Slide 簡報工具改寫的工具（Fable 5 真的很適合拿來做大規模重構——吃得下超長上下文，1～2 次就改好）。

會做它，是因為我自己 AI 生圖很常需要微調：經常跑版、[超出 IG 尺寸](/blog/ig-carousel-size/)、人物失真，叫 AI 重新生隨機性太高、而且等很久；用 GPT 連結 Canva 改完還要自己貼回 GPT，不夠省事。我很討厭這種繁瑣的步驟，所以把整個流程都自動化了：

1. **AI 生完圖可以直接拖曳、修改文字**——不用等重新生成，用初階模型也可以
2. **[Meta 三大 API](/blog/threads-api-tutorial/) 都做好串接面板**——只要申請好 API 填進去，就會自動幫你建好 `.env`；填進去的長期權杖（60 天）還會**自動延期**，第一次手動申請後就不用怕過期
3. **每次的圖都可以固定版型**——都是 React 元件，做好一次視覺，之後改內容不改背景

實際工作流示範：

<video src="/videos/tooka-workflow-demo.mp4" controls preload="metadata" playsinline style="width:100%;border-radius:1rem;"></video>

- 線上直接使用：[開啟 Tooka 線上版](https://tooka.js0980420.workers.dev/)（免安裝、免 clone repo）
- GitHub：[js0980420/tooka](https://github.com/js0980420/tooka)（完整原始碼，開源免費）
- 開發故事：[我為什麼開發 Tooka](/blog/why-i-built-tooka/)

## 有問題想問？

- [LINE 免費諮詢](https://line.me/ti/p/jejH4FkQn-)
- [Facebook 社團](https://www.facebook.com/groups/3238547836318385)
- 想有人帶著走：[一對一教學](/services/one-on-one/)（雙北實體／線上）