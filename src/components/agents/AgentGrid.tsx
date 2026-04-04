import { AgentCard, type Agent } from "./AgentCard";

export function AgentGrid({ agents }: { agents: Agent[] }) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16 text-center">
        <p className="text-lg font-medium">Агенты не найдены</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Попробуйте изменить фильтры или поисковый запрос
        </p>
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
