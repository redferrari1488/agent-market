# Rollback runbook — hireon.agency

**Релиз 2026-05-20.** Открывай этот файл в момент инцидента, проходи по сценарию сверху вниз. Не импровизируй.

VPS: `ssh aimbot-public` (alias). Репозиторий на VPS: `/opt/agent-market`.

---

## 0. Сначала диагностика (1 мин)

```bash
ssh aimbot-public 'cd /opt/agent-market && docker compose ps && echo --- && docker compose logs --tail=50 app'
curl -sS -w "\nHTTP %{http_code}\n" https://hireon.agency/api/health
```

Если health отдаёт 200 + контейнер `Up` → проблема НЕ в нашем коде/инфре, ищи в провайдере (см. §5).
Если 5xx / контейнер `Restarting` / лог в красном → переходи к §1/§2/§3 в зависимости от причины.

---

## 1. Приложение в плохом состоянии (контейнер крутится, но запросы падают)

Самый дешёвый сценарий — рестарт без отката кода:

```bash
ssh aimbot-public 'cd /opt/agent-market && docker compose restart app && sleep 5 && docker compose logs --tail=30 app'
```

Если поднялось — наблюдаем 15 минут. Если опять упало — §2.

---

## 2. Новый код сломал прод (git revert + redeploy)

Найди последний рабочий коммит:

```bash
ssh aimbot-public 'cd /opt/agent-market && git log --oneline -10'
```

Релиз 2026-05-20 идёт с `b1943a0`. Если этот коммит сломал — `git revert` до `0ab77f0` (последний security-baseline без httpx pin). Если security pack целиком плох — откат до `0575d10` (handoff pre-launch HEAD).

```bash
# Локально:
git revert --no-edit <bad-commit>           # для одного коммита
git revert --no-edit <newest>..<oldest>     # для диапазона (revert range)
git push

# На VPS:
ssh aimbot-public 'cd /opt/agent-market && git pull && docker compose up -d --build app'
```

Проверка после: `curl https://hireon.agency/api/health` → 200, `docker compose logs --tail=50 app` → без exceptions.

---

## 3. Миграция сломала схему (обратный SQL + git revert)

Релиз 2026-05-20 содержит **2 миграции**, обе идемпотентные:

- `db/migrations/2026-05-19_security_hardening.sql` — индексы + CHECK-констрейнты
- `db/migrations/2026-05-19_subscriptions_payment_id_unique.sql` — partial unique на provider_payment_id

Обратный SQL применяй ВРУЧНУЮ только если уверен, что миграция причина:

```sql
-- 2026-05-19_security_hardening.sql REVERSE
DROP INDEX IF EXISTS idx_subscriptions_expires_status;
DROP INDEX IF EXISTS idx_subscriptions_user_id;
DROP INDEX IF EXISTS idx_payouts_subscription_id;
DROP INDEX IF EXISTS uq_payouts_sub_transfer;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_amount_nonneg;
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_seller_price_nonneg;
ALTER TABLE payouts DROP CONSTRAINT IF EXISTS payouts_amount_nonneg;
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_price_monthly_nonneg;
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_price_onetime_nonneg;

-- 2026-05-19_subscriptions_payment_id_unique.sql REVERSE
DROP INDEX IF EXISTS uq_subscriptions_provider_payment_id;
```

Применить на проде:

```bash
ssh aimbot-public 'cd /opt/agent-market && docker compose exec -T postgres psql -U agentmarket -d agentmarket' < /path/to/reverse.sql
```

После — `git revert` коммитов с миграциями (`a5ca1dc`, `7abf588`) + redeploy.

**ВАЖНО:** unique constraint снимать БЕЗОПАСНО только если в `subscriptions.provider_payment_id` нет дубликатов. Проверка:

```sql
SELECT provider_payment_id, COUNT(*) FROM subscriptions
WHERE provider_payment_id IS NOT NULL GROUP BY 1 HAVING COUNT(*) > 1;
```

Пусто → снимать можно. Не пусто → НЕ снимай unique, ищи root cause дублей.

---

## 4. Полный откат до handoff-state (катастрофа)

Если нет времени разбираться и надо вернуть прод в состояние 2026-05-19 noon:

```bash
git revert --no-edit 0575d10..b1943a0     # реверт всех 8 security-коммитов
git push

# Применить обратные SQL обеих миграций (см. §3)

ssh aimbot-public 'cd /opt/agent-market && git pull && docker compose up -d --build app'
```

Это вернёт код к `0575d10`, но без security fixes. Только в катастрофе и не дольше часа.

---

## 5. Провайдер платежей лежит

Симптом: webhook'и идут, но `provider.handleWebhook` бросает / возвращает 503.

**YooKassa:** support@yookassa.ru, чат в кабинете https://yookassa.ru/my, статус https://status.yookassa.ru. ID магазина из `.env` (`YOOKASSA_SHOP_ID`).

**NowPayments:** support@nowpayments.io, статус https://status.nowpayments.io.

Если провайдер в дауне >15 мин — временно отключить флоу:

```bash
# В .env на VPS:
YOOKASSA_IP_CHECK=off   # уже выключаемо для теста
# Или дернуть env-флаг чтобы провайдер не отдавал getProvider — но проще
# показать пользователю статусный баннер. См. M15 в audit.
```

Пользователи увидят "временно недоступно" на checkout. Не критично — приоритет починить webhook'и, не блокировать catalog.

---

## 6. После любого rollback

1. Алёрт в @hireon_bot должен утихнуть (если не утих — `alerter` не работает, см. § "Alerter диагностика" ниже).
2. `curl https://hireon.agency/api/health` → 200.
3. Зайти на главную, проверить навигацию.
4. Если был платежный инцидент — проверить `subscriptions` за последний час, отметить affected пользователей в TG для ручного возврата.
5. **Post-mortem:** записать в `lessons.md` причину и что добавить в смоук-тесты, чтобы не повторилось.

---

## Alerter диагностика (если TG-алерты не приходят)

```bash
ssh aimbot-public 'cd /opt/agent-market && docker compose exec -T app node -e "
const t = process.env.TELEGRAM_BOT_TOKEN, c = process.env.TELEGRAM_ADMIN_CHAT_ID;
fetch(\"https://api.telegram.org/bot\" + t + \"/sendMessage\", {
  method: \"POST\", headers: {\"Content-Type\":\"application/json\"},
  body: JSON.stringify({chat_id: c, text: \"[ALERT] manual diag\"})
}).then(r => r.json()).then(j => console.log(JSON.stringify(j)))"'
```

Должен вернуть `{"ok":true,...}`. Если `{"ok":false,"description":"..."}` — token/chat_id из env неправильные либо бот не был запущен пользователем (`/start`).
