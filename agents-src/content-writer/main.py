import asyncio
import json
import logging
import os
import random
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import schedule
from telegram import Bot

from ai_provider import generate, get_provider_name

DATA_DIR = Path("/data")
STATE_PATH = DATA_DIR / "state.json"
ANGLES = ["факт", "вопрос к аудитории", "история", "совет"]
POST_INTERVAL_HOURS = int(os.environ["POST_INTERVAL_HOURS"])
CHANNEL_ID = os.environ["CHANNEL_ID"]
TOPIC = os.environ["TOPIC"].strip()
TONE = os.environ["TONE"].strip()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)


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


def load_state() -> dict[str, object]:
    if not STATE_PATH.exists():
        return {"last_post_at": None, "posts_count": 0}

    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logging.warning("Failed to read state file: %s", error)
        return {"last_post_at": None, "posts_count": 0}

    return {
        "last_post_at": data.get("last_post_at"),
        "posts_count": int(data.get("posts_count", 0)),
    }


def save_state(state: dict[str, object]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temp_path = STATE_PATH.with_suffix(".tmp")

    with temp_path.open("w", encoding="utf-8") as handle:
        json.dump(state, handle, ensure_ascii=False, indent=2)
        handle.flush()
        os.fsync(handle.fileno())

    os.replace(temp_path, STATE_PATH)


async def send_message(text: str) -> None:
    async with Bot(token=os.environ["TELEGRAM_BOT_TOKEN"]) as bot:
        await bot.send_message(chat_id=CHANNEL_ID, text=text)


def send_message_with_retry(text: str) -> bool:
    for attempt in range(2):
        try:
            asyncio.run(send_message(text))
            return True
        except Exception as error:
            logging.exception("Telegram send failed on attempt %s: %s", attempt + 1, error)
            if attempt == 0:
                time.sleep(30)
    return False


def next_due_at(state: dict[str, object]) -> datetime | None:
    last_post_at = parse_iso8601(state.get("last_post_at"))
    if last_post_at is None:
        return None
    return last_post_at + timedelta(hours=POST_INTERVAL_HOURS)


def build_prompts() -> tuple[str, str]:
    angle = random.choice(ANGLES)
    today = utcnow().date().isoformat()
    system_prompt = (
        "Ты ведёшь Telegram-канал и пишешь естественные посты на русском языке. "
        f"Тема канала: {TOPIC}. "
        f"Тон: {TONE}. "
        "Пост должен быть готов к публикации: без вводных про ИИ, без кавычек вокруг текста, "
        "без хэштегов-спама. Добавь конкретику, живой ритм и один понятный вывод."
    )
    user_prompt = (
        f"Напиши пост про {TOPIC}.\n"
        f"Дата: {today}.\n"
        f"Угол подачи: {angle}.\n"
        "Объём: 4-8 коротких абзацев. В конце можно добавить мягкий вопрос к аудитории, если это уместно."
    )
    return system_prompt, user_prompt


def post_once(state: dict[str, object]) -> None:
    system_prompt, user_prompt = build_prompts()
    logging.info("Generating a new post via %s", get_provider_name())

    try:
        text = generate(
            prompt=user_prompt,
            system=system_prompt,
            max_tokens=800,
            temperature=0.9,
        ).strip()
    except Exception as error:
        logging.exception("AI generation failed: %s", error)
        return

    if not text:
        logging.warning("AI returned an empty post, skipping this cycle")
        return

    if not send_message_with_retry(text):
        logging.error("Skipping cycle after Telegram retry exhaustion")
        return

    now_iso = utcnow().isoformat()
    state["last_post_at"] = now_iso
    state["posts_count"] = int(state.get("posts_count", 0)) + 1
    save_state(state)
    logging.info("Post published successfully, total posts: %s", state["posts_count"])


def maybe_post(state: dict[str, object]) -> None:
    due_at = next_due_at(state)
    if due_at is not None and due_at > utcnow():
        return
    post_once(state)


def main() -> None:
    state = load_state()
    logging.info(
        "Content writer started: provider=%s interval=%sh total_posts=%s",
        get_provider_name(),
        POST_INTERVAL_HOURS,
        state["posts_count"],
    )

    maybe_post(state)
    schedule.every(1).minutes.do(maybe_post, state=state)

    while True:
        schedule.run_pending()
        time.sleep(5)


if __name__ == "__main__":
    main()
