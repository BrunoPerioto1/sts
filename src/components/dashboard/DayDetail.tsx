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
import { formatMoney, formatOdd, formatPercent } from "@/lib/format";
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

// Ordem das abas e dos segmentos da barra: o que decidiu primeiro.
const OUTCOMES: { key: Outcome; label: string }[] = [
  { key: "green", label: "Green" },
  { key: "red", label: "Red" },
  { key: "pending", label: "Pendente" },
  { key: "void", label: "Devolvida" },
];

// Até aqui a barra tem um segmento por aposta; acima, um por desfecho, na
// proporção — 60 risquinhos com vão entre eles viravam só vão.
const MAX_BAR_SEGMENTS = 20;

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

/** Cor de cada desfecho: green/red seguem a cor escolhida em Preferências. */
function outcomeColor(outcome: Outcome, colors: Colors): string {
  if (outcome === "green") return performanceColor(1, colors);
  if (outcome === "red") return performanceColor(-1, colors);
  return outcome === "pending" ? "var(--color-pending)" : "var(--color-muted)";
}

/** Na barra a devolvida é o vazio: apagada, quase da cor do trilho. */
function barColor(outcome: Outcome, colors: Colors): string {
  return outcome === "void" ? "rgb(var(--rgb-text) / 0.08)" : outcomeColor(outcome, colors);
}

/** Setas entre os dias com aposta (o calendário pula os vazios), numa caixa só. */
function DayNav({ day, days, onChange }: Pick<DayDetailProps, "days" | "onChange"> & { day: string }) {
  const i = days.indexOf(day);
  const prev = i > 0 ? days[i - 1] : null;
  const next = i >= 0 && i < days.length - 1 ? days[i + 1] : null;
  const nav = "flex h-full w-9 items-center justify-center text-zinc-200 hover:text-foreground disabled:text-zinc-700";
  return (
    <div className="flex h-9 items-center rounded-lg border border-foreground/10">
      <button type="button" aria-label="Dia anterior" disabled={!prev} onClick={() => prev && onChange(prev)} className={nav}>
        <CaretLeft size={15} />
      </button>
      <span className="h-4 w-px bg-foreground/10" aria-hidden="true" />
      <button type="button" aria-label="Próximo dia" disabled={!next} onClick={() => next && onChange(next)} className={nav}>
        <CaretRight size={15} />
      </button>
    </div>
  );
}

/** "SEXTA" em cima, "4 de setembro" embaixo. */
function DayTitle({ day }: { day: string }) {
  const date = parseISO(day);
  return (
    <>
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
        {format(date, "EEEE", { locale: ptBR }).replace("-feira", "")}
      </span>
      <span className="mt-0.5 block text-xl font-semibold text-foreground">{format(date, "d 'de' MMMM", { locale: ptBR })}</span>
    </>
  );
}

function useDayBets(day: string, { houseIds, sportIds }: Filters) {
  // Mesmo recorte de data da tela de Apostas: o dia inteiro, nos filtros do dash.
  const { data, isPending } = useQuery({
    queryKey: ["dashboard", "day-bets", day, houseIds.join(","), sportIds.join(",")],
    queryFn: () => getBets({ startDate: day, endDate: day, houseIds, sportIds, perPage: 200 }),
  });
  const bets = data?.data ?? [];
  const counts: Record<Outcome, number> = { green: 0, red: 0, void: 0, pending: 0 };
  let total = 0;
  let staked = 0;
  let settledStake = 0;
  for (const bet of bets) {
    const outcome = outcomeOf(bet);
    counts[outcome] += 1;
    total += Number(bet.profit ?? 0);
    staked += Number(bet.stake);
    // Pendente ainda não tem resultado: entrar no ROI só diluiria o do dia.
    if (outcome !== "pending") settledStake += Number(bet.stake);
  }
  return { bets, counts, total, staked, roi: settledStake > 0 ? total / settledStake : null, isPending };
}

type DayData = ReturnType<typeof useDayBets>;

/** Resultado do dia, ROI e apostado, e a barra com o desfecho de cada aposta. */
function DaySummary({ data, colors }: { data: DayData; colors: Colors }) {
  const { bets, counts, total, staked, roi, isPending } = data;
  const segments: { key: string; color: string; grow: number }[] =
    bets.length <= MAX_BAR_SEGMENTS
      ? OUTCOMES.flatMap(({ key }) =>
          Array.from({ length: counts[key] }, (_, n) => ({ key: `${key}-${n}`, color: barColor(key, colors), grow: 1 })),
        )
      : OUTCOMES.filter(({ key }) => counts[key] > 0).map(({ key }) => ({ key, color: barColor(key, colors), grow: counts[key] }));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] text-zinc-400">Resultado do dia</p>
          {isPending ? (
            <Skeleton className="mt-2 h-9 w-44" />
          ) : (
            <p className="mt-0.5 truncate text-[32px] font-semibold leading-tight tabular-nums" style={{ color: performanceColor(total, colors) }}>
              {formatMoney(total, { signed: true })}
            </p>
          )}
        </div>
        {!isPending && (
          <div className="shrink-0 pb-1 text-right tabular-nums">
            <p className="text-sm font-semibold text-foreground">ROI {roi === null ? "—" : formatPercent(roi, { signed: true })}</p>
            <p className="text-[13px] text-zinc-400">{formatMoney(staked, { cents: "auto" })} apostado</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex h-1.5 gap-1" aria-hidden="true">
        {isPending || !segments.length ? (
          <span className="flex-1 rounded-full bg-foreground/[0.06]" />
        ) : (
          segments.map((s) => (
            <span key={s.key} className="min-w-1 rounded-full" style={{ flexGrow: s.grow, flexBasis: 0, background: s.color }} />
          ))
        )}
      </div>
    </div>
  );
}

/** Todas + um filtro por desfecho que existe no dia. */
function OutcomeChips({ data, tab, onTab, colors }: { data: DayData; tab: Outcome | "all"; onTab: (tab: Outcome | "all") => void; colors: Colors }) {
  const { bets, counts } = data;
  const chips = [{ key: "all" as const, label: "Todas", count: bets.length }, ...OUTCOMES.filter((o) => counts[o.key] > 0).map((o) => ({ ...o, count: counts[o.key] }))];
  return (
    <div className="flex gap-2 overflow-x-auto">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          aria-pressed={tab === chip.key}
          onClick={() => onTab(chip.key)}
          className={cn(
            "flex h-[30px] shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] font-medium transition-colors",
            tab === chip.key
              ? "border-transparent bg-foreground/[0.08] text-foreground"
              : "border-foreground/10 text-zinc-300 hover:border-foreground/25 hover:text-foreground",
          )}
        >
          {chip.key !== "all" && <span className="h-1.5 w-1.5 rounded-full" style={{ background: outcomeColor(chip.key, colors) }} aria-hidden="true" />}
          {chip.label}
          <span className="tabular-nums text-zinc-500">{chip.count}</span>
        </button>
      ))}
    </div>
  );
}

function BetRows({ data, tab, colors }: { data: DayData; tab: Outcome | "all"; colors: Colors }) {
  if (data.isPending) {
    return (
      <ul>
        {Array.from({ length: 4 }, (_, n) => (
          <li key={n} className="py-3">
            <Skeleton className="h-10 w-full" delay={n * 60} />
          </li>
        ))}
      </ul>
    );
  }
  const shown = tab === "all" ? data.bets : data.bets.filter((b) => outcomeOf(b) === tab);
  return (
    <ul>
      {shown.map((bet) => {
        const outcome = outcomeOf(bet);
        const profit = Number(bet.profit ?? 0);
        const color = outcome === "green" || outcome === "red" ? performanceColor(profit, colors) : outcomeColor(outcome, colors);
        const result = outcome === "pending" ? "Pendente" : outcome === "void" && profit === 0 ? "Devolvida" : formatMoney(profit, { signed: true });
        return (
          <li key={bet.id} className="flex items-center gap-3 py-3">
            <span className="w-[3px] self-stretch rounded-full" style={{ background: color }} aria-hidden="true" />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate text-[15px] text-zinc-100">{bet.game}</span>
              <span className="truncate text-[13px] text-zinc-500">
                {bet.market} · @{formatOdd(bet.odd, { decimals: 2 })}
              </span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1 tabular-nums">
              <span className="text-[15px] font-semibold" style={{ color }}>{result}</span>
              <span className="text-[13px] text-zinc-500">{formatMoney(Number(bet.stake), { cents: "auto" })}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function useOpenInBets(day: string, filters: Filters) {
  const navigate = useNavigate();
  return () => {
    const params = new URLSearchParams({ de: day, ate: day });
    if (filters.houseIds.length) params.set("houseId", filters.houseIds.join(","));
    if (filters.sportIds.length) params.set("sportId", filters.sportIds.join(","));
    navigate(`/bets?${params}`);
  };
}

/** O dia aberto: a query e a aba moram aqui, os dois layouts só arrumam as peças. */
function DayPanel({ day, days, filters, colors, onChange, mobile }: DayDetailProps & { day: string; mobile: boolean }) {
  const [tab, setTab] = useState<Outcome | "all">("all");
  useEffect(() => setTab("all"), [day]);
  const data = useDayBets(day, filters);
  const openInBets = useOpenInBets(day, filters);
  const onOpenChange = (open: boolean) => !open && onChange(null);

  const summary = (
    <>
      <DaySummary data={data} colors={colors} />
      <div className="mt-5">
        <OutcomeChips data={data} tab={tab} onTab={setTab} colors={colors} />
      </div>
    </>
  );

  if (mobile) {
    const count = data.bets.length;
    return (
      <BottomSheet
        open
        onOpenChange={onOpenChange}
        title={<DayTitle day={day} />}
        action={<div className="mr-1"><DayNav day={day} days={days} onChange={onChange} /></div>}
        // Resumo e abas ficam parados; só a lista rola por baixo.
        subHeader={
          <div className="pt-1">
            {summary}
            <div className="-mx-4 mt-4 border-t border-foreground/[0.06]" />
          </div>
        }
        footer={
          <button
            type="button"
            onClick={openInBets}
            className="press flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-foreground/10 text-[15px] font-medium text-accent-text hover:border-foreground/25"
          >
            {data.isPending ? "Abrir em Apostas" : `Abrir ${count} ${count === 1 ? "aposta" : "apostas"} em Apostas`}
            <ArrowRight size={16} />
          </button>
        }
        contentClassName="h-[88dvh]"
      >
        <BetRows data={data} tab={tab} colors={colors} />
      </BottomSheet>
    );
  }

  return (
    <DialogPrimitive.Root open onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 animate-in fade-in-0 duration-200" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-48px)] w-[440px] max-w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-[rgb(var(--rgb-surface))] shadow-[0_24px_64px_rgba(0,0,0,0.6)] animate-in fade-in-0 zoom-in-95 duration-200"
        >
          <div className="flex items-center gap-3 px-5 pt-5">
            <DialogPrimitive.Title className="min-w-0 flex-1">
              <DayTitle day={day} />
            </DialogPrimitive.Title>
            <DayNav day={day} days={days} onChange={onChange} />
            <DialogPrimitive.Close
              aria-label="Fechar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <X size={18} />
            </DialogPrimitive.Close>
          </div>

          <div className="border-b border-foreground/[0.06] px-5 pb-4 pt-5">{summary}</div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-1">
            <BetRows data={data} tab={tab} colors={colors} />
          </div>

          <div className="flex justify-end border-t border-foreground/[0.06] px-5 py-3.5">
            <button
              type="button"
              onClick={openInBets}
              className="flex items-center gap-1.5 rounded-md text-sm font-medium text-accent-text hover:underline underline-offset-4"
            >
              Abrir em Apostas <ArrowRight size={15} />
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * Detalhe de um dia do calendário: o resultado, as apostas por desfecho e o
 * atalho pra lista filtrada. Diálogo central no desktop, folha no celular.
 */
export function DayDetail(props: DayDetailProps) {
  const isMobile = useIsMobile();
  if (!props.day) return null;
  return <DayPanel {...props} day={props.day} mobile={isMobile} />;
}
