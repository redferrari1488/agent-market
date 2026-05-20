import contextlib
import asyncio
import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import Application, ApplicationBuilder, CallbackQueryHandler, ContextTypes

from ai_provider import generate, get_provider_name

DATA_DIR = Path("/data")
STATE_PATH = DATA_DIR / "state.json"
PENDING_DIR = DATA_DIR / "pending_reviews"
CHECK_INTERVAL_MINUTES = int(os.environ["CHECK_INTERVAL_MINUTES"])
BRANCH_ID = os.environ["TWOGIS_BRANCH_ID"]
OWNER_CHAT_ID = os.environ["OWNER_CHAT_ID"]
BRAND_TONE = os.environ["BRAND_TONE"].strip()
PUBLIC_KEY_REGEX = re.compile(r'"key":"([a-f0-9-]+)"')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
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
        logging.warning("Invalid last_check_at in state: %s", value)
        return None


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"seen_review_ids": [], "last_check_at": None}

    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logging.warning("Failed to read state file: %s", error)
        return {"seen_review_ids": [], "last_check_at": None}

    seen_review_ids = data.get("seen_review_ids")
    if not isinstance(seen_review_ids, list):
        seen_review_ids = []

    return {
        "seen_review_ids": [str(item) for item in seen_review_ids][-1000:],
        "last_check_at": data.get("last_check_at"),
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


def remember_review(state: dict[str, Any], review_id: str) -> None:
    state["seen_review_ids"].append(review_id)
    state["seen_review_ids"] = state["seen_review_ids"][-1000:]


def pending_token(review_id: str) -> str:
    return hashlib.sha1(review_id.encode("utf-8")).hexdigest()[:12]


def pending_path(token: str) -> Path:
    return PENDING_DIR / f"{token}.json"


def load_pending_review(token: str) -> dict[str, Any] | None:
    path = pending_path(token)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def save_pending_review(token: str, payload: dict[str, Any]) -> None:
    write_atomic(pending_path(token), json.dumps(payload, ensure_ascii=False, indent=2))


def delete_pending_review(token: str) -> None:
    path = pending_path(token)
    if path.exists():
        path.unlink()


def review_id_of(review: dict[str, Any]) -> str | None:
    for key in ("id", "review_id", "reviewId"):
        value = review.get(key)
        if value is not None:
            return str(value)
    return None


def review_text_of(review: dict[str, Any]) -> str:
    for key in ("text", "comment", "content"):
        value = review.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def review_user_of(review: dict[str, Any]) -> str:
    for key in ("user_name", "userName", "author_name", "name"):
        value = review.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    author = review.get("author")
    if isinstance(author, dict):
        for key in ("name", "user_name", "login"):
            value = author.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return "пользователя"


def review_rating_of(review: dict[str, Any]) -> int:
    for key in ("rating", "stars"):
        value = review.get(key)
        if value is not None:
            try:
                return int(value)
            except (TypeError, ValueError):
                return 0
    return 0


def should_reply(review: dict[str, Any]) -> bool:
    rating = review_rating_of(review)
    text = review_text_of(review)
    return rating <= 4 or bool(text)


def build_message(payload: dict[str, Any]) -> str:
    original_text = payload["review_text"] or "Без текста"
    return (
        f"📝 Новый отзыв ({payload['rating']}⭐) от {payload['user_name']}:\n"
        f"{original_text}\n\n"
        f"💬 Черновик ответа:\n"
        f"{payload['draft']}"
    )


def build_buttons(token: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [
                InlineKeyboardButton("✅ Отправить", callback_data=f"rv:send:{token}"),
                InlineKeyboardButton("✏️ Переписать", callback_data=f"rv:rewrite:{token}"),
                InlineKeyboardButton("⏭ Пропустить", callback_data=f"rv:skip:{token}"),
            ]
        ]
    )


async def resolve_public_key(client: httpx.AsyncClient) -> str:
    if os.environ.get("TWOGIS_PUBLIC_KEY"):
        return os.environ["TWOGIS_PUBLIC_KEY"]

    response = await client.get("https://2gis.ru/")
    response.raise_for_status()
    match = PUBLIC_KEY_REGEX.search(response.text)
    if not match:
        raise RuntimeError("Could not extract 2GIS public key from homepage")
    return match.group(1)


async def fetch_reviews(client: httpx.AsyncClient, public_key: str) -> list[dict[str, Any]]:
    response = await client.get(
        f"https://public-api.reviews.2gis.com/2.0/branches/{BRANCH_ID}/reviews",
        params={
            "limit": 50,
            "is_advertiser": "false",
            "fields": (
                "meta.providers,meta.branch_rating,meta.branch_reviews_count,"
                "meta.total_count,reviews.hiding_reason,reviews.is_verified"
            ),
            "without_my_first_review": "false",
            "rated": "true",
            "sort_by": "date_edited",
            "key": public_key,
        },
    )
    response.raise_for_status()
    data = response.json()
    if isinstance(data, dict):
        reviews = data.get("reviews")
        if isinstance(reviews, list):
            return [item for item in reviews if isinstance(item, dict)]
        result = data.get("result")
        if isinstance(result, dict) and isinstance(result.get("reviews"), list):
            return [item for item in result["reviews"] if isinstance(item, dict)]
    raise RuntimeError("Unexpected 2GIS response format")


async def generate_draft(review_text: str, rating: int) -> str:
    prompt = (
        f"Отзыв клиента:\n{review_text or 'Без текста'}\n\n"
        f"Оценка: {rating} из 5"
    )
    return (
        await asyncio.to_thread(
            generate,
            prompt,
            (
                f"Тон бренда: {BRAND_TONE}. "
                "Напиши короткий, тёплый, но профессиональный ответ. "
                "Не обещай компенсаций без ведома владельца. 2-4 предложения."
            ),
            400,
            0.6,
        )
    ).strip()


async def generate_alternative_draft(review_text: str, rating: int) -> str:
    prompt = (
        f"Отзыв клиента:\n{review_text or 'Без текста'}\n\n"
        f"Оценка: {rating} из 5"
    )
    return (
        await asyncio.to_thread(
            generate,
            prompt,
            (
                f"Тон бренда: {BRAND_TONE}. "
                "Напиши альтернативный короткий, тёплый, но профессиональный ответ. "
                "Не обещай компенсаций без ведома владельца. 2-4 предложения."
            ),
            400,
            0.9,
        )
    ).strip()


async def process_cycle(application: Application) -> None:
    state = application.bot_data["state"]
    async with httpx.AsyncClient(
        timeout=15.0,
        follow_redirects=True,
        headers={"User-Agent": "AgentMarket ReviewResponder/1.0"},
    ) as client:
        public_key = await resolve_public_key(client)
        reviews = await fetch_reviews(client, public_key)

    if state["last_check_at"] is None:
        for review in reviews:
            review_id = review_id_of(review)
            if review_id:
                remember_review(state, review_id)
        state["last_check_at"] = utcnow().isoformat()
        save_state(state)
        await application.bot.send_message(
            chat_id=OWNER_CHAT_ID,
            text=f"Мониторинг отзывов 2GIS активирован (ветка {BRANCH_ID})",
        )
        return

    seen_review_ids = set(state["seen_review_ids"])
    processed_any = False

    for review in reviews:
        review_id = review_id_of(review)
        if not review_id or review_id in seen_review_ids:
            continue

        if not should_reply(review):
            remember_review(state, review_id)
            processed_any = True
            continue

        review_text = review_text_of(review)
        rating = review_rating_of(review)
        user_name = review_user_of(review)

        try:
            draft = await generate_draft(review_text, rating)
        except Exception as error:
            logging.exception("Failed to generate draft for review %s: %s", review_id, error)
            continue

        if not draft:
            logging.warning("AI returned an empty draft for review %s", review_id)
            continue

        token = pending_token(review_id)
        payload = {
            "review_id": review_id,
            "review_text": review_text,
            "rating": rating,
            "user_name": user_name,
            "draft": draft,
        }
        save_pending_review(token, payload)

        try:
            await application.bot.send_message(
                chat_id=OWNER_CHAT_ID,
                text=build_message(payload),
                reply_markup=build_buttons(token),
            )
        except Exception as error:
            logging.exception("Failed to send review draft to Telegram: %s", error)
            delete_pending_review(token)
            continue

        remember_review(state, review_id)
        processed_any = True

    if processed_any:
        logging.info("Processed new 2GIS reviews via %s", get_provider_name())

    state["last_check_at"] = utcnow().isoformat()
    save_state(state)


async def maybe_process_cycle(application: Application) -> None:
    lock: asyncio.Lock = application.bot_data["cycle_lock"]
    last_check_at = parse_iso8601(application.bot_data["state"].get("last_check_at"))
    if last_check_at is not None and last_check_at + timedelta(minutes=CHECK_INTERVAL_MINUTES) > utcnow():
        return

    if lock.locked():
        return

    async with lock:
        await process_cycle(application)


async def monitor_loop(application: Application) -> None:
    while True:
        try:
            await maybe_process_cycle(application)
        except asyncio.CancelledError:
            raise
        except Exception as error:
            logging.exception("Review monitor cycle failed: %s", error)
        await asyncio.sleep(30)


async def on_startup(application: Application) -> None:
    application.bot_data["cycle_lock"] = asyncio.Lock()
    application.bot_data["monitor_task"] = application.create_task(monitor_loop(application))
    logging.info(
        "Review responder started: provider=%s interval=%sm branch=%s",
        get_provider_name(),
        CHECK_INTERVAL_MINUTES,
        BRANCH_ID,
    )


async def on_shutdown(application: Application) -> None:
    task: asyncio.Task[Any] | None = application.bot_data.get("monitor_task")
    if task is not None:
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await task


async def handle_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if update.callback_query is None or update.callback_query.data is None:
        return

    query = update.callback_query
    try:
        _, action, token = query.data.split(":", 2)
    except ValueError:
        await query.answer("Некорректное действие", show_alert=True)
        return

    payload = load_pending_review(token)
    if payload is None:
        await query.answer("Черновик больше недоступен", show_alert=True)
        await query.edit_message_reply_markup(reply_markup=None)
        return

    if action == "send":
        logging.warning(
            "Отправка ответа через API пока не поддерживается 2GIS — скопируйте текст и вставьте вручную"
        )
        await query.answer(
            "Отправка ответа через API пока не поддерживается 2GIS — скопируйте текст и вставьте вручную",
            show_alert=True,
        )
        await query.edit_message_text(
            f"✅ Ответ одобрен, скопируйте из черновика:\n\n{payload['draft']}"
        )
        delete_pending_review(token)
        return

    if action == "rewrite":
        await query.answer("Переписываю черновик...")
        try:
            payload["draft"] = await generate_alternative_draft(
                payload["review_text"],
                int(payload["rating"]),
            )
        except Exception as error:
            logging.exception("Failed to rewrite draft: %s", error)
            await query.edit_message_text(
                f"{build_message(payload)}\n\n⚠️ Не удалось получить альтернативу.",
                reply_markup=build_buttons(token),
            )
            return

        save_pending_review(token, payload)
        await query.edit_message_text(
            build_message(payload),
            reply_markup=build_buttons(token),
        )
        return

    if action == "skip":
        await query.answer("Пропущено")
        await query.edit_message_text("⏭ Пропущен")
        delete_pending_review(token)
        return

    await query.answer("Неизвестное действие", show_alert=True)


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
    application.bot_data["state"] = load_state()
    application.add_handler(CallbackQueryHandler(handle_callback, pattern=r"^rv:"))
    application.run_polling()


if __name__ == "__main__":
    main()
