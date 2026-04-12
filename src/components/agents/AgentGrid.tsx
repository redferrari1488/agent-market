"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { AgentCard, type Agent } from "./AgentCard";
import { StaggerList, StaggerItem } from "@/components/motion";

export function AgentGrid({
  agents,
  animated = false,
}: {
  agents: Agent[];
  animated?: boolean;
}) {
  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 p-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-muted-foreground">
          <SearchX className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold">Агенты не найдены</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Попробуйте изменить фильтры или поисковый запрос
        </p>
        <Link
          href="/agents"
          className="mt-5 inline-flex h-9 items-center rounded-lg border border-border px-4 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          Сбросить фильтры
        </Link>
      </div>
    );
  }

  if (animated) {
    return (
      <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <StaggerItem key={agent.id}>
            <AgentCard agent={agent} />
          </StaggerItem>
        ))}
      </StaggerList>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
