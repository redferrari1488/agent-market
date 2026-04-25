# Промпт для следующей сессии (вечер 2026-04-25)

> Скопируй в новый чат целиком.

---

Привет. Продолжаем с прошлой сессии. Контекст коротко:

**Что было сделано до тебя:**
1. Решили: hero-фон на главной — это `<video autoplay muted loop>` с loop'ом из Google Veo (как у lock-in.agency). Шейдеры не делаем — пробовали 3 раза в `output/hero-shader-mockup/`, всё мимо стиля.
2. Veo-промпт готов в `output/branding/veo-prompt.md` — палитра deep navy / electric blue / cyan / violet.
3. Сделано 4 SVG-варианта лого (в `output/branding/logo-*.svg`) + превью `output/branding/preview.html` с lockup'ами на разных фонах.
4. todo.md обновлён — секция «SESSION 2026-04-25» содержит весь план.

**Что у меня есть к тебе:**
- (вариант 1) Готовый MP4 от Veo — кладу в `public/hero-bg.mp4`. Нужно интегрировать в hero, удалить `HeroBlobCanvas` и `HeroDashboardMock`, добавить webm+poster, поддержать `prefers-reduced-motion`.
- (вариант 2) Выбранный вариант лого — A / B / C / D (см. `output/branding/preview.html`). Нужно прогнать через https://3dsvg.design/ и встроить интерактивный 3D-знак в Header / hero.
- (вариант 3) Я ещё не сгенерил Veo / не прогнал лого через 3dsvg.design — спроси что блокирует.

**Дополнительно в очереди (см. todo.md):**
- Settings cleanup — убрать `/dashboard/settings` из навигации, перенести `DeleteAccountCard` (вариант A или B — ещё не решили).
- Onboarding copy — `/seller/onboarding`: Cryptomus первой как «быстрый старт без оформления», убрать жёлтую плашку «Setup payouts» с `/seller`.
- Минор: hardcode `RUB` в `src/lib/payments/cryptomus.ts:90`, rename `cryptmusWalletAddress` → `cryptomusWalletAddress`.

**Прочти первым делом:**
- `todo.md` секция «SESSION 2026-04-25»
- `output/branding/veo-prompt.md`
- `output/branding/preview.html` (открой в браузере — там все варианты лого)

Дальше действуй по моему вводу. Не лезь в `CLAUDE.md`, `instructions/`, корневые файлы без согласования. Не пушь в git без явного «push».
