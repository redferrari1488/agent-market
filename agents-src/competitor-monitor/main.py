import asyncio
import difflib
import hashlib
import json
import logging
import os
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import httpx
import schedule
from bs4 import BeautifulSoup
from telegram import Bot

from ai_provider import generate, get_provider_name

DATA_DIR = Path("/data")
SNAPSHOTS_DIR = DATA_DIR / "snapshots"
STATE_PATH = DATA_DIR / "state.json"
CHECK_INTERVAL_HOURS = int(os.environ["CHECK_INTERVAL_HOURS"])
URLS = json.loads(os.environ["COMPETITOR_URLS"])
CHAT_ID = os.environ["CHAT_ID"]
BUSINESS_DESC = os.environ["BUSINESS_DESC"].strip()

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
        logging.warning("Invalid ISO8601 value in state: %s", value)
        return None


def validate_urls(raw_urls: Any) -> list[str]:
    if not isinstance(raw_urls, list) or not raw_urls:
        raise ValueError("COMPETITOR_URLS must be a non-empty JSON array")
    if len(raw_urls) > 10:
        raise ValueError("COMPETITOR_URLS supports up to 10 URLs")

    urls: list[str] = []
    for item in raw_urls:
        if not isinstance(item, str) or not item.strip():
            raise ValueError("Each COMPETITOR_URLS item must be a non-empty string")
        urls.append(item.strip())
    return urls


def load_state() -> dict[str, Any]:
    if not STATE_PATH.exists():
        return {"snapshots": {}, "last_report_at": None}

    try:
        data = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        logging.warning("Failed to read state file: %s", error)
        return {"snapshots": {}, "last_report_at": None}

    snapshots = data.get("snapshots")
    if not isinstance(snapshots, dict):
        snapshots = {}

    return {
        "snapshots": snapshots,
        "last_report_at": data.get("last_report_at"),
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


def snapshot_path_for(url: str) -> Path:
    return SNAPSHOTS_DIR / f"{hashlib.sha1(url.encode('utf-8')).hexdigest()}.txt"


def extract_visible_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    return soup.get_text(separator="\n", strip=True)


def fetch_text(client: httpx.Client, url: str) -> str:
    response = client.get(url)
    response.raise_for_status()
    return extract_visible_text(response.text)


def split_message(text: str, limit: int = 4096) -> list[str]:
    if len(text) <= limit:
        return [text]

    chunks: list[str] = []
    remaining = text
    while len(remaining) > limit:
        split_at = remaining.rfind("\n\n", 0, limit)
        if split_at == -1:
            split_at = remaining.rfind("\n", 0, limit)
        if split_at == -1:
            split_at = limit
        chunks.append(remaining[:split_at].strip())
        remaining = remaining[split_at:].strip()

    if remaining:
        chunks.append(remaining)
    return chunks


async def send_message(text: str) -> None:
    async with Bot(token=os.environ["TELEGRAM_BOT_TOKEN"]) as bot:
        await bot.send_message(chat_id=CHAT_ID, text=text)


def send_message_parts(text: str) -> bool:
    try:
        for part in split_message(text):
            asyncio.run(send_message(part))
        return True
    except Exception as error:
        logging.exception("Telegram send failed: %s", error)
        return False


def build_report_prompt(changed_items: list[dict[str, str]]) -> str:
    blocks = []
    for item in changed_items:
        blocks.append(
            f"URL: {item['url']}\n"
            f"Изменения:\n{item['diff']}"
        )
    joined = "\n\n".join(blocks)
    return (
        f"Описание бизнеса клиента:\n{BUSINESS_DESC}\n\n"
        "Ниже изменения на сайтах конкурентов.\n"
        f"{joined}\n\n"
        "Сделай краткий отчёт на русском: что изменилось, что это значит для клиента, 1-2 рекомендации."
    )


def last_check_at(state: dict[str, Any]) -> datetime | None:
    timestamps = []
    for snapshot in state.get("snapshots", {}).values():
        if isinstance(snapshot, dict):
            parsed = parse_iso8601(snapshot.get("last_seen_at"))
            if parsed is not None:
                timestamps.append(parsed)
    return max(timestamps) if timestamps else None


def run_cycle(state: dict[str, Any], urls: list[str]) -> None:
    changed_items: list[dict[str, str]] = []
    first_run = not state["snapshots"]

    logging.info("Running competitor monitor cycle for %s URLs", len(urls))

    with httpx.Client(
        timeout=15.0,
        follow_redirects=True,
        headers={"User-Agent": "AgentMarket CompetitorMonitor/1.0"},
    ) as client:
        for url in urls:
            try:
                new_text = fetch_text(client, url)
            except Exception as error:
                logging.exception("Failed to fetch %s: %s", url, error)
                continue

            file_path = snapshot_path_for(url)
            previous = state["snapshots"].get(url) or {}
            previous_hash = previous.get("text_hash")
            old_text = file_path.read_text(encoding="utf-8") if file_path.exists() else ""
            new_hash = hashlib.sha256(new_text.encode("utf-8")).hexdigest()

            if previous_hash and previous_hash != new_hash:
                diff_text = "\n".join(
                    difflib.unified_diff(
                        old_text.splitlines(),
                        new_text.splitlines(),
                        fromfile="previous",
                        tofile="current",
                        lineterm="",
                    )
                )
                changed_items.append(
                    {
                        "url": url,
                        "diff": diff_text[:4000] or "Изменение найдено, но diff пустой.",
                    }
                )

            write_atomic(file_path, new_text)
            state["snapshots"][url] = {
                "text_hash": new_hash,
                "last_seen_at": utcnow().isoformat(),
            }
            save_state(state)

    if first_run and state["snapshots"]:
        if send_message_parts(f"Мониторинг запущен, отслеживаю {len(state['snapshots'])} URL-ов"):
            state["last_report_at"] = utcnow().isoformat()
            save_state(state)
        return

    if not changed_items:
        logging.info("No competitor page changes detected")
        return

    logging.info("Detected %s changed competitor pages, generating report", len(changed_items))
    try:
        report = generate(
            prompt=build_report_prompt(changed_items),
            system=(
                "Ты аналитик конкурентов. Пиши кратко, по делу и на русском языке. "
                "Не выдумывай факты сверх diff, опирайся только на наблюдаемые изменения."
            ),
            max_tokens=1500,
            temperature=0.4,
        ).strip()
    except Exception as error:
        logging.exception("AI report generation failed: %s", error)
        return

    if not report:
        logging.warning("AI returned an empty report")
        return

    if send_message_parts(report):
        state["last_report_at"] = utcnow().isoformat()
        save_state(state)
        logging.info("Competitor report sent successfully via %s", get_provider_name())


def maybe_run_cycle(state: dict[str, Any], urls: list[str]) -> None:
    checked_at = last_check_at(state)
    if checked_at is not None and checked_at + timedelta(hours=CHECK_INTERVAL_HOURS) > utcnow():
        return
    run_cycle(state, urls)


def main() -> None:
    urls = validate_urls(URLS)
    SNAPSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    state = load_state()

    logging.info(
        "Competitor monitor started: provider=%s interval=%sh urls=%s",
        get_provider_name(),
        CHECK_INTERVAL_HOURS,
        len(urls),
    )

    maybe_run_cycle(state, urls)
    schedule.every(5).minutes.do(maybe_run_cycle, state=state, urls=urls)

    while True:
        schedule.run_pending()
        time.sleep(5)


if __name__ == "__main__":
    main()
