"""Startup wrapper for whisper-transcriber-bot (upstream Malith-Rukshan).

Зачем: upstream bot.py логирует через logging.basicConfig в самом модуле,
но если запустить его напрямую — STDOUT не line-buffered, наш LogViewer
показывает логи рывками. Этот враппер ставит line-buffered + INFO-уровень
+ душит шумный httpx, потом передаёт управление в bot.py через runpy.

Также — добавляем sys.path и chdir, потому что upstream использует
относительные импорты (config, transcriber, utils) и ожидает что
рабочая директория — src/.

Третий блок — patch_upstream_branding: переписывает welcome/help/about
тексты под бренд hireon (русский, без промо-ссылок на upstream-автора).
Идемпотентно — повторный запуск не ломает уже патченный файл.
"""

import logging
import os
import pathlib
import re
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


HIREON_WELCOME = """🎙 *hireon voice-transcriber*

Привет! Я превращаю голосовые в текст. Просто пришли голосовое или аудиофайл — пришлю расшифровку за пару секунд.

*Что умею:*
• Голосовые сообщения
• Аудиофайлы: MP3, M4A, WAV, OGG, FLAC
• Языки: русский, английский и ~100 других
• Размер: до 25 MB

*Команды:*
/help — справка
/about — о боте
/status — статус

Часть платформы *hireon* — каталог готовых AI-агентов."""

HIREON_HELP = """📖 *Справка*

*Как пользоваться:*
1. Пришли голосовое или аудиофайл
2. Подожди 1–3 секунды
3. Получи текст

*Команды:*
/start — приветствие
/help — эта справка
/about — о боте
/status — статус

*Форматы:* MP3, M4A, WAV, OGG, FLAC
*Размер:* до 25 MB

*Совет:* чем чище звук — тем точнее расшифровка."""

HIREON_ABOUT = """ℹ *О боте*

Voice-transcriber переводит голос в текст через локальную модель Whisper. Без облаков и внешних API — аудио не покидает сервер.

*Технология:*
• Whisper (base, multilingual)
• Запуск на CPU
• Скорость: ~1–3 сек на минуту аудио
• Языки: русский, английский, ~100 других

*Платформа:* hireon — каталог готовых AI-агентов
*Сайт:* hireon.agency"""


def patch_upstream_branding() -> None:
    """Заменяет upstream welcome/help/about на брендированные тексты hireon.
    Идемпотентно: повторный запуск не ломает уже патченный файл.
    """
    bot_path = pathlib.Path("/app/bot.py")
    src = bot_path.read_text()
    original = src

    # 1. Welcome / help / about — целиком заменяем тройные строки.
    #    Pattern ловит и f"""...""" и """...""" (после первого патча f-префикс уже снят).
    src = re.sub(
        r'welcome_message = f?"""[\s\S]+?"""',
        lambda _m: f'welcome_message = """{HIREON_WELCOME}"""',
        src,
        count=1,
    )
    src = re.sub(
        r'help_message = f?"""[\s\S]+?"""',
        lambda _m: f'help_message = """{HIREON_HELP}"""',
        src,
        count=1,
    )
    src = re.sub(
        r'about_message = """[\s\S]+?"""',
        lambda _m: f'about_message = """{HIREON_ABOUT}"""',
        src,
        count=1,
    )

    # 2. Промо-блоки в error-сообщениях: "\n\n⭐ [Star us...]" и "\n🐛 [Report...]".
    src = re.sub(
        r"\\n\\n[⭐🐛]\s*\[[^\]]+\]\(https://github\.com/Malith-Rukshan[^)]*\)",
        "",
        src,
    )
    # Inline-вариант после \n (handle_document_audio): "\n⭐ [Star us...]".
    src = re.sub(
        r"\\n[⭐🐛]\s*\[[^\]]+\]\(https://github\.com/Malith-Rukshan[^)]*\)",
        "",
        src,
    )

    if src != original:
        bot_path.write_text(src)
        logging.getLogger("agent-market.voice-transcriber").info(
            "bot.py branding patched (hireon)"
        )


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

    patch_upstream_branding()

    runpy.run_path("/app/bot.py", run_name="__main__")


if __name__ == "__main__":
    main()
