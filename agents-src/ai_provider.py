"""
Универсальный AI-провайдер для агентов маркетплейса.
Через OpenRouter (OpenAI-совместимый), единый клиент.

ENV:
  OPENAI_API_KEY  — платформенный ключ OpenRouter (подкидывается src/lib/docker.ts)
  OPENAI_BASE_URL — дефолт https://openrouter.ai/api/v1
  AI_PROVIDER     — claude | openai (выбирает дефолтную модель)
  AI_MODEL        — опц. переопределяет модель (полный путь OpenRouter)
"""

import os
import time
from typing import Optional

PROVIDER = os.environ.get("AI_PROVIDER", "claude").lower()

DEFAULT_MODELS = {
    "claude": "anthropic/claude-sonnet-4-6",
    "openai": "openai/gpt-5-mini",
}

# Дефолтный timeout на один HTTP-запрос к OpenRouter. Не подвисаем дольше,
# даже если апстрим висит. Контейнеры агентов не должны блокироваться навечно.
REQUEST_TIMEOUT_SECONDS = 30.0
# Максимум попыток на transient-ошибки (429, 5xx, network). 3 = 1+2 retry.
MAX_ATTEMPTS = 3


def generate(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    model: Optional[str] = None,
) -> str:
    """Шлёт чат-комплит через OpenRouter с retry на transient-ошибках."""
    from openai import OpenAI
    from openai import APIConnectionError, APITimeoutError, APIStatusError, RateLimitError

    client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ.get("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
        timeout=REQUEST_TIMEOUT_SECONDS,
    )

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    chosen_model = (
        model
        or os.environ.get("AI_MODEL")
        or DEFAULT_MODELS.get(PROVIDER, DEFAULT_MODELS["claude"])
    )

    last_error: Optional[Exception] = None
    for attempt in range(MAX_ATTEMPTS):
        try:
            response = client.chat.completions.create(
                model=chosen_model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except (APIConnectionError, APITimeoutError, RateLimitError) as e:
            # transient: network/timeout/429 — retry с экспоненциальным backoff.
            last_error = e
        except APIStatusError as e:
            # 5xx и 402 (insufficient credits) — retry. 4xx остальное — fail fast.
            status = getattr(e, "status_code", None) or 0
            if status >= 500 or status == 402:
                last_error = e
            else:
                raise
        if attempt < MAX_ATTEMPTS - 1:
            time.sleep(2 ** attempt)  # 1s, 2s

    assert last_error is not None
    raise last_error


def get_provider_name() -> str:
    return "OpenAI" if PROVIDER == "openai" else "Claude"
