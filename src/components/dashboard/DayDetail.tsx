import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { getBets, ResultIdEnum, type BetItem } from "@/api/routes/get-bets";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { formatInt, formatMoney, formatOdd, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type Outcome = "green" | "red" | "void" | "pending";

// Cashout vale pelo sinal do que voltou; meia ganha/perdida contam como green/red.
function outcomeOf(bet: BetItem): Outcome {
  const profit = Number(bet.profit ?? 0);
  switch (bet.resultId) {
    case ResultIdEnum.PENDING:
      return "pending";
    case ResultIdEnum.WON:
    case ResultIdEnum.HALF_WON:
      return "green";
    case ResultIdEnum.LOST:
    case ResultIdEnum.HALF_LOST:
      return "red";
    case ResultIdEnum.CANCELED:
      return "void";
    default:
      return profit > 0 ? "green" : profit < 0 ? "red" : "void";
  }
}

const TABS: { key: Outcome | "all"; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "green", label: "Green" },
  { key: "red", label: "Red" },
  { key: "void", label: "Devolvidas" },
  { key: "pending", label: "Pendentes" },
];

type Filters = { houseIds: number[]; sportIds: number[] };
type Colors = DashboardPreferences["performanceColors"];

interface DayDetailProps {
  /** Dia aberto ("2026-09-18"); null fecha. */
  day: string | null;
  /** Dias com aposta no período, em ordem: as setas andam entre eles. */
  days: string[];
  filters: Filters;
  colors: Colors;
  onChange: (day: string | null) => void;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[10px] border border-foreground/[0.06] bg-background px-3 py-2.5">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className="truncate text-[15px] font-semibold tabular-nums text-foreground" style={{ color }}>{value}</span>
    </div>
  );
}

/** Setas entre os dias com aposta (o calendário pula os vazios). */
function DayNav({ day, days, onChange }: Pick<DayDetailProps, "days" | "onChange"> & { day: string }) {
  const i = days.indexOf(day);
  const prev = i > 0 ? days[i - 1] : null;
  const next = i >= 0 && i < days.length - 1 ? days[i + 1] : null;
  const nav = "flex h-8 w-8 items-center justify-center rounded-lg border border-foreground/10 text-zinc-200 hover:border-foreground/25 disabled:text-zinc-700 disabled:hover:border-foreground/10";
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Dia anterior" disabled={!prev} onClick={() => prev && onChange(prev)} className={nav}>
        <CaretLeft size={14} />
      </button>
      <button type="button" aria-label="Próximo dia" disabled={!next} onClick={() => next && onChange(next)} className={nav}>
        <CaretRight size={14} />
      </button>
    </div>
  );
}

function OpenInBets({ day, filters, tall }: { day: string; filters: Filters; tall?: boolean }) {
  const navigate = useNavigate();
  const open = () => {
    const params = new URLSearchParams({ de: day, ate: day });
    if (filters.houseIds.length) params.set("houseId", filters.houseIds.join(","));
    if (filters.sportIds.length) params.set("sportId", filters.sportIds.join(","));
    navigate(`/bets?${params}`);
  };
  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-foreground/10 bg-[rgb(var(--rgb-panel))] text-sm font-medium text-accent hover:border-foreground/25",
        tall ? "h-12" : "h-10",
      )}
    >
      Abrir em Apostas <ArrowRight size={14} />
    </button>
  );
}

/** Números do dia, abas por desfecho e a lista das apostas. */
function DayBody({ day, filters, colors, mobile }: { day: string; filters: Filters; colors: Colors; mobile: boolean }) {
  const [tab, setTab] = useState<Outcome | "all">("all");
  useEffect(() => setTab("all"), [day]);

  const { houseIds, sportIds } = filters;
  // Mesmo recorte de data da tela de Apostas: o dia inteiro, nos filtros do dash.
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "day-bets", day, houseIds.join(","), sportIds.join(",")],
    queryFn: () => getBets({ startDate: day, endDate: day, houseIds, sportIds, perPage: 200 }),
  });
  const bets = data?.data ?? [];
  const counts: Record<Outcome, number> = { green: 0, red: 0, void: 0, pending: 0 };
  for (const bet of bets) counts[outcomeOf(bet)] += 1;
  const total = bets.reduce((sum, b) => sum + Number(b.profit ?? 0), 0);
  const staked = bets.reduce((sum, b) => sum + Number(b.stake), 0);
  const decided = counts.green + counts.red;
  const shown = tab === "all" ? bets : bets.filter((b) => outcomeOf(b) === tab);
  const pad = mobile ? "" : "px-5";

  return (
    <>
      <div className={cn("grid gap-2 pb-3.5", mobile ? "grid-cols-2" : "grid-cols-4", pad)}>
        <Stat label="Resultado" value={isPending ? "…" : formatMoney(total, { signed: true })} color={isPending ? undefined : performanceColor(total, colors)} />
        <Stat label="Apostas" value={isPending ? "…" : formatInt(bets.length)} />
        <Stat label="Apostado" value={isPending ? "…" : formatMoney(staked, { cents: "auto" })} />
        <Stat label="Acerto" value={isPending ? "…" : decided ? formatPercent(counts.green / decided, { decimals: 0 }) : "—"} />
      </div>

      <div className={cn("flex gap-1 overflow-x-auto border-b border-foreground/[0.06] pb-2.5", pad)}>
        {TABS.filter((t) => t.key === "all" || counts[t.key] > 0).map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex h-[30px] shrink-0 items-center gap-1.5 rounded-[7px] px-2.5 text-[13px] font-medium transition-colors",
              tab === t.key ? "bg-foreground/[0.08] text-foreground" : "text-zinc-400 hover:text-foreground",
            )}
          >
            {t.label}
            <span className="text-[11px] text-zinc-500 tabular-nums">{t.key === "all" ? bets.length : counts[t.key]}</span>
          </button>
        ))}
      </div>

      <ul className={cn(!mobile && "min-h-0 flex-1 overflow-y-auto", pad)}>
        {isPending
          ? Array.from({ length: 4 }, (_, n) => (
              <li key={n} className="border-b border-foreground/[0.05] py-3">
                <Skeleton className="h-4 w-full" delay={n * 60} />
              </li>
            ))
          : shown.map((bet) => {
              const outcome = outcomeOf(bet);
              const profit = Number(bet.profit ?? 0);
              const color = outcome === "green" || outcome === "red" ? performanceColor(profit, colors) : "var(--color-muted)";
              const result = outcome === "pending" ? "Pendente" : outcome === "void" && profit === 0 ? "Devolvida" : formatMoney(profit, { signed: true });
              return (
                <li
                  key={bet.id}
                  className={cn(
                    "grid items-center gap-3 border-b border-foreground/[0.05] py-[11px]",
                    mobile ? "grid-cols-[8px_minmax(0,1fr)_auto]" : "grid-cols-[8px_minmax(0,1fr)_48px_auto]",
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden="true" />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-[13px] text-zinc-200">{bet.game}</span>
                    <span className="truncate text-xs text-zinc-500">
                      {bet.market} · {formatMoney(Number(bet.stake), { cents: "auto" })}
                      {mobile && ` · ${formatOdd(bet.odd, { decimals: 2 })}`}
                    </span>
                  </span>
                  {!mobile && <span className="text-right text-[13px] text-zinc-400 tabular-nums">{formatOdd(bet.odd, { decimals: 2 })}</span>}
                  <span className="min-w-[76px] text-right text-[13px] font-semibold tabular-nums" style={{ color }}>{result}</span>
                </li>
              );
            })}
      </ul>
    </>
  );
}

/**
 * Detalhe de um dia do calendário: o resultado, as apostas por desfecho e o
 * atalho pra lista filtrada. Painel à direita no desktop, folha no celular.
 */
export function DayDetail({ day, days, filters, colors, onChange }: DayDetailProps) {
  const isMobile = useIsMobile();
  if (!day) return null;
  const onOpenChange = (open: boolean) => !open && onChange(null);
  const label = format(parseISO(day), "EEE, d 'de' MMMM", { locale: ptBR });
  const title = label.charAt(0).toUpperCase() + label.slice(1);

  if (isMobile) {
    return (
      <BottomSheet
        open
        onOpenChange={onOpenChange}
        title={title}
        action={<DayNav day={day} days={days} onChange={onChange} />}
        footer={<OpenInBets day={day} filters={filters} tall />}
        contentClassName="h-[88dvh]"
      >
        <DayBody day={day} filters={filters} colors={colors} mobile />
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed bottom-2.5 right-2.5 top-2.5 z-50 flex w-[540px] max-w-[calc(100vw-20px)] flex-col overflow-hidden rounded-[14px] border border-foreground/10 bg-[rgb(var(--rgb-surface))] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-in slide-in-from-right-8 fade-in-0 duration-200"
        >
          <div className="flex items-center gap-2 px-5 pb-3.5 pt-[18px]">
            <DayNav day={day} days={days} onChange={onChange} />
            <DialogPrimitive.Title className="flex-1 pl-1 text-[15px] font-semibold text-foreground">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <X size={16} />
            </DialogPrimitive.Close>
          </div>
          <DayBody day={day} filters={filters} colors={colors} mobile={false} />
          <div className="border-t border-foreground/[0.06] px-5 pb-4 pt-3">
            <OpenInBets day={day} filters={filters} />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
