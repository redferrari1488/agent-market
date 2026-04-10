#!/bin/bash
set -e

# Генерация config/config.yml и config/config.env из env-переменных,
# которые маркетплейс инжектит в контейнер (расшифрованный subscription.config
# + env_template агента). Значения приходят из Setup Wizard.

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"
: "${MONGODB_URI:=mongodb://mongo:27017}"
: "${ALLOWED_TELEGRAM_USERNAMES:=[]}"
: "${NEW_DIALOG_TIMEOUT:=600}"
: "${ENABLE_MESSAGE_STREAMING:=true}"
: "${N_CHATGPT_IMAGES:=4}"
: "${SYSTEM_PROMPT:=You are a helpful customer support assistant.}"

mkdir -p /app/config

cat > /app/config/config.yml <<EOF
telegram_token: "${TELEGRAM_BOT_TOKEN}"
openai_api_key: "${OPENAI_API_KEY}"
use_chatgpt_api: true
allowed_telegram_usernames: ${ALLOWED_TELEGRAM_USERNAMES}
new_dialog_timeout: ${NEW_DIALOG_TIMEOUT}
return_n_generated_images: ${N_CHATGPT_IMAGES}
enable_message_streaming: ${ENABLE_MESSAGE_STREAMING}
mongodb_uri: "${MONGODB_URI}"
EOF

# chat_modes: кастомный режим «support» с пользовательским system prompt.
cat > /app/config/chat_modes.yml <<EOF
support:
  name: "🎧 Support"
  model_type: "text"
  welcome_message: "👋 Здравствуйте! Я — бот поддержки. Задавайте ваш вопрос."
  prompt_start: |
    ${SYSTEM_PROMPT}
  parse_mode: "html"
EOF

cat > /app/config/models.yml <<EOF
available_text_models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"]
info:
  gpt-4o-mini:
    type: "chat_completion"
    name: "GPT-4o mini"
    description: "Fast and cheap."
    price_per_1000_input_tokens: 0.00015
    price_per_1000_output_tokens: 0.0006
    scores:
      smart: 4
      fast: 5
      cheap: 5
EOF

exec "$@"
