"""
Универсальный AI-провайдер для всех агентов маркетплейса.
Переключается между Claude и OpenAI через переменную окружения AI_PROVIDER.
"""

import os
from typing import Optional

PROVIDER = os.environ.get("AI_PROVIDER", "claude").lower()


def _call_claude(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    model: Optional[str] = None,
) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    kwargs = {
        "model": model or os.environ.get("CLAUDE_MODEL", "claude-haiku-4-5"),
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [{"role": "user", "content": prompt}],
    }
    if system:
        kwargs["system"] = system

    response = client.messages.create(**kwargs)
    return response.content[0].text


def _call_openai(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    model: Optional[str] = None,
) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model=model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    return response.choices[0].message.content


def generate(
    prompt: str,
    system: str = "",
    max_tokens: int = 1024,
    temperature: float = 0.7,
    model: Optional[str] = None,
) -> str:
    """Единая точка входа. Провайдер определяется ENV AI_PROVIDER."""
    if PROVIDER == "openai":
        return _call_openai(prompt, system, max_tokens, temperature, model)
    return _call_claude(prompt, system, max_tokens, temperature, model)


def get_provider_name() -> str:
    return "OpenAI" if PROVIDER == "openai" else "Claude"
