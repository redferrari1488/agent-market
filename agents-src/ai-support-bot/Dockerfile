# AI Support Bot — обёртка над father-bot/chatgpt_telegram_bot (MIT)
# https://github.com/father-bot/chatgpt_telegram_bot
#
# Подход: клонируем upstream на этапе build (а не форкаем), чтобы всегда
# быть на свежей версии. Конфиги генерирует entrypoint.sh из env-переменных.

FROM python:3.11-slim

ARG FATHER_BOT_REF=main

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        git ffmpeg \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN git clone --depth 1 --branch ${FATHER_BOT_REF} \
        https://github.com/father-bot/chatgpt_telegram_bot.git .

# Upstream father-bot pin'ит старые litellm/h11/lxml/urllib3 (Trivy: 1 CRITICAL
# + несколько HIGH). После основного install принудительно поднимаем уязвимые
# пакеты через общий security-baseline.txt.
#
# ВАЖНО: upstream держит `python-telegram-bot==20.1`, который вызывает
# httpx.AsyncClient(proxies=...). В httpx 0.28+ аргумент proxies удалён →
# крэш на старте. Litellm 1.85 транзитивно тянет httpx 0.28, поэтому
# pin'им обратно httpx<0.28 после baseline. PTB 20.1 в этой связке работает,
# litellm — тоже (нижнего bound на httpx у него нет).
COPY security-baseline.txt /tmp/security-baseline.txt
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir wheel==0.46.3 \
    && pip install --no-cache-dir --upgrade -r /tmp/security-baseline.txt \
    && pip install --no-cache-dir "httpx>=0.27,<0.28"

COPY ai-support-bot/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN groupadd -g 1000 agent \
    && useradd -m -u 1000 -g 1000 agent \
    && chown -R 1000:1000 /app
USER 1000:1000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "bot/bot.py"]
