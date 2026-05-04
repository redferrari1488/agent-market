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
from typing import Optional

PROVIDER = os.environ.get("AI_PROVIDER", "claude").lower()

DEFAULT_MODELS = {
    "claude": "anthropic/claude-sonnet-4.6",
    "openai": "openai/gpt-5-mini",
}


def generate(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    model: Optional[str] = None,
) -> str:
    """Единая точка входа. Шлёт чат-комплит через OpenRouter."""
    from openai import OpenAI

    client = OpenAI(
        api_key=os.environ["OPENAI_API_KEY"],
        base_url=os.environ.get("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
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

    response = client.chat.completions.create(
        model=chosen_model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content


def get_provider_name() -> str:
    return "OpenAI" if PROVIDER == "openai" else "Claude"
