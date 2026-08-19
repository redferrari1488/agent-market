# syntax=docker/dockerfile:1.6
#
# voice-transcriber — Telegram-бот, транскрибирующий голосовые сообщения
# через локальный Whisper (multilingual base, CPU-only). Upstream:
# https://github.com/Malith-Rukshan/whisper-transcriber-bot (MIT).
#
# Build context: agents-src/ — все COPY с префиксом voice-transcriber/
# (см. [[dockerfile-build-context]]).

FROM python:3.11-slim AS base

LABEL maintainer="hireon.team@yandex.com"
LABEL org.opencontainers.image.source="https://github.com/rodimovartem/agent-market"
LABEL org.opencontainers.image.description="Voice-to-text Telegram bot via local Whisper (multilingual)"

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ffmpeg — для конверсии .ogg (voice TG) в .wav,
# cmake + build-essential + pkg-config — компиляция pywhispercpp
# wget — выкачать ggml-модель,
# git — клонирование upstream
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg cmake build-essential pkg-config wget git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Pin upstream к конкретному коммиту для воспроизводимости.
# Если хотим обновить — bump SHA и rebuild.
ARG UPSTREAM_REPO=https://github.com/Malith-Rukshan/whisper-transcriber-bot.git
ARG UPSTREAM_SHA=main
RUN git clone --depth=1 "${UPSTREAM_REPO}" /tmp/upstream && \
    cd /tmp/upstream && git checkout "${UPSTREAM_SHA}" && \
    cp -r src/* /app/ && \
    cp requirements.txt /app/ && \
    cp download_model.sh /app/ && \
    rm -rf /tmp/upstream

RUN pip install --no-cache-dir -r /app/requirements.txt

# Скачиваем multilingual base-модель (~142MB).
# upstream-скрипт по умолчанию скачивает base.en (только английский).
# Мы переопределяем чтобы поддержать русский и другие языки.
RUN mkdir -p /app/models && \
    wget -q -O /app/models/ggml-base.bin \
      https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin

# Наши обвязки: entrypoint + log-wrapper
COPY voice-transcriber/entrypoint.sh /entrypoint.sh
COPY voice-transcriber/start.py /app/start.py
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "-u", "/app/start.py"]
