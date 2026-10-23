# 發文連結加 UTM 追蹤標籤

目的：讓後台「流量統計」的入口分類能分清楚讀者是從哪個貼文、哪個平台點進來。沒加 UTM 時，
LINE、Email、部分 App 點出的連結常被 GA4 記成「直接」（沒有來源資訊），後台只能歸到「其他」。
只需要改貼出去的連結，不用改網站。

## 格式

在網址後面加 `?utm_source=...&utm_medium=...`（網址本來就有 `?` 時改用 `&` 接）。
可選 `&utm_campaign=...` 標示哪一篇貼文、哪一檔活動（自己看得懂就好，建議用英文小寫與連字號）。

| 貼出去的地方 | 範例 | 後台入口分類 |
| --- | --- | --- |
| LINE（群組、官方帳號、好友） | `https://aixwang.dev/blog/xxx/?utm_source=line&utm_medium=social` | LINE |
| Facebook 貼文 | `https://aixwang.dev/blog/xxx/?utm_source=facebook&utm_medium=social` | Facebook |
| Instagram（留言、限動、個人簡介） | `https://aixwang.dev/blog/xxx/?utm_source=ig&utm_medium=comment` | Instagram |
| Threads | `https://aixwang.dev/blog/xxx/?utm_source=threads&utm_medium=social` | Threads |
| Email 電子報 | `https://aixwang.dev/blog/xxx/?utm_source=newsletter&utm_medium=email` | 其他（目前沒有獨立的 Email 類） |

加上活動名稱的例子：`?utm_source=line&utm_medium=social&utm_campaign=2026-10-question-bank`。

## 分類怎麼判斷

分類規則在 `tools/lib/traffic-sources-lib.mjs` 的 `classifySource()`／`classifyVisit()`，加了 UTM 的連結只看 `utm_source`（GA4 的 `sessionSource`）與 `utm_medium`：

- 來源含 `line`（`line`、`line.me`、`liff`、`line.naver`）→ **LINE**（獨立一類，排在依人數排序區）。
  沒加 UTM 的 LINE 點擊會被記成直接，歸「其他」，所以 LINE 的數字只會是有加標籤的連結。
- 來源 `facebook`／`fb` → Facebook；`ig`／含 `instagram` → Instagram；含 `threads` → Threads；含 `youtube`/`yt` → YouTube（獨立一類，沒資料也會列出 0）。
- 來源名稱沒對上任何一類（例如 `newsletter`）→ **其他**。要為 Email 獨立一類請告知，再改分類。
- 大小寫不影響；`utm_source` 請固定用同一種寫法，避免同一個平台被拆成多個來源列。

## 注意

- 加了 UTM 的連結被貼到別處轉傳時，標籤會跟著連結走；標籤是「你貼出去的地方」，不是讀者實際來的地方。
- 同步每 3 小時一次，GA4 當日資料處理也要數小時，加上標籤後約半天內才會在後台看到。
- 加標籤前的歷史造訪不會被改分類。
- 站內連結、網站自己的按鈕不要加 UTM，否則會把站內換頁算成外部來源。
