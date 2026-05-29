#!/usr/bin/env python3
"""Пробник качества content-writer — БЕЗ Docker и БЕЗ Telegram.

Тем же промптом, что и боевой main.py (build_prompts), дёргает OpenRouter и
печатает готовые посты в терминал. Нужен только python3 и OpenRouter-ключ.
Зависимостей нет (urllib), поэтому запускается на голом python где угодно.

Конфиг через ENV (имена совпадают с агентом):
  OPENAI_API_KEY / OPENROUTER_API_KEY  — ключ OpenRouter
  OPENAI_BASE_URL  — дефолт https://openrouter.ai/api/v1
  AI_MODEL         — дефолт anthropic/claude-haiku-4-5 (как в прод env_template)
  TOPIC TONE CONTENT_PILLARS EXAMPLES AUDIENCE FORMAT_RULES AVOID
  POST_COUNT       — сколько постов сгенерить (дефолт 3)
  EXAMPLES_OFF=1   — принудительно убрать примеры (для сравнения «с/без»)
  SEED             — фикс рандома углов подачи, чтобы конфиги были сравнимы

Если EXAMPLES не задан — берутся демо-примеры ниже, чтобы сразу было видно работу.
"""
import json
import os
import random
import sys
import urllib.request

# ── демо-дефолты (ниша = дефолт агента «малый бизнес»); переопредели через ENV ──
SAMPLE_TOPIC = "Практические советы для малого бизнеса"
SAMPLE_TONE = "дружелюбно, уверенно, с лёгким юмором"
SAMPLE_PILLARS = "разбор частых ошибок\nполезные инструменты\nкейсы клиентов"
SAMPLE_EXAMPLES = """Заметили, что клиенты пропадают после первого сообщения? В 8 из 10 случаев дело не в цене, а в скорости ответа. Отвечаете за 5 минут — сделка ваша. Отвечаете через час — клиент уже у конкурента.

Маленький лайфхак для тех, кто тонет в задачах: правило одной строки. В конце дня пишите одну задачу на завтра, которая сдвинет дело сильнее всего. Не десять. Одну. Остальное — фон."""

# ── конфиг из ENV ──────────────────────────────────────────────────────────
TOPIC = os.environ.get("TOPIC", SAMPLE_TOPIC).strip()
TONE = os.environ.get("TONE", SAMPLE_TONE).strip()
AUDIENCE = os.environ.get("AUDIENCE", "").strip()
FORMAT_RULES = os.environ.get("FORMAT_RULES", "").strip()
AVOID = os.environ.get("AVOID", "").strip()
EXAMPLES = "" if os.environ.get("EXAMPLES_OFF") else os.environ.get("EXAMPLES", SAMPLE_EXAMPLES).strip()
POST_COUNT = int(os.environ.get("POST_COUNT", "3"))

BASE = os.environ.get("OPENAI_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
KEY = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPENROUTER_API_KEY") or ""
MODEL = os.environ.get("AI_MODEL") or "anthropic/claude-haiku-4-5"

random.seed(int(os.environ.get("SEED", "0")))

# ── копия логики из main.py (держать в синхроне при правках промпта) ─────────
ANGLES = ["живой факт", "вопрос к аудитории", "короткая история", "практический совет"]


def parse_pillars(raw):
    raw = raw.strip()
    if not raw:
        return []
    items = [line.strip(" -•\t") for line in raw.splitlines()]
    items = [i for i in items if i]
    if len(items) == 1 and "," in items[0]:
        items = [p.strip() for p in items[0].split(",") if p.strip()]
    return items


PILLARS = parse_pillars(os.environ.get("CONTENT_PILLARS", SAMPLE_PILLARS))


def build_prompts(pillar):
    parts = [
        "Ты — редактор Telegram-канала. Пишешь готовые к публикации посты на русском.",
        "Ниша канала: %s." % TOPIC,
        "Тон голоса: %s." % TONE,
    ]
    if AUDIENCE:
        parts.append("Аудитория: %s." % AUDIENCE)
    if FORMAT_RULES:
        parts.append("Правила формата: %s." % FORMAT_RULES)
    if AVOID:
        parts.append("Избегай и не пиши про: %s." % AVOID)
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
        "Напиши пост на тему: %s.\n"
        "Угол подачи: %s.\n"
        "Объём: 4-8 коротких абзацев." % (pillar, angle)
    )
    return system_prompt, user_prompt


def generate(system, user, max_tokens=800, temperature=0.9):
    body = json.dumps({
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }).encode("utf-8")
    req = urllib.request.Request(
        BASE + "/chat/completions",
        data=body,
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"].strip()


def main():
    if not KEY:
        sys.exit("✗ Нет ключа: задай OPENAI_API_KEY или OPENROUTER_API_KEY")
    line = "═" * 60
    print(line)
    print("МОДЕЛЬ: %s   |   примеры (EXAMPLES): %s   |   постов: %d"
          % (MODEL, "ДА" if EXAMPLES else "НЕТ", POST_COUNT))
    print(line)
    pillars = PILLARS or [TOPIC]
    for i in range(POST_COUNT):
        pillar = pillars[i % len(pillars)]
        system, user = build_prompts(pillar)
        try:
            post = generate(system, user)
        except Exception as e:  # noqa: BLE001
            post = "[ошибка генерации: %s]" % e
        print("\n● пост %d/%d · рубрика: %s\n%s" % (i + 1, POST_COUNT, pillar, "─" * 40))
        print(post)
    print("\n" + line)


if __name__ == "__main__":
    main()
