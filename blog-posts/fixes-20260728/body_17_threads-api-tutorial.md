Threads API 的申請流程是——用你的 Facebook 帳號登入 Meta 開發者後台 → 建立應用程式 → 選 Threads 用例 → 把自己加成測試人員 → 生成 Access Token。拿到 Token 之後，就能用官方 API 自動發文。下面有完整教學影片＋每一步的實際畫面截圖。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/nTYrG7EuFHA" title="Threads API 申請教學" loading="lazy" allowfullscreen></iframe></div>

這支教學的 [Threads 貼文](https://www.threads.com/@alex_wang.ai/post/DXnWnLSEuMH)累積了 7,500+ 觀看、121 次分享——下面的 FAQ 有一部分就是從留言區的真實提問整理出來的。

## 申請前的準備

1. **一個可用的 Facebook 帳號**——Meta 開發者後台要用它登入（[帳號注意事項看這篇](/blog/what-to-prepare-before-learning-ai/)）
2. **你要自動化的 Threads 帳號**——要跟這個 FB 帳號完成綁定（[綁定邏輯看這篇](/blog/meta-api-application/)）

## 先講重要的：不被鎖的 4 條規則（我踩過坑的）

Threads API 是 Meta 官方推出的，不是第三方爬蟲工具——功能合法，但要照規則用：

1. 發文上限是 250 則 / 24 小時（rolling window），超過會被限流
2. 連續發完全相同的內容會觸發 Meta 的 spam 偵測，Threads 直接被鎖 24 小時，期間不能自動發文、自動回覆
3. 回覆也一樣：官方上限雖然寫 1000 / 24h，我實測一則 thread 同時回 10 個人就被鎖了 24 小時，別 burst 連發
4. 長期 Token 效期 60 天，到期的解法在文末

## Step 1：建立 Meta App

打開 `developers.facebook.com`，點「建立應用程式」，填 App 名稱。

![在 Meta 開發者後台點建立應用程式](https://cms.aixwang.dev/assets/b74da1b9-7b2a-4bf1-b23a-6679bf56c6fc)

![填寫應用程式名稱](https://cms.aixwang.dev/assets/01bef9d1-fb45-4b4b-a8d9-9179ef359bcf)

下一頁選用例——**選跟 Threads 相關的存取類別**，然後確認。

![選擇 Threads 相關的用例](https://cms.aixwang.dev/assets/c6a3c366-037a-422a-91e9-22f99915ca51)

![確認應用程式資訊](https://cms.aixwang.dev/assets/2926fd22-9219-4082-bb29-b5dc8c2eef9b)

> 送出前再三確認：用例選錯不能改，只能整支 App 重建。

## Step 2：設定使用案例＋應用程式角色

進 App 主控台，左欄找到「應用程式角色」，點進去切到「角色」分頁。

![進入使用案例設定](https://cms.aixwang.dev/assets/7c64a566-85b9-4638-9972-e7957abda493)

![進入應用程式角色的角色分頁](https://cms.aixwang.dev/assets/a34b9c35-39f4-4bca-b595-0cf2d0fe86a8)

> 💡 「應用程式角色」分頁是新手最常找不到的入口——記住這個位置，後面所有測試人員設定都從這裡進。

## Step 3：加自己當測試人員

點「新增測試人員」，填自己 Meta 帳號的使用者名稱，送出。

![新增測試人員彈窗](https://cms.aixwang.dev/assets/6c9e6599-8355-43bb-827c-6e3452138e5c)

![邀請送出後的待確認狀態](https://cms.aixwang.dev/assets/750e4e88-da17-4276-a230-f1df68610320)

然後去 Threads App 的設定（或信箱）**接受邀請**：

![Threads App 的網站權限設定](https://cms.aixwang.dev/assets/04f8ea5e-fb91-476f-b6a1-188c1fd73b14)

![接受測試人員邀請](https://cms.aixwang.dev/assets/7726eb2b-f685-4f85-a329-6b47e0151dd4)

![邀請接受後的狀態](https://cms.aixwang.dev/assets/7e742cb1-da28-4de1-a0fa-902fde8436cd)

> 這步別跳過，沒接受邀請就去拿 Token 只會得到 401。

## Step 4：生成 Access Token

進測試工具（Token Generator），點生成 Access Token。

![開啟 Threads 測試工具](https://cms.aixwang.dev/assets/14c331db-b05a-4813-a8db-8d42097483ee)

![生成 Access Token](https://cms.aixwang.dev/assets/e29253ee-53a8-470c-a4b5-0732a8ecbaee)

> 這裡生的短期 Token 1 小時就過期。請 Claude Code 用 API 換成長期 Token（60 天），換完加進 `.env` 環境變數。[用 AI Agent 做這步不用自己寫程式](/blog/what-is-ai-agent/)。

## Step 5：OAuth 同意

OAuth 同意頁要勾兩個 scope：`threads_basic` + `threads_content_publish`，確認授權。

![OAuth 同意頁勾選兩個 scope](https://cms.aixwang.dev/assets/9ff04e3f-bf21-48a3-a90e-5b1f9451e6dd)

> 兩個都要勾，scope 缺一個，發文時拿到的就是 403。

## Step 6：測試 API

先拿 Token 打 `/me` 端點確認身分：

![用 /me 端點測試 Token 身分](https://cms.aixwang.dev/assets/3609b0c9-f744-46ac-ad88-0806e16aef16)

再試發一則貼文——Threads 發文是三段式：建立容器 → 輪詢狀態 → 發布。

![測試發文 API](https://cms.aixwang.dev/assets/cdef60f2-f297-42af-a927-ac1254d25dc1)

最後用 Token Debugger 確認 Token 剩餘有效時間：

![Token 偵錯工具查看效期](https://cms.aixwang.dev/assets/00e1dcbc-baba-472d-9163-40b927f87928)

## Token 60 天過期怎麼辦？

長期權杖效期 60 天。你可以在到期前手動重新換發，但更省事的做法：我開源的 [Tooka](/blog/free-resources/) 內建 API 串接面板，Token 填進去會**自動延期**——第一次手動申請後就不用再管過期問題。

## 拿到 API 之後可以做什麼？

- [自動發文與排程](/blog/auto-posting-permissions/)：AI 寫好內容定時發佈，注意上面的防鎖規則
- 搭配 [AI Agent](/blog/what-is-ai-agent/)：用中文對話就能操作，[不用自己寫程式](/blog/no-tech-background/)
- 搭配 [Tooka](/blog/why-i-built-tooka/)：連 1080×1350 的輪播圖文都自動生成、一鍵發佈

照著做卡關了，歡迎加 [LINE 免費諮詢](https://line.me/ti/p/jejH4FkQn-)，或直接約[一對一教學](/services/one-on-one/)手把手帶你跑通。