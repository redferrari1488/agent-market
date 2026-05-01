import { ArrowUpRight } from "lucide-react";

export function ExternalAgentCTA({
  externalUrl,
  sellerName,
}: {
  externalUrl: string | null;
  sellerName: string | null;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
        От продавца
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">
        Этот агент размещён сторонним разработчиком{sellerName ? ` (${sellerName})` : ""}.
        Покупка и оплата — на стороне продавца, вне Hireon.
      </p>

      {externalUrl ? (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-[14px] font-medium text-background transition-opacity hover:opacity-90"
        >
          Перейти к продавцу
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-border/60 px-3.5 py-3 text-center text-[12px] text-muted-foreground">
          Свяжитесь с продавцом напрямую
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Hireon не выступает стороной сделки и не принимает платежи за этого агента.
        Вопросы возврата и качества — у разработчика.
      </p>
    </div>
  );
}
