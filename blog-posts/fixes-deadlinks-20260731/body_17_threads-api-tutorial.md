Threads API 的申請流程是——用你的 Facebook 帳號登入 Meta 開發者後台 → 建立應用程式 → 選 Threads 用例 → 把自己加成測試人員 → 生成 Access Token。拿到 Token 之後，就能用官方 API 自動發文。下面有完整教學影片＋每一步的實際畫面截圖。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/nTYrG7EuFHA" title="Threads API 申請教學" loading="lazy" allowfullscreen></iframe></div>

這支教學最初發布在 Threads——下面的 FAQ 有一部分就是從留言區的真實提問整理出來的。

<blockquote class="text-post-media" data-no-copy data-text-post-permalink="https://www.threads.com/@alex_wang.ai/post/DXnWnLSEuMH" data-text-post-version="0" id="ig-tp-DXnWnLSEuMH" style="background:#FFF; border-width:1px; border-style:solid; border-color:#00000026; border-radius:16px; max-width:650px; margin:1px auto; min-width:270px; padding:0; width:calc(100% - 2px);">
<a href="https://www.threads.com/@alex_wang.ai/post/DXnWnLSEuMH" style="background:#FFFFFF; line-height:0; padding:0; text-align:center; text-decoration:none; width:100%; font-family:-apple-system,BlinkMacSystemFont,sans-serif;" target="_blank">
<div style="padding:40px; display:flex; flex-direction:column; align-items:center;"><div style="display:block; height:32px; width:32px; padding-bottom:20px;"><svg aria-label="Threads" height="32px" role="img" viewBox="0 0 192 192" width="32px" xmlns="http://www.w3.org/2000/svg"><path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/></svg></div>
<div style="font-size:15px; line-height:21px; color:#000000; font-weight:600;">在 Threads 查看</div></div></a></blockquote>
<script async src="https://www.threads.com/embed.js"></script>

<p class="social-quote-note">上方卡片的讚數、留言、轉發、分享由 Threads 即時提供；另外這則貼文的瀏覽數在 2026-07-30 擷取時為 7,696 次（瀏覽數不在官方卡片顯示範圍內）。</p>

## 申請前的準備

1. **一個可用的 Facebook 帳號**——Meta 開發者後台要用它登入
2. **你要自動化的 Threads 帳號**——要跟這個 FB 帳號完成綁定

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

> 這裡生的短期 Token 1 小時就過期。請 Claude Code 用 API 換成長期 Token（60 天），換完加進 `.env` 環境變數。

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

- 自動發文與排程：AI 寫好內容定時發佈，注意上面的防鎖規則
- 搭配 AI Agent：用中文對話就能操作，不用自己寫程式
- 搭配 [Tooka](/blog/why-i-built-tooka/)：連 1080×1350 的輪播圖文都自動生成、一鍵發佈

照著做卡關了，歡迎加 [LINE 免費諮詢](https://line.me/ti/p/jejH4FkQn-)，或直接約[一對一教學](/services/one-on-one/)手把手帶你跑通。