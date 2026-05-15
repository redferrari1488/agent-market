"""
E2E echo-агент. Делает один AI-запрос через OpenRouter, печатает
результат и спит, пока контейнер не остановят.

Только для проверки полного flow «оплата → контейнер → AI-ответ».
"""

import time
import traceback

from ai_provider import generate, get_provider_name


def main() -> None:
    print(f"[echo-agent] старт, провайдер {get_provider_name()}", flush=True)

    try:
        answer = generate(
            prompt="Поприветствуй покупателя hireon одним коротким предложением.",
            system="Ты тестовый агент маркетплейса. Отвечай по-русски, не более 20 слов.",
            max_tokens=80,
            temperature=0.4,
        )
        print(f"[echo-agent] AI-ответ: {answer}", flush=True)
    except Exception as err:
        print(f"[echo-agent] AI вызов упал: {err}", flush=True)
        traceback.print_exc()

    print("[echo-agent] готово, контейнер остаётся живым", flush=True)
    while True:
        time.sleep(3600)


if __name__ == "__main__":
    main()
