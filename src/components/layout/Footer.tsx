import Link from "next/link";
import { Bot } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Бренд */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-500">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">AgentMarket</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Маркетплейс готовых AI-агентов. Выбери, подключи, работает.
            </p>
          </div>

          {/* Платформа */}
          <div>
            <h3 className="text-sm font-semibold">Платформа</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/agents" className="text-sm text-muted-foreground hover:text-foreground">
                  Каталог агентов
                </Link>
              </li>
              <li>
                <Link href="/agents?category=support" className="text-sm text-muted-foreground hover:text-foreground">
                  Поддержка
                </Link>
              </li>
              <li>
                <Link href="/agents?category=content" className="text-sm text-muted-foreground hover:text-foreground">
                  Контент
                </Link>
              </li>
              <li>
                <Link href="/agents?category=monitoring" className="text-sm text-muted-foreground hover:text-foreground">
                  Мониторинг
                </Link>
              </li>
            </ul>
          </div>

          {/* Для продавцов */}
          <div>
            <h3 className="text-sm font-semibold">Для продавцов</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/seller" className="text-sm text-muted-foreground hover:text-foreground">
                  Стать продавцом
                </Link>
              </li>
              <li>
                <Link href="/seller/agents/new" className="text-sm text-muted-foreground hover:text-foreground">
                  Опубликовать агента
                </Link>
              </li>
            </ul>
          </div>

          {/* Информация */}
          <div>
            <h3 className="text-sm font-semibold">Информация</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  О нас
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  Политика конфиденциальности
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                  Условия использования
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border/50 pt-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} AgentMarket. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
