#!/bin/bash
set -e

# Генерация config/config.yml и config/config.env из env-переменных,
# которые маркетплейс инжектит в контейнер (расшифрованный subscription.config
# + env_template агента). Значения приходят из Setup Wizard.

: "${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN is required}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"
: "${MONGODB_PORT:=27017}"
: "${ALLOWED_TELEGRAM_USERNAMES:=[]}"
: "${NEW_DIALOG_TIMEOUT:=3600}"
# Месячный лимит ответов бота. На 2990₽/мес ≈ $30 один ответ ~$0.005,
# break-even ~5000 ответов. Ставим 1000 (что обещано в описании агента)
# с запасом маржи. 0 = без лимита.
: "${MONTHLY_MSG_LIMIT:=1000}"
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

# chat_modes.yml: сносим все upstream-режимы (Artist, Code Assistant,
# English Tutor, и т.д.) и оставляем один — Hireon Support с нашим
# SYSTEM_PROMPT в роли prompt_start. welcome_message переиспользует
# WELCOME_MESSAGE (тот же текст что на /start) — чтобы после /new
# не вылезал английский "Hi, I'm General Assistant".
# SYSTEM_PROMPT передаётся в python через env — экспортим.
export SYSTEM_PROMPT
python3 - <<'PYEOF'
import os, yaml
from pathlib import Path

p = Path("/app/config/chat_modes.yml")
data = {
    "assistant": {
        "name": "Hireon Support",
        "model_type": "text",
        "welcome_message": os.environ["WELCOME_MESSAGE"],
        "prompt_start": (
            os.environ["SYSTEM_PROMPT"]
            + "\n\n"
            + "Форматирование: при необходимости используй Telegram Markdown — "
            + "*жирный*, _курсив_, `моноширинный`. "
            + "Не используй ## заголовки и **двойные звёздочки** — они не парсятся."
        ),
        "parse_mode": "markdown",
    }
}
p.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False))
PYEOF

# models.yml — оставляем upstream, ничего не трогаем.

# Подмена брендированных upstream-строк в bot.py:
#   - HELP_MESSAGE-блок (44-55 строки upstream) → ENV HELP_MESSAGE
#   - "Hi! I'm <b>ChatGPT</b> bot implemented with OpenAI API" → ENV WELCOME_MESSAGE
# Делаем перед каждым стартом контейнера — образ остаётся upstream-clean,
# контент seller'а параметризуем через env.
python3 - <<'PYEOF'
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

# Upstream после welcome зовёт show_chat_modes_handle, который рисует
# 15 кнопок «General Assistant / Code Assistant / Artist / ...». Для
# одно-целевого support-бота это вреден шум — пользователь должен сразу
# писать запрос, а не выбирать персону. Комментим этот вызов.
src = re.sub(
    r'^(\s*)await show_chat_modes_handle\(update, context\)\s*$',
    lambda m: m.group(1) + 'pass  # chat-modes picker отключён ',
    src,
    count=1,
    flags=re.MULTILINE,
)

# Месячный лимит ответов — счётчик в mongo на текущий месяц UTC,
# инкрементируется ATOMICALLY на каждое сообщение. Когда счётчик
# превысил MONTHLY_MSG_LIMIT — отвечаем «лимит исчерпан» и НЕ дёргаем
# OpenRouter. Защита от спам-абуза (5000+ ответов в месяц = убыток
# на одной подписке). Реальный СМБ-расход 30-100/день, лимит 1000.
# Инжектим check сразу после `is_previous_message_not_answered_yet`
# — это точка где бот уже committed обработать сообщение.
src = re.sub(
    r'(async def message_handle\(update: Update, context: CallbackContext.*?\n    if await is_previous_message_not_answered_yet\(update, context\): return\n)',
    lambda m: m.group(1) + (
        '\n'
        '    # ── Hireon: месячный anti-spam лимит ──\n'
        '    # Fail-open: если mongo недоступна или счётчик упал — пропускаем\n'
        '    # клиента (не блокируем из-за нашей инфры). Логируем для алёрта.\n'
        '    import os as _os_env\n'
        '    _msg_limit = int(_os_env.environ.get("MONTHLY_MSG_LIMIT", "1000"))\n'
        '    if _msg_limit > 0:\n'
        '        try:\n'
        '            from datetime import datetime as _dt\n'
        '            _period = _dt.utcnow().strftime("%Y-%m")\n'
        '            _doc = db.user_collection.database["usage_counter"].find_one_and_update(\n'
        '                {"period": _period},\n'
        '                {"$inc": {"count": 1}},\n'
        '                upsert=True,\n'
        '                return_document=True,\n'
        '            )\n'
        '            if _doc and _doc.get("count", 0) > _msg_limit:\n'
        '                await update.message.reply_text(\n'
        '                    f"Месячный лимит ответов ({_msg_limit}) исчерпан. '
        'Сброс — 1-го числа следующего месяца."\n'
        '                )\n'
        '                return\n'
        '        except Exception as _err:\n'
        '            import logging as _logging\n'
        '            _logging.getLogger("agent-market.limit").warning(\n'
        '                "monthly limit check failed (fail-open): %s", _err\n'
        '            )\n'
    ),
    src,
    count=1,
    flags=re.DOTALL,
)

# Assert что патч применился — без этого молчаливо отвалимся когда
# upstream перепишет message_handle. Лучше упасть на boot чем работать
# без anti-spam защиты в проде.
if "Hireon: месячный anti-spam лимит" not in src:
    raise SystemExit(
        "FATAL: monthly limit patch did not apply — message_handle signature "
        "may have changed in upstream father-bot. Refusing to start."
    )

# voice_message_handle вызывает openai.Audio.transcribe (Whisper endpoint
# api.openai.com/v1/audio/transcriptions). OpenRouter этот endpoint
# не проксирует — реально транскрибировать нечем. Стабим handler
# дружелюбным сообщением вместо crash'а.
src = re.sub(
    r'(async def voice_message_handle\(update: Update, context: CallbackContext\):)\s*\n.*?(?=\n(?:async\s+)?def\s)',
    lambda m: m.group(1) + (
        '\n    await register_user_if_not_exists(update, context, update.message.from_user)\n'
        '    await update.message.reply_text(\n'
        '        "Голосовые сообщения пока не поддерживаются — напиши, пожалуйста, текстом.",\n'
        '        parse_mode=ParseMode.HTML\n'
        '    )\n\n\n'
    ),
    src,
    count=1,
    flags=re.DOTALL,
)

p.write_text(src)
PYEOF

exec "$@"
