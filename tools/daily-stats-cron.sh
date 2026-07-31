#!/usr/bin/env bash
#
# 每天把內容統計寫進 Directus 的 content_stats / content_stats_history，供後台 Insights 報表讀取。
#
# 為什麼是「每小時觸發、當天只實際跑一次」而不是每天固定時間跑一次：
# 這台是 WSL2，cron 只在 WSL 起來的時候才會跑。固定時間排程的話，那個時間點沒開 IDE
# 就整天跳過、而且不會補跑。改成每小時觸發、用戳記檔擋掉當天第二次以後的執行，
# 效果就是「當天第一次開 IDE 時補跑一次」，之後整天不再重複。
#
# token 從專案根目錄的 .env 讀（.gitignore 已排除 .env*）。沒有 token 就安靜跳過，
# 不會失敗、不會每小時洗 log——這樣可以先把排程掛上去，token 之後補進 .env 就自動生效。
#
# 手動測試：bash tools/daily-stats-cron.sh --force   （忽略當天戳記，強制跑一次）
# 看紀錄：  cat ~/.cache/aixwang-blog-stats/cron.log

set -uo pipefail

PROJECT=/home/js0980420/projects/Blog-Alex-Wang
# nvm 裝的 node，cron 的 PATH 吃不到，一定要寫絕對路徑
NODE=/home/js0980420/.nvm/versions/node/v24.11.0/bin/node

STATE_DIR="$HOME/.cache/aixwang-blog-stats"
RUN_STAMP="$STATE_DIR/last-success"   # 最後一次成功寫入的日期
SKIP_STAMP="$STATE_DIR/last-skip-log" # 最後一次記錄「跳過」的日期，用來避免每小時洗 log
LOG="$STATE_DIR/cron.log"
TODAY=$(date +%F)

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p "$STATE_DIR"

log() { printf '%s  %s\n' "$(date '+%F %T')" "$1" >> "$LOG"; }

# 今天已經成功跑過就直接結束，完全不寫 log
if [ "$FORCE" -eq 0 ] && [ -f "$RUN_STAMP" ] && [ "$(cat "$RUN_STAMP")" = "$TODAY" ]; then
  exit 0
fi

if [ -f "$PROJECT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$PROJECT/.env"
  set +a
fi

if [ -z "${DIRECTUS_TOKEN:-}" ]; then
  # 每天只記一次，不然每小時一行
  if [ ! -f "$SKIP_STAMP" ] || [ "$(cat "$SKIP_STAMP")" != "$TODAY" ]; then
    echo "$TODAY" > "$SKIP_STAMP"
    log "跳過：$PROJECT/.env 裡沒有 DIRECTUS_TOKEN"
  fi
  exit 0
fi

cd "$PROJECT" || { log "失敗：進不了 $PROJECT"; exit 1; }

output=$("$NODE" tools/write-content-stats.mjs --apply 2>&1)
status=$?

if [ "$status" -eq 0 ]; then
  echo "$TODAY" > "$RUN_STAMP"
  log "成功：$(printf '%s' "$output" | tail -n 1)"
else
  # 失敗不寫成功戳記，下個整點會自動重試
  log "失敗（exit $status）：$(printf '%s' "$output" | tail -n 3 | tr '\n' ' | ')"
fi

exit "$status"
