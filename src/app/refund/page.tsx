import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Политика возврата - hireon",
  description:
    "Условия возврата средств за подписки и услуги на платформе hireon.",
};

export default function RefundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Политика возврата средств
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Дата публикации: 28 апреля 2026 г.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            1. Общие условия
          </h2>
          <p>
            1.1. Настоящая Политика регулирует возврат денежных средств за
            услуги, оплаченные Пользователем на платформе hireon, в
            соответствии с Гражданским кодексом РФ и ст. 26.1 Закона РФ
            «О защите прав потребителей».
          </p>
          <p className="mt-2">
            1.2. Исполнитель — самозанятый, плательщик НПД (реквизиты — на
            странице{" "}
            <a href="/contacts" className="text-foreground underline underline-offset-4">
              «Контакты»
            </a>
            ).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            2. Срок подачи заявки
          </h2>
          <p>
            2.1. Заявка на возврат подаётся на email{" "}
            <a
              href="mailto:hello@hireon.agency"
              className="text-foreground underline underline-offset-4"
            >
              hello@hireon.agency
            </a>{" "}
            в течение 14 (четырнадцати) календарных дней с момента оплаты.
          </p>
          <p className="mt-2">
            2.2. В заявке необходимо указать: ФИО, email учётной записи,
            идентификатор платежа (приходит на email после оплаты), причину
            возврата.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            3. Возврат за подписку на AI-агента
          </h2>
          <p>3.1. Возврат производится в полном объёме, если:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              AI-агент не был запущен Пользователем (статус «ожидает
              настройки»),
            </li>
            <li>
              с момента оплаты прошло не более 14 календарных дней.
            </li>
          </ul>
          <p className="mt-2">
            3.2. Если агент был запущен — возврат производится пропорционально
            неиспользованному периоду подписки за вычетом фактически
            оказанных услуг.
          </p>
          <p className="mt-2">
            3.3. Разовая покупка после запуска агента возврату не подлежит,
            кроме случаев технической невозможности предоставить услугу со
            стороны Исполнителя.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            4. Возврат за тариф размещения в каталоге
          </h2>
          <p>
            4.1. Тарифы Pro и Featured (для сторонних разработчиков)
            возвращаются пропорционально неиспользованному периоду подписки
            на момент подачи заявки.
          </p>
          <p className="mt-2">
            4.2. Удалённые модератором карточки агентов не дают права на
            возврат, если удаление произведено по причине нарушения условий
            Оферты.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            5. Случаи отказа в возврате
          </h2>
          <p>5.1. Возврат не производится при:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              нарушении Пользователем условий Публичной оферты (рассылка
              спама, мошенничество, незаконное использование);
            </li>
            <li>
              истечении срока 14 календарных дней с момента оплаты, если
              иное не предусмотрено законодательством РФ;
            </li>
            <li>
              использовании агента в полном объёме до подачи заявки.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            6. Срок и способ возврата
          </h2>
          <p>
            6.1. Решение по заявке принимается Исполнителем в течение 10
            рабочих дней с момента её получения.
          </p>
          <p className="mt-2">
            6.2. Возврат производится тем же способом, которым была произведена
            оплата (на банковскую карту, с которой поступил платёж). Срок
            зачисления средств — до 30 рабочих дней (определяется
            эмитентом карты).
          </p>
          <p className="mt-2">
            6.3. При возврате формируется аннулирующий чек НПД через
            приложение «Мой налог» ФНС России.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            7. Сторонние разработчики
          </h2>
          <p>
            7.1. Сделки между сторонними разработчиками и Покупателями
            заключаются вне Сервиса. Исполнитель не выступает стороной таких
            сделок и не производит по ним возвраты.
          </p>
          <p className="mt-2">
            7.2. Споры о возврате средств за продукты сторонних разработчиков
            разрешаются между разработчиком и Покупателем самостоятельно.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground">
            8. Контакты для возврата
          </h2>
          <p>
            8.1. Email:{" "}
            <a
              href="mailto:hello@hireon.agency"
              className="text-foreground underline underline-offset-4"
            >
              hello@hireon.agency
            </a>
          </p>
          <p className="mt-2">
            8.2. Telegram:{" "}
            <a
              href="https://t.me/hireon"
              className="text-foreground underline underline-offset-4"
            >
              @hireon
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
