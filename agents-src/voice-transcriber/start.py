"""Startup wrapper for whisper-transcriber-bot (upstream Malith-Rukshan).

Зачем: upstream bot.py логирует через logging.basicConfig в самом модуле,
но если запустить его напрямую — STDOUT не line-buffered, наш LogViewer
показывает логи рывками. Этот враппер ставит line-buffered + INFO-уровень
+ душит шумный httpx, потом передаёт управление в bot.py через runpy.

Также — добавляем sys.path и chdir, потому что upstream использует
относительные импорты (config, transcriber, utils) и ожидает что
рабочая директория — src/.
"""

import logging
import os
import runpy
import sys


def setup_logging() -> None:
    level_name = os.environ.get("LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        stream=sys.stdout,
        force=True,
    )
    # httpx на INFO логирует каждый getUpdates poll — заваливает stream.
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)


def main() -> None:
    setup_logging()
    log = logging.getLogger("agent-market.voice-transcriber")
    log.info(
        "starting whisper-transcriber-bot (python=%s, model=%s)",
        sys.version.split()[0],
        os.environ.get("WHISPER_MODEL_NAME", "base"),
    )

    # Upstream-код лежит в /app/ (мы туда скопировали src/* в Dockerfile).
    # Относительные импорты (from config import Config, from transcriber
    # import WhisperTranscriber, from utils import ...) требуют чтобы /app
    # был в sys.path и cwd. Мы уже там, но добавим явно для надёжности.
    if "/app" not in sys.path:
        sys.path.insert(0, "/app")
    os.chdir("/app")

    runpy.run_path("/app/bot.py", run_name="__main__")


if __name__ == "__main__":
    main()
