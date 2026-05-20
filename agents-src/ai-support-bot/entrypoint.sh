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
: "${WELCOME_MESSAGE:=Привет! Я бот поддержки на платформе hireon. Опиши задачу — постараюсь помочь.}"
: "${HELP_MESSAGE:=Команды:
⚪ /retry — переотправить последний ответ
⚪ /new — начать новый диалог
⚪ /help — показать эту справку}"

# Экспортим WELCOME_MESSAGE/HELP_MESSAGE чтобы python-heredoc ниже их видел.
# Bash параметр-expansion `: "${X:=default}"` ставит значение в текущем
# shell'е, но не делает export для child-процессов.
export WELCOME_MESSAGE HELP_MESSAGE

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

# Подмена брендированных upstream-строк в bot.py:
#   - HELP_MESSAGE-блок (44-55 строки upstream) → ENV HELP_MESSAGE
#   - "Hi! I'm <b>ChatGPT</b> bot implemented with OpenAI API" → ENV WELCOME_MESSAGE
# Делаем перед каждым стартом контейнера — образ остаётся upstream-clean,
# контент seller'а параметризуем через env.
python3 - <<PYEOF
import os, re
from pathlib import Path

p = Path("/app/bot/bot.py")
src = p.read_text()

help_text = os.environ["HELP_MESSAGE"]
welcome = os.environ["WELCOME_MESSAGE"].replace('"', '\\"')

# Используем callable-replacement: re.sub НЕ интерпретирует backslash-sequences
# в результате callable (в отличие от строкового replacement, где \n → newline).
# Это критично — bot.py хранит "\n\n" как литералы в Python-source.
src = re.sub(
    r'HELP_MESSAGE\s*=\s*""".*?"""',
    lambda m: 'HELP_MESSAGE = """' + help_text + '"""',
    src,
    count=1,
    flags=re.DOTALL,
)

src = re.sub(
    r'reply_text\s*=\s*"Hi! I\'m <b>ChatGPT</b> bot[^"]*"',
    lambda m: 'reply_text = "' + welcome + '\\n\\n"',
    src,
    count=1,
)

p.write_text(src)
PYEOF

exec "$@"
