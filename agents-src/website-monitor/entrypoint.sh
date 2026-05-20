#!/bin/sh
set -eu

: "${WATCH_URLS:?WATCH_URLS is required}"
: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${CHAT_ID:?CHAT_ID is required}"
: "${CHECK_INTERVAL_MINUTES:=360}"
: "${PORT:=5000}"
: "${BASE_URL:=http://localhost:5000}"

if ! printf '%s' "$CHECK_INTERVAL_MINUTES" | grep -Eq '^[0-9]+$'; then
  echo "CHECK_INTERVAL_MINUTES must be an integer"
  exit 1
fi

if [ "$CHECK_INTERVAL_MINUTES" -lt 30 ]; then
  echo "CHECK_INTERVAL_MINUTES must be at least 30"
  exit 1
fi

if ! printf '%s' "$WATCH_URLS" | jq -e '
  type == "array"
  and length > 0
  and length <= 20
  and all(.[]; type == "string" and length > 0)
' >/dev/null 2>&1; then
  echo "WATCH_URLS must be a JSON array of 1 to 20 non-empty strings"
  exit 1
fi

mkdir -p /data

# Запускаем changedetection.io. Сам сгенерит /data/changedetection.json со
# своим api_access_token (~0.55.x). Раньше мы пытались подсунуть свой ключ
# через env API_KEY, но upstream его игнорирует и ругается 403 на seed.
"$@" &
main_pid=$!

cleanup() {
  if kill -0 "$main_pid" 2>/dev/null; then
    kill "$main_pid" 2>/dev/null || true
  fi
}

trap cleanup INT TERM

wait_for_settings() {
  # changedetection.json появляется через 5-15 сек после старта uwsgi.
  i=0
  while [ ! -s /data/changedetection.json ]; do
    if ! kill -0 "$main_pid" 2>/dev/null; then
      wait "$main_pid"
      exit 1
    fi
    sleep 2
    i=$((i + 1))
    if [ "$i" -gt 60 ]; then
      echo "changedetection.json not created within 120s — main process may be hung"
      exit 1
    fi
  done
}

read_api_key() {
  python -c "import json,sys; print(json.load(open('/data/changedetection.json'))['settings']['application']['api_access_token'])"
}

wait_for_api() {
  until curl -fsS \
    -H "x-api-key: $API_KEY" \
    "http://127.0.0.1:5000/api/v1/systeminfo" >/dev/null 2>&1; do
    if ! kill -0 "$main_pid" 2>/dev/null; then
      wait "$main_pid"
      exit 1
    fi
    sleep 2
  done
}

seed_watches() {
  if [ -f /data/.seeded ]; then
    return
  fi

  hours=$((CHECK_INTERVAL_MINUTES / 60))
  minutes=$((CHECK_INTERVAL_MINUTES % 60))

  printf '%s' "$WATCH_URLS" | jq -r '.[]' | while IFS= read -r url; do
    payload="$(jq -n \
      --arg url "$url" \
      --arg token "$TELEGRAM_BOT_TOKEN" \
      --arg chat_id "$CHAT_ID" \
      --argjson hours "$hours" \
      --argjson minutes "$minutes" \
      '{
        url: $url,
        time_between_check: {
          hours: $hours,
          minutes: $minutes
        },
        notification_urls: ["tgram://\($token)/\($chat_id)"]
      }'
    )"

    curl -fsS \
      -X POST \
      -H "Content-Type: application/json" \
      -H "x-api-key: $API_KEY" \
      -d "$payload" \
      "http://127.0.0.1:5000/api/v1/watch" >/dev/null
  done

  touch /data/.seeded
}

wait_for_settings
API_KEY="$(read_api_key)"
export API_KEY
wait_for_api
seed_watches

wait "$main_pid"
