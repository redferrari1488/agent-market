import type { Metadata } from "next";
import { Mail, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Контакты - hireon",
  description: "Свяжитесь с командой hireon.",
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
            <a href="mailto:hello@hireon.agency" className="text-[14px] text-muted-foreground transition-colors hover:text-foreground">
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
            <a href="https://t.me/hireon" className="text-[14px] text-muted-foreground transition-colors hover:text-foreground">
              @hireon
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
