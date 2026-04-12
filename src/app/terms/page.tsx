import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Условия использования - AgentMarket",
  description: "Правила использования платформы AgentMarket.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Условия использования</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Последнее обновление: {new Date().toLocaleDateString("ru-RU")}
      </p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. Что такое AgentMarket
          </h2>
          <p>
            AgentMarket - маркетплейс AI-агентов. Мы предоставляем
            инфраструктуру для запуска агентов и
            принимаем платежи от покупателей в пользу продавцов.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Подписки и оплата
          </h2>
          <p>
            Агенты продаются по модели подписки или разовой покупки.
            Платформа удерживает комиссию 15% с каждой транзакции. Остальные
            85% перечисляются продавцу. Оплата возможна через YooKassa (₽)
            или Cryptomus (крипта).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Возвраты
          </h2>
          <p>
            Возврат возможен в течение 14 дней с момента оплаты, если агент
            не был настроен и запущен (статус pending_setup). После запуска
            агента возврат обсуждается индивидуально.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Ответственность
          </h2>
          <p>
            Платформа не несёт ответственности за действия агентов, настроенных
            покупателем. Покупатель сам отвечает за соответствие использования
            агента законам своей страны (включая модерацию контента, спам и
            обработку персональных данных).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            5. Запрещено
          </h2>
          <p>
            Использовать агентов для рассылки спама, мошенничества,
            автоматизации незаконных действий. Нарушение ведёт к блокировке
            аккаунта без возврата средств.
          </p>
        </section>

        <p className="text-xs italic">
          Этот документ - черновик для ранней версии платформы. Финальная
          редакция будет опубликована к моменту запуска публичного релиза.
        </p>
      </div>
    </div>
  );
}
