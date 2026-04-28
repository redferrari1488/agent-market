import type { Metadata } from "next";
import { Mail, Send, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Контакты - hireon",
  description: "Контактная информация и реквизиты Исполнителя hireon.",
};

export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">Контакты</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Свяжитесь с нами по любому вопросу.
      </p>

      <div className="mt-10 space-y-6">
        <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">Email</div>
            <a
              href="mailto:hello@hireon.agency"
              className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              hello@hireon.agency
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-border/40 bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-foreground">Telegram</div>
            <a
              href="https://t.me/hireon"
              className="text-[14px] text-muted-foreground transition-colors hover:text-foreground"
            >
              @hireon
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-border/40 bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">
            Реквизиты Исполнителя
          </h2>
        </div>
        <dl className="mt-5 space-y-3 text-[13px]">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">Статус</dt>
            <dd className="text-foreground">
              Самозанятый (плательщик НПД, 422-ФЗ)
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">ФИО</dt>
            <dd className="text-foreground">Родимов Артём Дмитриевич</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">ИНН</dt>
            <dd className="text-foreground">615520487706</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">Город</dt>
            <dd className="text-foreground">Москва, Россия</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">Email для оферты</dt>
            <dd className="text-foreground">hello@hireon.agency</dd>
          </div>
          <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
            <dt className="w-44 shrink-0 text-muted-foreground">Сайт</dt>
            <dd className="text-foreground">https://hireon.agency</dd>
          </div>
        </dl>
        <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
          Чек по налогу на профессиональный доход формируется через приложение
          «Мой налог» ФНС России и направляется Пользователю на email или в
          кабинет в течение 24 часов с момента оплаты.
        </p>
      </div>
    </div>
  );
}
