import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — AgentMarket",
  description: "Как мы обрабатываем ваши персональные данные.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Политика конфиденциальности
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
      </p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. Какие данные мы собираем
          </h2>
          <p>
            Email, имя, аватар (для OAuth-провайдеров), Telegram ID (если вы
            входите через Telegram), конфигурации агентов, которые вы вводите
            в Setup Wizard (API-ключи, токены, настройки).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Как мы храним конфиги агентов
          </h2>
          <p>
            Все конфиги (включая API-ключи) шифруются алгоритмом AES-256-GCM
            на стороне сервера. Ключ шифрования хранится в переменных
            окружения платформы и не попадает в базу данных.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Кому мы передаём данные
          </h2>
          <p>
            Только платёжным провайдерам (YooKassa, Cryptomus) при оформлении
            подписки — в объёме, необходимом для обработки платежа. Третьим
            лицам данные не продаются.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Ваши права
          </h2>
          <p>
            Вы можете запросить удаление аккаунта и всех связанных данных,
            написав нам на support@agentmarket.local.
          </p>
        </section>

        <p className="text-xs italic">
          Этот документ — черновик для ранней версии платформы. Финальная
          редакция будет опубликована к моменту запуска публичного релиза.
        </p>
      </div>
    </div>
  );
}
