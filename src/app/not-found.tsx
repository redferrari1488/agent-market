import Link from "next/link";
import { Bot } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Bot className="h-12 w-12 text-muted-foreground" />
      <h1 className="mt-6 text-3xl font-bold">404</h1>
      <p className="mt-2 text-muted-foreground">
        Страница не найдена
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-bold text-white hover:opacity-90"
      >
        На главную
      </Link>
    </div>
  );
}
