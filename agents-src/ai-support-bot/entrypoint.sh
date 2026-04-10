#!/bin/bash
set -e

# Генерация config/config.yml и config/config.env из env-переменных,
# которые маркетплейс инжектит в контейнер (расшифрованный subscription.config
# + env_template агента). Значения приходят из Setup Wizard.

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"
: "${MONGODB_PORT:=27017}"
: "${ALLOWED_TELEGRAM_USERNAMES:=[]}"
: "${NEW_DIALOG_TIMEOUT:=600}"
: "${ENABLE_MESSAGE_STREAMING:=true}"
: "${N_CHATGPT_IMAGES:=4}"
: "${SYSTEM_PROMPT:=You are a helpful customer support assistant.}"

mkdir -p /app/config

cat > /app/config/config.yml <<EOF
telegram_token: "${TELEGRAM_BOT_TOKEN}"
openai_api_key: "${OPENAI_API_KEY}"
allowed_telegram_usernames: ${ALLOWED_TELEGRAM_USERNAMES}
new_dialog_timeout: ${NEW_DIALOG_TIMEOUT}
return_n_generated_images: ${N_CHATGPT_IMAGES}
enable_message_streaming: ${ENABLE_MESSAGE_STREAMING}
image_size: "512x512"
n_chat_modes_per_page: 5
EOF

# config.env — father-bot читает MONGODB_PORT напрямую из этого файла
# (через dotenv.dotenv_values) и строит mongodb_uri = mongodb://mongo:PORT.
cat > /app/config/config.env <<EOF
MONGODB_PORT=${MONGODB_PORT}
EOF

# chat_modes.yml: оставляем upstream-версию (14 готовых режимов), но
# заменяем prompt_start в дефолтном режиме "assistant" на пользовательский
# SYSTEM_PROMPT через Python (yaml-safe, не ломает остальные режимы).
python3 - <<PYEOF
import yaml
from pathlib import Path

p = Path("/app/config/chat_modes.yml")
data = yaml.safe_load(p.read_text())
if "assistant" in data:
    data["assistant"]["prompt_start"] = """${SYSTEM_PROMPT}"""
p.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False))
PYEOF

# models.yml — оставляем upstream, ничего не трогаем.

exec "$@"
