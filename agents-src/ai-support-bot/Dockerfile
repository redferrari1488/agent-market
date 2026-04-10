# AI Support Bot — обёртка над father-bot/chatgpt_telegram_bot (MIT)
# https://github.com/father-bot/chatgpt_telegram_bot
#
# Подход: клонируем upstream на этапе build (а не форкаем), чтобы всегда
# быть на свежей версии. Конфиги генерирует entrypoint.sh из env-переменных.

FROM python:3.11-slim

ARG FATHER_BOT_REF=main

RUN apt-get update && apt-get install -y --no-install-recommends \
        git ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth 1 --branch ${FATHER_BOT_REF} \
        https://github.com/father-bot/chatgpt_telegram_bot.git .

RUN pip install --no-cache-dir -r requirements.txt

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN useradd -m -u 1000 agent && chown -R agent:agent /app
USER agent

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "bot/bot.py"]
