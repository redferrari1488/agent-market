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
• Whisper (small, multilingual)
• Запуск на CPU
• Скорость: ~7–10 сек на минуту аудио
• Языки: русский, английский, ~100 других

*Платформа:* hireon — каталог готовых AI-агентов
*Сайт:* hireon.agency"""

# Короткие строки (без переводов строк) для замены через простой re.sub.
HIREON_PROCESSING_MSG = "🎙 *Расшифровываю...*\\n⏳ Подожди пару секунд"
HIREON_DL_FAILED = "❌ *Не удалось скачать*\\nПопробуй ещё раз."
HIREON_TR_FAILED = (
    "❌ *Не удалось расшифровать*\\n"
    "Попробуй с более чистым звуком.\\n\\n"
    "💡 Совет: говори ближе к микрофону, без фонового шума."
)
HIREON_PROC_ERR = "❌ *Ошибка обработки*\\nЧто-то пошло не так, попробуй ещё раз."
HIREON_INVALID_FILE = (
    "❌ *Не аудиофайл*\\n"
    "Пришли голосовое или аудио.\\n\\n"
    "📁 *Форматы:* MP3, M4A, WAV, OGG, FLAC"
)


def patch_upstream_branding() -> None:
    """Заменяет upstream-тексты на брендированные hireon (русский, без промо).
    Патчит bot.py, utils.py и transcriber.py. Идемпотентно — повторный
    запуск не ломает уже патченные файлы.
    """
    log = logging.getLogger("agent-market.voice-transcriber")

    # --- bot.py ---
    bot_path = pathlib.Path("/app/bot.py")
    src = bot_path.read_text()
    original = src

    # Welcome / help / about — целиком заменяем тройные строки.
    # Pattern ловит и f"""...""" и """...""" (после первого патча f-префикс уже снят).
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

    # Промо-блоки в error-сообщениях: "\n\n⭐ [Star us...]" и "\n🐛 [Report...]".
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

    # Process_audio сообщения и handle_document_audio "Invalid File" — целиком.
    # Pattern ищет по уникальному началу, [^"]+ доедает до закрывающей кавычки.
    # Используем lambda в replacement: re.sub иначе интерпретирует "\n" в строке
    # как newline (escape sequence), а нам нужны буквальные backslash+n.
    src = re.sub(
        r'"🎙️ \*Transcribing audio[^"]+"',
        lambda _m: f'"{HIREON_PROCESSING_MSG}"',
        src,
    )
    src = re.sub(
        r'"❌ \*Download Failed[^"]+"',
        lambda _m: f'"{HIREON_DL_FAILED}"',
        src,
    )
    src = re.sub(
        r'"❌ \*Transcription Failed[^"]+"',
        lambda _m: f'"{HIREON_TR_FAILED}"',
        src,
    )
    src = re.sub(
        r'"❌ \*Processing Error[^"]+"',
        lambda _m: f'"{HIREON_PROC_ERR}"',
        src,
    )
    src = re.sub(
        r'"❌ \*Invalid File[^"]+"',
        lambda _m: f'"{HIREON_INVALID_FILE}"',
        src,
    )

    if src != original:
        bot_path.write_text(src)
        log.info("bot.py branding patched (hireon)")

    # --- utils.py ---
    utils_path = pathlib.Path("/app/utils.py")
    usrc = utils_path.read_text()
    original_u = usrc

    # format_transcription: header + no-speech
    usrc = usrc.replace(
        '"❌ No speech detected in audio"',
        '"❌ В аудио не услышал речь"',
    )
    usrc = usrc.replace(
        'f"📝 *Transcription:*\\n\\n{text}{timing_info}"',
        'f"📝 *Расшифровка:*\\n\\n{text}{timing_info}"',
    )
    # format_processing_time — "Processing time:" в трёх ветках.
    usrc = usrc.replace("*Processing time:*", "*Время обработки:*")
    # send_long_message
    usrc = usrc.replace(
        '"📄 Transcription too long, sending as file..."',
        '"📄 Расшифровка длинная, отправляю файлом..."',
    )
    usrc = usrc.replace(
        '"📝 *Audio Transcription*\\n\\nThe transcription was too long for a regular message."',
        '"📝 *Расшифровка аудио*\\n\\nТекст слишком длинный, отправляю файлом."',
    )
    usrc = usrc.replace(
        '"❌ Failed to send transcription. Please try again."',
        '"❌ Не получилось отправить расшифровку. Попробуй ещё раз."',
    )

    if usrc != original_u:
        utils_path.write_text(usrc)
        log.info("utils.py branding patched (hireon)")

    # --- transcriber.py ---
    # Base-модель часто ошибается с auto-detect языка на коротких клипах.
    # Передаём WHISPER_LANGUAGE (default 'ru' — наш рынок) явно.
    tr_path = pathlib.Path("/app/transcriber.py")
    tsrc = tr_path.read_text()
    original_t = tsrc

    tsrc = tsrc.replace(
        "segments = self.model.transcribe(audio_file_path)",
        'segments = self.model.transcribe(audio_file_path, language=os.environ.get("WHISPER_LANGUAGE", "ru"))',
    )

    if tsrc != original_t:
        tr_path.write_text(tsrc)
        log.info("transcriber.py language patched (WHISPER_LANGUAGE)")


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
