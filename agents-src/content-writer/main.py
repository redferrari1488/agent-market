import asyncio
import contextlib
import hashlib
import json
import logging
import os
import random
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import (
    Application,
    ApplicationBuilder,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from ai_provider import generate, get_provider_name

DATA_DIR = Path("/data")
STATE_PATH = DATA_DIR / "state.json"
PENDING_DIR = DATA_DIR / "pending_posts"

POST_INTERVAL_HOURS = int(os.environ["POST_INTERVAL_HOURS"])
CHANNEL_ID = os.environ["CHANNEL_ID"]
OWNER_CHAT_ID = int(os.environ["OWNER_CHAT_ID"])
TOPIC = os.environ["TOPIC"].strip()
TONE = os.environ["TONE"].strip()

# Опциональный контекст — сердце качества. Чем богаче бриф, тем меньше
# усреднённой «воды от GPT». EXAMPLES (few-shot) — самый сильный рычаг.
EXAMPLES = os.environ.get("EXAMPLES", "").strip()
AUDIENCE = os.environ.get("AUDIENCE", "").strip()
FORMAT_RULES = os.environ.get("FORMAT_RULES", "").strip()
AVOID = os.environ.get("AVOID", "").strip()


def _parse_pillars(raw: str) -> list[str]:
    raw = raw.strip()
    if not raw:
        return []
    items = [line.strip(" -•\t") for line in raw.splitlines()]
    items = [i for i in items if i]
    # допускаем и одну строку через запятую
    if len(items) == 1 and "," in items[0]:
        items = [p.strip() for p in items[0].split(",") if p.strip()]
    return items


CONTENT_PILLARS = _parse_pillars(os.environ.get("CONTENT_PILLARS", ""))

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso8601(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        logging.warning("Invalid last_post_at in state: %s", value)
        return None


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"last_post_at": None, "posts_count": 0, "pillar_index": 0}
    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logging.warning("Failed to read state file: %s", error)
        return {"last_post_at": None, "posts_count": 0, "pillar_index": 0}
    return {
        "last_post_at": data.get("last_post_at"),
        "posts_count": int(data.get("posts_count", 0)),
        "pillar_index": int(data.get("pillar_index", 0)),
    }


def write_atomic(path: Path, payload: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with temp_path.open("w", encoding="utf-8") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())
    os.replace(temp_path, path)


def save_state(state: dict[str, Any]) -> None:
    write_atomic(STATE_PATH, json.dumps(state, ensure_ascii=False, indent=2))


# ── pending drafts (паттерн из review-responder-2gis) ──────────────────────
def pending_token(seed: str) -> str:
    return hashlib.sha1(seed.encode("utf-8")).hexdigest()[:12]


def pending_path(token: str) -> Path:
    return PENDING_DIR / f"{token}.json"


def save_pending(token: str, payload: dict[str, Any]) -> None:
    write_atomic(pending_path(token), json.dumps(payload, ensure_ascii=False, indent=2))


def load_pending(token: str) -> dict[str, Any] | None:
    path = pending_path(token)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def delete_pending(token: str) -> None:
    path = pending_path(token)
    if path.exists():
        path.unlink()


def find_pending_by_message(message_id: int) -> tuple[str, dict[str, Any]] | None:
    if not PENDING_DIR.exists():
        return None
    for path in PENDING_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if data.get("draft_message_id") == message_id:
            return path.stem, data
    return None


# ── промпт: сердце качества ────────────────────────────────────────────────
ANGLES = ["живой факт", "вопрос к аудитории", "короткая история", "практический совет"]


def pick_pillar(state: dict[str, Any]) -> str:
    if not CONTENT_PILLARS:
        return TOPIC
    idx = int(state.get("pillar_index", 0)) % len(CONTENT_PILLARS)
    return CONTENT_PILLARS[idx]


def build_prompts(pillar: str) -> tuple[str, str]:
    today = utcnow().date().isoformat()
    parts = [
        "Ты — редактор Telegram-канала. Пишешь готовые к публикации посты на русском.",
        f"Ниша канала: {TOPIC}.",
        f"Тон голоса: {TONE}.",
    ]
    if AUDIENCE:
        parts.append(f"Аудитория: {AUDIENCE}.")
    if FORMAT_RULES:
        parts.append(f"Правила формата: {FORMAT_RULES}.")
    if AVOID:
        parts.append(f"Избегай и не пиши про: {AVOID}.")
    parts.append(
        "Пост готов к публикации: без вводных про ИИ, без кавычек вокруг текста, "
        "без спама хэштегами. Живой ритм, конкретика, один внятный вывод."
    )
    if EXAMPLES:
        parts.append(
            "Вот примеры постов этого канала — пиши в ТОМ ЖЕ стиле, ритме и подаче "
            "(копируй манеру, а не темы):\n\n" + EXAMPLES
        )
    system_prompt = "\n".join(parts)
    angle = random.choice(ANGLES)
    user_prompt = (
        f"Напиши пост на тему: {pillar}.\n"
        f"Дата: {today}.\n"
        f"Угол подачи: {angle}.\n"
        "Объём: 4-8 коротких абзацев."
    )
    return system_prompt, user_prompt


# Модель иногда возвращает markdown (**жирный**, # заголовки, `код`). В канал
# шлём plain text без parse_mode, поэтому такие маркеры показались бы сырыми
# символами — вычищаем их перед показом владельцу и публикацией.
_MD_HEADING = re.compile(r"(?m)^[ \t]{0,3}#{1,6}[ \t]+")
_MD_EMPHASIS = re.compile(r"(\*\*|__)(.+?)\1", re.S)
_MD_CODE = re.compile(r"`([^`]+)`")


def strip_markdown(text: str) -> str:
    text = _MD_HEADING.sub("", text)
    text = _MD_EMPHASIS.sub(r"\2", text)
    text = _MD_CODE.sub(r"\1", text)
    return text.strip()


async def generate_post(pillar: str, temperature: float = 0.9) -> str:
    system_prompt, user_prompt = build_prompts(pillar)
    text = await asyncio.to_thread(generate, user_prompt, system_prompt, 800, temperature)
    return strip_markdown(text)


def build_owner_message(payload: dict[str, Any]) -> str:
    line = "─" * 18
    return (
        f"📝 Черновик · рубрика: {payload['pillar']}\n"
        f"{line}\n"
        f"{payload['draft']}\n"
        f"{line}\n"
        "✅ Опубликовать · ✏️ свой вариант — пришли реплаем · ⏭ пропустить"
    )


def build_buttons(token: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("✅ Опубликовать", callback_data=f"cw:publish:{token}"),
                InlineKeyboardButton("✏️ Переписать", callback_data=f"cw:rewrite:{token}"),
                InlineKeyboardButton("⏭ Пропустить", callback_data=f"cw:skip:{token}"),
            ]
        ]
    )


async def publish_to_channel(application: Application, text: str) -> None:
    await application.bot.send_message(chat_id=CHANNEL_ID, text=text)


async def prepare_draft(application: Application) -> None:
    state = application.bot_data["state"]
    pillar = pick_pillar(state)

    try:
        draft = await generate_post(pillar)
    except Exception as error:
        logging.exception("AI generation failed: %s", error)
        return
    if not draft:
        logging.warning("AI returned an empty draft, skipping cycle")
        return

    token = pending_token(utcnow().isoformat() + pillar)
    payload: dict[str, Any] = {
        "token": token,
        "pillar": pillar,
        "draft": draft,
        "draft_message_id": None,
    }
    save_pending(token, payload)

    try:
        msg = await application.bot.send_message(
            chat_id=OWNER_CHAT_ID,
            text=build_owner_message(payload),
            reply_markup=build_buttons(token),
        )
    except Exception as error:
        logging.exception("Failed to send draft to owner: %s", error)
        delete_pending(token)
        return

    payload["draft_message_id"] = msg.message_id
    save_pending(token, payload)

    # ротация рубрики + отметка времени, чтобы следующий черновик ушёл не раньше интервала
    state["pillar_index"] = int(state.get("pillar_index", 0)) + 1
    state["last_post_at"] = utcnow().isoformat()
    save_state(state)
    logging.info("Draft prepared (pillar=%s) via %s", pillar, get_provider_name())


def next_due_at(state: dict[str, Any]) -> datetime | None:
    last = parse_iso8601(state.get("last_post_at"))
    if last is None:
        return None
    return last + timedelta(hours=POST_INTERVAL_HOURS)


async def maybe_prepare(application: Application) -> None:
    state = application.bot_data["state"]
    due = next_due_at(state)
    if due is not None and due > utcnow():
        return
    lock: asyncio.Lock = application.bot_data["cycle_lock"]
    if lock.locked():
        return
    async with lock:
        await prepare_draft(application)


async def monitor_loop(application: Application) -> None:
    while True:
        try:
            await maybe_prepare(application)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            logging.exception("Content writer cycle failed: %s", error)
        await asyncio.sleep(60)


async def on_startup(application: Application) -> None:
    application.bot_data["state"] = load_state()
    application.bot_data["cycle_lock"] = asyncio.Lock()
    application.bot_data["monitor_task"] = application.create_task(monitor_loop(application))
    logging.info(
        "Content writer started: provider=%s interval=%sh pillars=%s",
        get_provider_name(),
        POST_INTERVAL_HOURS,
        len(CONTENT_PILLARS) or 1,
    )


async def on_shutdown(application: Application) -> None:
    task: asyncio.Task[Any] | None = application.bot_data.get("monitor_task")
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    if query is None or query.data is None:
        return
    try:
        _, action, token = query.data.split(":", 2)
    except ValueError:
        await query.answer("Некорректное действие", show_alert=True)
        return

    payload = load_pending(token)
    if payload is None:
        await query.answer("Черновик больше недоступен", show_alert=True)
        with contextlib.suppress(Exception):
            await query.edit_message_reply_markup(reply_markup=None)
        return

    if action == "publish":
        try:
            await publish_to_channel(context.application, payload["draft"])
        except Exception as error:
            logging.exception("Publish failed: %s", error)
            await query.answer("Не удалось опубликовать", show_alert=True)
            return
        await query.answer("Опубликовано ✅")
        await query.edit_message_text(f"✅ Опубликовано в канал:\n\n{payload['draft']}")
        delete_pending(token)
        return

    if action == "rewrite":
        await query.answer("Переписываю…")
        try:
            payload["draft"] = await generate_post(payload["pillar"], temperature=1.0)
        except Exception as error:
            logging.exception("Rewrite failed: %s", error)
            await query.answer("Не удалось переписать", show_alert=True)
            return
        save_pending(token, payload)
        await query.edit_message_text(build_owner_message(payload), reply_markup=build_buttons(token))
        return

    if action == "skip":
        await query.answer("Пропущено")
        await query.edit_message_text("⏭ Пропущено")
        delete_pending(token)
        return

    await query.answer("Неизвестное действие", show_alert=True)


async def handle_owner_reply(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    msg = update.message
    if msg is None or not msg.text or msg.reply_to_message is None:
        return
    if msg.chat_id != OWNER_CHAT_ID:
        return

    found = find_pending_by_message(msg.reply_to_message.message_id)
    if found is None:
        return  # реплай не на наш черновик — игнорируем

    try:
        await publish_to_channel(context.application, msg.text)
    except Exception as error:
        logging.exception("Publish (owner edit) failed: %s", error)
        await msg.reply_text("⚠️ Не удалось опубликовать твой вариант")
        return

    await msg.reply_text("✅ Опубликован твой вариант")
    delete_pending(found[0])


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    PENDING_DIR.mkdir(parents=True, exist_ok=True)

    application = (
        ApplicationBuilder()
        .token(os.environ["TELEGRAM_BOT_TOKEN"])
        .post_init(on_startup)
        .post_shutdown(on_shutdown)
        .build()
    )
    application.add_handler(CallbackQueryHandler(handle_callback, pattern=r"^cw:"))
    application.add_handler(
        MessageHandler(filters.TEXT & filters.REPLY & ~filters.COMMAND, handle_owner_reply)
    )
    application.run_polling()


if __name__ == "__main__":
    main()
