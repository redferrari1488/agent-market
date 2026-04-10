import Link from "next/link";
import { SearchX } from "lucide-react";
import { AgentCard, type Agent } from "./AgentCard";

export function AgentGrid({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-14 text-center backdrop-blur-sm">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-60 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="relative">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            <SearchX className="h-7 w-7" />
          </div>
          <h3 className="mt-5 text-lg font-bold">Агенты не найдены</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Попробуйте изменить фильтры или поисковый запрос
          </p>
          <Link
            href="/agents"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full border border-border/50 bg-white/5 px-5 text-sm font-medium backdrop-blur-sm transition-all hover:border-violet-500/30 hover:bg-white/10"
          >
            Сбросить фильтры
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent, i) => (
        <AgentCard key={agent.id} agent={agent} index={i} />
      ))}
    </div>
  );
}
