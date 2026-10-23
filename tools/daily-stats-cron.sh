#!/usr/bin/env bash
#
# 每天把內容統計寫進 Directus 的 content_stats / content_stats_history，供後台 Insights 報表讀取。
#
# 現在跑在 Hetzner 主機（~/blog-ga4-sync，與 GA4 同步共用同一個 repo 與 .env），每天一次：
#   23 2 * * * <repo>/tools/daily-stats-cron.sh
# 本機 WSL 的排程已拿掉；這支腳本在本機仍可手動備援：bash tools/daily-stats-cron.sh --force
#
# 為什麼用戳記檔：排程可以寫成每小時觸發、當天只實際跑一次——主機重開或某次失敗時，下個整點會自動補跑；
# 失敗不寫成功戳記。本機（WSL 只在開機時才會跑 cron）尤其需要這個行為。
#
# token 從專案根目錄的 .env 讀（.gitignore 已排除 .env*）。沒有 token 就安靜跳過，
# 不會失敗、不會每小時洗 log——可以先掛排程，token 之後補進 .env 就自動生效。
#
# 專案路徑取這支腳本所在 repo，node 優先用 PATH 上的，找不到再載入 nvm（cron 的 PATH 很短）。
#
# 手動測試：bash tools/daily-stats-cron.sh --force   （忽略當天戳記，強制跑一次）
# 看紀錄：  cat ~/.cache/aixwang-blog-stats/cron.log

set -uo pipefail

PROJECT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
if ! command -v node >/dev/null 2>&1; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
fi
NODE=$(command -v node || true)

STATE_DIR="$HOME/.cache/aixwang-blog-stats"
RUN_STAMP="$STATE_DIR/last-success"   # 最後一次成功寫入的日期
SKIP_STAMP="$STATE_DIR/last-skip-log" # 最後一次記錄「跳過」的日期，用來避免每小時洗 log
LOG="$STATE_DIR/cron.log"
TODAY=$(date +%F)

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p "$STATE_DIR"
exec 9>"$STATE_DIR/stats.lock"
flock -n 9 || exit 0

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
[ -n "$NODE" ] || { log "失敗：找不到 node"; exit 1; }

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
