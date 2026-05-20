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
    log = logging.getLogger("agent-market.ai-support-bot")
    log.info(
        "starting father-bot wrapper (python=%s)", sys.version.split()[0]
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
