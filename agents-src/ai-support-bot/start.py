"""Startup wrapper for father-bot.

Upstream `bot/bot.py` uses `logging.getLogger(__name__)` без явного
basicConfig, поэтому при default-уровне WARNING почти ничего не пишется
в stdout — был silent boot, невозможно отдиагностировать polling/AI.
Этот враппер настраивает INFO-логи в stdout с line-buffer, душит шумный
httpx debug, потом передаёт управление в bot.py через runpy.
"""

import logging
import os
import sys
import runpy

import openai


def route_openai_to_provider() -> None:
    """Перенаправить openai SDK 0.x на наш AI-провайдер (OpenRouter по умолчанию).

    Father-bot хардкодит api.openai.com и не читает OPENAI_BASE_URL.
    Кроме того, models.yml содержит «голые» имена вроде `gpt-3.5-turbo`,
    которые OpenRouter не маршрутизирует к нашему оплаченному ключу.
    Подменяем base URL и заменяем `model=` на AI_MODEL во всех вызовах
    ChatCompletion/Completion (sync + async + streaming).
    """
    base_url = os.environ.get("OPENAI_BASE_URL")
    if base_url:
        openai.api_base = base_url.rstrip("/")

    ai_model = os.environ.get("AI_MODEL", "anthropic/claude-sonnet-4-6")

    def _force_model(kwargs):
        kwargs["model"] = ai_model
        return kwargs

    orig_chat_create = openai.ChatCompletion.create
    orig_chat_acreate = openai.ChatCompletion.acreate
    orig_text_create = openai.Completion.create
    orig_text_acreate = openai.Completion.acreate

    def _chat_create(*a, **kw):
        return orig_chat_create(*a, **_force_model(kw))

    async def _chat_acreate(*a, **kw):
        return await orig_chat_acreate(*a, **_force_model(kw))

    def _text_create(*a, **kw):
        return orig_text_create(*a, **_force_model(kw))

    async def _text_acreate(*a, **kw):
        return await orig_text_acreate(*a, **_force_model(kw))

    openai.ChatCompletion.create = _chat_create
    openai.ChatCompletion.acreate = _chat_acreate
    openai.Completion.create = _text_create
    openai.Completion.acreate = _text_acreate


def setup_logging() -> None:
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
        force=True,
    )
    # httpx/httpcore на INFO логируют каждый getUpdates poll — заваливает.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("telegram.ext._application").setLevel(logging.INFO)

    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)


def main() -> None:
    setup_logging()
    route_openai_to_provider()
    log = logging.getLogger("agent-market.ai-support-bot")
    log.info(
        "starting father-bot wrapper (python=%s, base=%s, model=%s)",
        sys.version.split()[0],
        openai.api_base,
        os.environ.get("AI_MODEL", "anthropic/claude-sonnet-4-6"),
    )
    # bot/bot.py использует относительные импорты (import database, config,
    # openai_utils) от своего директория. Если запускать через
    # runpy.run_path("bot/bot.py") из /app, sys.path не получает /app/bot и
    # модули не находятся. Добавляем явно и chdir.
    bot_dir = os.path.join(os.getcwd(), "bot")
    sys.path.insert(0, bot_dir)
    os.chdir(bot_dir)
    runpy.run_path("bot.py", run_name="__main__")


if __name__ == "__main__":
    main()
