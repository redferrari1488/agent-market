"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { AgentCard, type Agent } from "./AgentCard";
import { StaggerList, StaggerItem } from "@/components/motion";

export function AgentGrid({
  agents,
  animated = false,
  cols = 3,
  emptyHref = "/agents",
}: {
  agents: Agent[];
  animated?: boolean;
  cols?: 2 | 3 | 4;
  emptyHref?: string;
}) {
  if (agents.length === 0) {
    return (
      <div className="rounded-[2px] border border-dashed border-border/40 p-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[2px] border border-border/40 text-muted-foreground">
          <SearchX className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold">Агенты не найдены</h3>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Попробуйте изменить фильтры или поисковый запрос
        </p>
        <Link
          href={emptyHref}
          className="mt-5 inline-flex h-9 items-center rounded-[2px] border border-border/60 px-4 font-mono text-[11px] tracking-[0.04em] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
        >
          сбросить фильтры
        </Link>
      </div>
    );
  }

  const colsClass =
    cols === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : cols === 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  if (animated) {
    return (
      <StaggerList className={`grid gap-2.5 sm:gap-3 ${colsClass}`}>
        {agents.map((agent) => (
          <StaggerItem key={agent.id} className="h-full">
            <AgentCard agent={agent} />
          </StaggerItem>
        ))}
      </StaggerList>
    );
  }

  return (
    <div className={`grid gap-2.5 sm:gap-3 ${colsClass}`}>
      {agents.map((agent, i) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          index={i}
          highlight={agent._score || 0}
        />
      ))}
    </div>
  );
}
