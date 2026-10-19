import { FilterChip } from "@/components/ui/filter-chips";
import { FILTER_GROUPS, type UserFilters, type UserState } from "@/lib/admin-users";
import { initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, active, size = "sm" }: { name: string; active: boolean; size?: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full bg-foreground/[0.07] font-semibold flex items-center justify-center",
        size === "lg" ? "size-12 text-[15px]" : "size-8 text-[11.5px]",
        active ? "text-accent-text" : "text-zinc-600",
      )}
    >
      {initialsOf(name)}
    </span>
  );
}

const BADGE_TONE = {
  neutral: "bg-foreground/[0.07] text-zinc-400 ring-1 ring-inset ring-foreground/[0.08]",
  accent: "bg-accent/20 text-accent-text",
  warn: "bg-warning/10 text-warning",
} as const;

function Badge({ tone = "neutral", children }: { tone?: keyof typeof BADGE_TONE; children: string }) {
  return (
    <span className={cn("shrink-0 h-[18px] px-1.5 rounded text-[10.5px] font-medium flex items-center", BADGE_TONE[tone])}>
      {children}
    </span>
  );
}

/** Selos ao lado do nome. `admin` só no detalhe: na lista o papel tem coluna própria. */
export function UserBadges({ state, isMe, admin }: { state: UserState; isMe: boolean; admin?: boolean }) {
  return (
    <>
      {admin && <Badge tone="accent">admin</Badge>}
      {isMe && <Badge>você</Badge>}
      {!state.active && <Badge>inativo</Badge>}
      {state.locked && <Badge>bloqueado</Badge>}
      {state.subscribed && <Badge>assinante</Badge>}
    </>
  );
}

/** Os filtros fora da aba: no popover do desktop e no sheet do celular. */
export function UserFilterGroups({
  filters,
  onChange,
  size,
}: {
  filters: UserFilters;
  onChange: (next: UserFilters) => void;
  size?: "lg";
}) {
  return FILTER_GROUPS.map((g) => (
    <div key={g.key} className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">{g.title}</span>
      <div className="flex flex-wrap gap-1.5">
        {g.options.map((o) => (
          <FilterChip key={o.value} size={size} active={filters[g.key] === o.value} onClick={() => onChange({ ...filters, [g.key]: o.value })}>
            {o.label}
          </FilterChip>
        ))}
      </div>
    </div>
  ));
}

/** Faixa vermelha do topo: o que pede ação hoje, com atalho pra aba Problemas. */
export function ProblemsBanner({ text, onOpen, compact }: { text: string; onOpen: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full h-11 pl-3.5 pr-3 rounded-[10px] border border-danger/25 bg-danger/[0.06] flex items-center gap-2.5 text-left"
      >
        <span className="size-[7px] shrink-0 rounded-full bg-danger" />
        <span className="flex-1 min-w-0 truncate text-[13px] tabular-nums">{text}</span>
        <span className="text-[13px] font-medium text-danger">Ver</span>
      </button>
    );
  }
  return (
    <div className="h-10 pl-3.5 pr-1.5 rounded-lg border border-danger/25 bg-danger/[0.06] flex items-center gap-2.5">
      <span className="size-[7px] shrink-0 rounded-full bg-danger" />
      <span className="min-w-0 truncate text-[13.5px] tabular-nums">{text}</span>
      <button type="button" onClick={onOpen} className="ml-auto shrink-0 h-[30px] px-2.5 rounded-md text-[13px] font-medium text-danger hover:bg-danger/10">
        Ver problemas
      </button>
    </div>
  );
}
