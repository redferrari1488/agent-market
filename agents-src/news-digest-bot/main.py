import asyncio
import calendar
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import feedparser
import schedule
from telegram import Bot

from ai_provider import generate, get_provider_name

DATA_DIR = Path("/data")
STATE_PATH = DATA_DIR / "state.json"
FETCH_INTERVAL_MINUTES = int(os.environ["FETCH_INTERVAL_MINUTES"])
MAX_POSTS_PER_CYCLE = int(os.environ["MAX_POSTS_PER_CYCLE"])
CHANNEL_ID = os.environ["CHANNEL_ID"]
TONE = os.environ["TONE"].strip()
RSS_FEEDS = json.loads(os.environ["RSS_FEEDS"])

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
        logging.warning("Invalid last_fetch_at in state: %s", value)
        return None


def validate_feeds(raw_feeds: Any) -> list[str]:
    if not isinstance(raw_feeds, list) or not raw_feeds:
        raise ValueError("RSS_FEEDS must be a non-empty JSON array")
    if len(raw_feeds) > 10:
        raise ValueError("RSS_FEEDS supports up to 10 feeds")

    feeds: list[str] = []
    for item in raw_feeds:
        if not isinstance(item, str) or not item.strip():
            raise ValueError("Each RSS_FEEDS item must be a non-empty string")
        feeds.append(item.strip())
    return feeds


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"seen_ids": [], "last_fetch_at": None}

    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logging.warning("Failed to read state file: %s", error)
        return {"seen_ids": [], "last_fetch_at": None}

    seen_ids = data.get("seen_ids")
    if not isinstance(seen_ids, list):
        seen_ids = []

    return {
        "seen_ids": [str(item) for item in seen_ids][-500:],
        "last_fetch_at": data.get("last_fetch_at"),
    }


def save_state(state: dict[str, Any]) -> None:
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


def send_message_sync(text: str) -> bool:
    try:
        asyncio.run(send_message(text))
        return True
    except Exception as error:
        logging.exception("Telegram send failed: %s", error)
        return False


def entry_identity(entry: Any) -> str | None:
    entry_id = entry.get("id") or entry.get("link")
    if entry_id:
        return str(entry_id)
    return None


def entry_timestamp(entry: Any) -> int:
    parsed = entry.get("published_parsed") or entry.get("updated_parsed")
    if parsed is None:
        return 0
    return calendar.timegm(parsed)


def trim_seen_ids(state: dict[str, Any]) -> None:
    state["seen_ids"] = state["seen_ids"][-500:]


def rewrite_entry(entry: Any) -> str:
    prompt = f"{entry.get('title', '')}\n\n{entry.get('summary', '')}".strip()
    return generate(
        prompt=prompt,
        system=(
            f"Перепиши новость в тоне: {TONE}. "
            "Коротко, 2-4 предложения. Без ссылок в тексте - ссылка будет отдельно."
        ),
        max_tokens=300,
        temperature=0.7,
    ).strip()


def run_cycle(state: dict[str, Any], feeds: list[str]) -> None:
    seen_ids = set(state["seen_ids"])
    new_entries: list[tuple[int, str, Any]] = []
    activation_ids: list[str] = []
    parsed_any_feed = False

    for feed_url in feeds:
        try:
            parsed = feedparser.parse(feed_url)
        except Exception as error:
            logging.exception("Failed to parse feed %s: %s", feed_url, error)
            continue

        if getattr(parsed, "bozo", False):
            logging.warning("Feed %s returned a parse warning: %s", feed_url, parsed.bozo_exception)

        parsed_any_feed = True
        for entry in parsed.entries:
            identifier = entry_identity(entry)
            if not identifier:
                continue
            if state["last_fetch_at"] is None:
                activation_ids.append(identifier)
                continue
            if identifier in seen_ids:
                continue
            new_entries.append((entry_timestamp(entry), identifier, entry))

    now_iso = utcnow().isoformat()

    if not parsed_any_feed:
        logging.warning("No RSS feeds were parsed successfully in this cycle")
        return

    if state["last_fetch_at"] is None:
        if activation_ids:
            state["seen_ids"].extend(activation_ids)
            trim_seen_ids(state)
        if parsed_any_feed and send_message_sync("Дайджест активирован, следующий пост при появлении новостей"):
            logging.info("News digest activated with %s baseline entries", len(activation_ids))
        state["last_fetch_at"] = now_iso
        save_state(state)
        return

    if not new_entries:
        logging.info("No new feed entries found")
        state["last_fetch_at"] = now_iso
        save_state(state)
        return

    posted_count = 0
    for _, identifier, entry in sorted(new_entries, key=lambda item: item[0])[:MAX_POSTS_PER_CYCLE]:
        try:
            rewritten = rewrite_entry(entry)
        except Exception as error:
            logging.exception("AI rewrite failed for %s: %s", identifier, error)
            continue

        if not rewritten:
            logging.warning("AI returned an empty rewrite for %s", identifier)
            continue

        message = f"{rewritten}\n\n{entry.get('link', '')}".strip()
        if not send_message_sync(message):
            continue

        state["seen_ids"].append(identifier)
        trim_seen_ids(state)
        posted_count += 1
        state["last_fetch_at"] = utcnow().isoformat()
        save_state(state)

    if posted_count == 0:
        state["last_fetch_at"] = now_iso
        save_state(state)
        logging.info("No new entries were posted this cycle")
        return

    logging.info("Posted %s rewritten news items via %s", posted_count, get_provider_name())


def maybe_run_cycle(state: dict[str, Any], feeds: list[str]) -> None:
    last_fetch_at = parse_iso8601(state.get("last_fetch_at"))
    if last_fetch_at is not None and last_fetch_at + timedelta(minutes=FETCH_INTERVAL_MINUTES) > utcnow():
        return
    run_cycle(state, feeds)


def main() -> None:
    feeds = validate_feeds(RSS_FEEDS)
    state = load_state()

    logging.info(
        "News digest started: provider=%s interval=%sm feeds=%s",
        get_provider_name(),
        FETCH_INTERVAL_MINUTES,
        len(feeds),
    )

    maybe_run_cycle(state, feeds)
    schedule.every(1).minutes.do(maybe_run_cycle, state=state, feeds=feeds)

    while True:
        schedule.run_pending()
        time.sleep(5)


if __name__ == "__main__":
    main()
