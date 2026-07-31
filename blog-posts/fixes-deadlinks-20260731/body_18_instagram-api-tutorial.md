Instagram API 的申請共 5 個步驟：建立 Meta App → 加入 IG 測試人員 → 取得 User ID 和 Token → 開啟必要權限 → 用 Agent 自動完成環境配置與發佈腳本。 而且 IG 還能透過企業管理後台取得永久權限的 Token（Threads 做不到），做一次就一勞永逸。完整操作有影片＋截圖＋可直接貼給 AI 的指令。

<div style="aspect-ratio:16/9;"><iframe style="width:100%;height:100%;border-radius:1rem;" src="https://www.youtube-nocookie.com/embed/O1qfeDIZRkQ" title="Instagram API 申請教學" loading="lazy" allowfullscreen></iframe></div>

這支教學最初發布在 Threads——下面的 FAQ 有一部分就是從留言區的真實提問整理出來的。

<blockquote class="text-post-media" data-no-copy data-text-post-permalink="https://www.threads.com/@alex_wang.ai/post/DYpIU-RD3kr" data-text-post-version="0" id="ig-tp-DYpIU-RD3kr" style="background:#FFF; border-width:1px; border-style:solid; border-color:#00000026; border-radius:16px; max-width:650px; margin:1px auto; min-width:270px; padding:0; width:calc(100% - 2px);">
<a href="https://www.threads.com/@alex_wang.ai/post/DYpIU-RD3kr" style="background:#FFFFFF; line-height:0; padding:0; text-align:center; text-decoration:none; width:100%; font-family:-apple-system,BlinkMacSystemFont,sans-serif;" target="_blank">
<div style="padding:40px; display:flex; flex-direction:column; align-items:center;"><div style="display:block; height:32px; width:32px; padding-bottom:20px;"><svg aria-label="Threads" height="32px" role="img" viewBox="0 0 192 192" width="32px" xmlns="http://www.w3.org/2000/svg"><path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"/></svg></div>
<div style="font-size:15px; line-height:21px; color:#000000; font-weight:600;">在 Threads 查看</div></div></a></blockquote>
<script async src="https://www.threads.com/embed.js"></script>

<p class="social-quote-note">上方卡片的讚數、留言、轉發、分享由 Threads 即時提供；另外這則貼文的瀏覽數在 2026-07-30 擷取時為 18,200 次（瀏覽數不在官方卡片顯示範圍內）。</p>

## 開始前先準備好

1. **FB 帳號**：登入 Meta 開發者後台用
2. **IG 帳號**：需要先切換成專業帳號（設定裡免費切換）

## Step 1：建立 Meta 應用程式

來到 [Meta 開發者後台](https://developers.facebook.com/)，點右上角綠色的「建立應用程式」。

![Meta 開發者後台的應用程式列表](https://cms.aixwang.dev/assets/b192387e-a18f-41fc-a7e5-bbe2e7740490)

填入「應用程式名稱」和「電子郵件地址」，點右下角「繼續」——名稱隨便取（發文時不會顯示），Email 要確實填寫。

![填寫應用程式名稱與電子郵件](https://cms.aixwang.dev/assets/4a24e04c-7f15-4530-99c9-69ff1118e5a1)

使用案例：左側點「**內容管理**」，右側勾選「管理 Instagram 的訊息和內容」，按繼續。

![使用案例選擇內容管理並勾選管理 Instagram](https://cms.aixwang.dev/assets/063e870a-317d-419d-8833-def22f2f55cc)

商家連結頁：勾選「我還不想連結商家資產管理組合」，按繼續。

![商家連結頁選擇暫不連結](https://cms.aixwang.dev/assets/78cce17f-564b-402f-a33b-caff29cec9c4)

要求頁直接點「下一步」，不用做任何事。

![要求頁直接下一步](https://cms.aixwang.dev/assets/7950b103-5022-40a0-8ac4-4c3919d378fb)

總覽確認沒問題，點右下角綠色「前往主控板」。

![總覽頁確認後前往主控板](https://cms.aixwang.dev/assets/b649ed3a-b2dc-40aa-8cb8-25ef648df5f4)

跳出 FB 密碼確認，輸入後點「提交」，應用程式就建立好了！

![輸入 FB 密碼確認建立](https://cms.aixwang.dev/assets/719fef6f-9170-49d4-a708-242abf9c4224)

## Step 2：加入 IG 測試人員

側邊欄點「角色」，右上角點「新增角色」。

![應用程式角色頁點新增角色](https://cms.aixwang.dev/assets/daba1587-e04a-402e-bfa7-e5658fc972af)

切換到 Instagram 測試人員，點「新增 Instagram 測試人員」輸入你的 IG 帳號。

![新增 Instagram 測試人員並輸入帳號](https://cms.aixwang.dev/assets/7c0742d5-59d3-4720-96a1-971572e59a3b)

邀請送出後，IG 帳號會顯示「待確認」狀態。

![邀請送出後顯示待確認狀態](https://cms.aixwang.dev/assets/c52f9fda-24d0-456c-bf97-928a259eec5e)

登入 IG 帳號接受邀請：點網站權限連結會跳轉到 IG 後台，從「**網站權限 > 應用程式和網站 > 測試員邀請**」按接受——很多人卡在這裡，以為送出邀請就好。

![IG 後台測試員邀請按接受](https://cms.aixwang.dev/assets/1c7b63a0-8844-41bd-8c86-54b9f78af7c5)

回到開發者後台，「待確認」消除，IG 帳號與 App 綁定成功。

![待確認消除代表綁定成功](https://cms.aixwang.dev/assets/ca9d6bc9-fe54-48aa-82c9-c956beaec023)

## Step 3：取得 User ID 和 Token

先開使用案例選單，進到主選項找到 IG 自訂案例。

![使用案例選單找到 IG 自訂案例](https://cms.aixwang.dev/assets/724515bf-b7d7-4248-ab15-6883054d02d1)

進到 IG 自訂案例後，先把頭像旁那串 User ID 複製起來，再點「產生權杖」。

![複製 User ID 後點產生權杖](https://cms.aixwang.dev/assets/2adef1ce-87d1-4994-907a-7d1858664600)

跳出 IG 登入畫面，輸入帳號密碼完成登入。

![IG 登入畫面](https://cms.aixwang.dev/assets/4a5be196-b9d1-4f71-aaa4-7d17c824dc83)

五個授權選項**都要允許**，後面的 token 才能正常使用。

![五個授權選項全部允許](https://cms.aixwang.dev/assets/4ba5ac52-fd77-4ac3-a56a-421ca4120f66)

Access Token 產生完成，複製後先存好（只會顯示這一次）。

![Access Token 產生完成複製保存](https://cms.aixwang.dev/assets/15b6c092-463f-4200-b64f-c503f7a400d4)

## Step 4：開啟必要權限（圖形 API 測試工具）

先開啟「圖形 API 測試工具」（上方工具選單裡）。

![工具選單開啟圖形 API 測試工具](https://cms.aixwang.dev/assets/284b1831-5724-47d3-b6f5-ea61bbb0ab1c)

先選 **Facebook** 這條授權流程（不是 Instagram——很多人卡在這）。

![授權流程選 Facebook](https://cms.aixwang.dev/assets/fd0475a8-352e-4f14-8000-b8a532dd1e5c)

選擇你剛剛建立好的 Meta App。

![選擇剛建立的 Meta App](https://cms.aixwang.dev/assets/fb48f987-dbc5-408e-b17b-8c4eee22a602)

點「新增權限」，進入權限勾選。

![點新增權限](https://cms.aixwang.dev/assets/c9e52cda-e254-4123-b48c-c41c0717caeb)

12 項權限非強制全勾——全勾較方便，也可以只勾你要開通的權限。

![12 項權限勾選](https://cms.aixwang.dev/assets/820d25d6-3a0f-4eb1-9618-c497a5410e2a)

點選「產生暫時權杖」，會跳出 FB 登入視窗，按繼續。

![產生暫時權杖](https://cms.aixwang.dev/assets/d06af393-757d-42dc-b8d0-fb998eb01709)

選擇要綁定授權的 Instagram 帳號。

![選擇要綁定的 Instagram 帳號](https://cms.aixwang.dev/assets/fd3704be-68cf-4da5-ace0-0f687f66488a)

看到提醒不用緊張——不影響申請 API，直接點繼續。

![提醒視窗直接繼續](https://cms.aixwang.dev/assets/75914653-afa6-4b8d-9048-70087cb8b086)

最後把要求的使用權限全部允許，完成圖形 API 測試工具的授權流程。

![使用權限全部允許完成授權](https://cms.aixwang.dev/assets/5dfbdfac-a913-4b73-b5d6-b6e21944efba)

## Step 5：填進 Tooka，開始做圖文跟自動發布

最後一步不用寫任何程式：打開我開源的發文工具連結頁——

👉 **[tooka.js0980420.workers.dev/connects?tab=publish](https://tooka.js0980420.workers.dev/connects?tab=publish)**

把剛剛拿到的 User ID 和 Access Token 直接貼上，你就能用這工具做圖文跟自動發布了——`.env` 會自動幫你建好，Token 的自動延期也內建。

## 進階：企業管理後台取得永久 Token

不想跑 60 天續期的話，IG（和 FB）還有一條 Threads 沒有的路：透過企業管理後台把帳號連結為資產，取得永久權限的 Token。

1. 打開企業管理後台的 Instagram 帳號設定：[business.facebook.com/latest/settings/instagram_account](https://business.facebook.com/latest/settings/instagram_account)
2. 點「連結資產」，把你的 IG 專業帳號連進商業資產組合
3. 連結完成後，由系統使用者產生永久權限的 Token，填進 `.env` 一勞永逸

## 自動發文的圖片要先放到公開網址

IG API 設計上要求 Meta 用 `image_url` 抓圖——也就是說，要自動發文的話，貼文的圖片必須先放在一個公開可存取的網址上。怎麼做？

1. 到 [api.imgbb.com](https://api.imgbb.com/) 免費申請一組 API Key
2. 填進我的發文工具 [Tooka](https://github.com/js0980420/tooka) 的連結頁就可以——匯出的圖會自動上傳 Imgbb 取得公開網址再發佈

細節可以[私訊我](https://line.me/ti/p/jejH4FkQn-)詢問。

## 三大平台 Token 差別速記

| | Instagram / Facebook | Threads |
| --- | --- | --- |
| Token | 企業管理後台連結資產 → **永久權限** | 長期 Token 60 天需延期（[自動延期做法](/blog/threads-api-tutorial/)） |

## 拿到 API 之後

- 自動發文與權限設定：頻率像真人、權限只拿需要的
- 搭配 [Tooka](/blog/why-i-built-tooka/)：1080×1350 輪播圖文自動生成、一鍵發佈 IG

照著做卡關了，加 [LINE 免費諮詢](https://line.me/ti/p/jejH4FkQn-)，或約[一對一教學](/services/one-on-one/)一次跑通。