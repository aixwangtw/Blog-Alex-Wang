#!/usr/bin/env bash
# 每小時檢查一次、每天實際同步一次 GA4 文章觀看數到 Directus。
# WSL 若在固定時刻未啟動，會在當天第一次啟動後補跑，不影響網站前台載入。
#
# 手動測試：bash tools/daily-ga4-views-cron.sh --force
# 查看紀錄：cat ~/.cache/aixwang-ga4-views/cron.log

set -uo pipefail

PROJECT=/home/js0980420/projects/Blog-Alex-Wang
NODE=/home/js0980420/.nvm/versions/node/v24.11.0/bin/node
STATE_DIR="$HOME/.cache/aixwang-ga4-views"
RUN_STAMP="$STATE_DIR/last-success"
SKIP_STAMP="$STATE_DIR/last-skip-log"
LOCK_FILE="$STATE_DIR/sync.lock"
LOG="$STATE_DIR/cron.log"
TODAY=$(date +%F)

FORCE=0
[ "${1:-}" = "--force" ] && FORCE=1

mkdir -p "$STATE_DIR"
log() { printf '%s  %s\n' "$(date '+%F %T')" "$1" >> "$LOG"; }

# 避免手動執行與 cron 同時更新同一批文章。
exec 9>"$LOCK_FILE"
flock -n 9 || exit 0

if [ "$FORCE" -eq 0 ] && [ -f "$RUN_STAMP" ] && [ "$(cat "$RUN_STAMP")" = "$TODAY" ]; then
  exit 0
fi

if [ -f "$PROJECT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$PROJECT/.env"
  set +a
fi

missing=()
[ -z "${DIRECTUS_TOKEN:-}" ] && missing+=(DIRECTUS_TOKEN)
[ -z "${GA4_PROPERTY_ID:-}" ] && missing+=(GA4_PROPERTY_ID)
[ -z "${GOOGLE_APPLICATION_CREDENTIALS:-}" ] && missing+=(GOOGLE_APPLICATION_CREDENTIALS)

if [ "${#missing[@]}" -gt 0 ] || [ ! -f "${GOOGLE_APPLICATION_CREDENTIALS:-/missing}" ]; then
  if [ ! -f "$SKIP_STAMP" ] || [ "$(cat "$SKIP_STAMP")" != "$TODAY" ]; then
    echo "$TODAY" > "$SKIP_STAMP"
    log "跳過：GA4 同步設定或憑證不完整（${missing[*]:-credential file}）"
  fi
  exit 0
fi

cd "$PROJECT" || { log "失敗：進不了 $PROJECT"; exit 1; }

output=$("$NODE" tools/sync-ga4-views.mjs --apply 2>&1)
status=$?

if [ "$status" -eq 0 ]; then
  echo "$TODAY" > "$RUN_STAMP"
  log "成功：$(printf '%s' "$output" | tail -n 1)"
else
  log "失敗（exit $status）：$(printf '%s' "$output" | tail -n 3 | tr '\n' ' | ')"
fi

exit "$status"
