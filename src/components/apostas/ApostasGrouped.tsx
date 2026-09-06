import { useMemo, useState } from "react";
import { format, getISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretDown, CaretRight, Clock } from "@phosphor-icons/react";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { mapResultToStatus, statusVariant, statusLabel, ReturnValue, RowActions, ApostaDetailSheet, type Status } from "./ApostasList";
import { useIsMobile } from "@/hooks/use-mobile";
import { tapHaptic } from "@/lib/haptics";
import { useLongPress } from "@/hooks/apostas/useLongPress";
import type { useBulkSelection } from "@/hooks/apostas/useBulkSelection";
import { ApostasMobileSkeleton } from "./ApostasMobileSkeleton";

type Selection = ReturnType<typeof useBulkSelection>;

interface ApostasGroupedProps {
  apostas: BetItem[];
  isLoading?: boolean;
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selection: Selection;
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function settledProfit(aposta: BetItem): number {
  const status = mapResultToStatus(aposta);
  if (status === "pendente" || status === "cancelada") return 0;
  return Number(aposta.profit ?? 0);
}

function groupCheckState(ids: number[], selected: Set<number>): boolean | "indeterminate" {
  if (ids.length === 0) return false;
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === ids.length) return true;
  return "indeterminate";
}

interface DayGroup {
  key: string;
  label: string;
  bets: BetItem[];
}
interface WeekGroup {
  key: string;
  label: string;
  total: number;
  days: DayGroup[];
}
interface MonthGroup {
  key: string;
  label: string;
  count: number;
  total: number;
  weeks: WeekGroup[];
}

function groupBets(apostas: BetItem[]): MonthGroup[] {
  const sorted = [...apostas].sort((a, b) => new Date(b.betTime).getTime() - new Date(a.betTime).getTime());

  const months = new Map<string, MonthGroup>();
  for (const bet of sorted) {
    const date = new Date(bet.betTime);
    const monthKey = format(date, "yyyy-MM");
    const weekKey = `${format(date, "yyyy")}-W${getISOWeek(date)}`;
    const dayKey = format(date, "yyyy-MM-dd");

    if (!months.has(monthKey)) {
      months.set(monthKey, { key: monthKey, label: capitalize(format(date, "MMMM yyyy", { locale: ptBR })), count: 0, total: 0, weeks: [] });
    }
    const month = months.get(monthKey)!;
    month.count += 1;
    month.total += settledProfit(bet);

    let week = month.weeks.find((w) => w.key === weekKey);
    if (!week) {
      week = { key: weekKey, label: `Semana ${getISOWeek(date)}`, total: 0, days: [] };
      month.weeks.push(week);
    }
    week.total += settledProfit(bet);

    let day = week.days.find((d) => d.key === dayKey);
    if (!day) {
      day = { key: dayKey, label: capitalize(format(date, "EEEE dd", { locale: ptBR })), bets: [] };
      week.days.push(day);
    }
    day.bets.push(bet);
  }

  return Array.from(months.values());
}

function BetRowDesktop({
  aposta,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
  selection,
  orderedIds,
}: {
  aposta: BetItem;
  onEdit?: (a: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (a: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selection: Selection;
  orderedIds: number[];
}) {
  const status = mapResultToStatus(aposta);
  const time = new Date(aposta.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isSelected = selection.isSelected(aposta.id);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!selection.selectionMode) return;
    if (e.shiftKey) selection.selectRange(orderedIds, aposta.id);
    else selection.toggle(aposta.id);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 py-[10px] px-2 -mx-2 border-b border-border last:border-b-0 rounded-md transition-colors",
        selection.selectionMode && "cursor-pointer",
        isSelected && "bg-blue-500/[0.06]"
      )}
      onClick={handleRowClick}
    >
      <span
        className={cn("shrink-0 transition-opacity", selection.selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => {
            if (!selection.selectionMode) selection.enter(aposta.id);
            else selection.toggle(aposta.id);
          }}
          aria-label="Selecionar aposta"
        />
      </span>

      <span className="text-xs tabular-nums opacity-50 shrink-0 w-[46px]">{time}</span>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {aposta.houseName && (
          <span className="text-xs px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 whitespace-nowrap shrink-0">
            {aposta.houseName}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{aposta.game}</p>
          <p className="text-xs opacity-55 truncate">{aposta.market}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-right w-12 text-sm tabular-nums opacity-80">{Number(aposta.odd).toFixed(2)}</span>
        <span className="text-right w-20 text-sm tabular-nums opacity-80 shrink-0">{formatCurrency(Number(aposta.stake))}</span>
        <ReturnValue aposta={aposta} className="text-sm w-24 text-right shrink-0" />
      </div>

      <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>

      <span onClick={(e) => e.stopPropagation()}>
        <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
      </span>
    </div>
  );
}

const stripColors: Record<Status, string> = {
  ganha: "bg-green-500",
  meiaGanha: "bg-green-500/40",
  perdida: "bg-red-500/60",
  meiaPerdida: "bg-red-500/30",
  pendente: "bg-accent-700",
  cancelada: "bg-neutral-500/40",
  cashout: "bg-accent-500",
};

// Só a cor: o nome do status aparecia em vertical na lateral e disputava a
// atenção com o evento e o retorno, que são o que se lê no card. O detalhe
// abre o status por escrito.
function StatusStrip({ status }: { status: Status }) {
  return <div className={cn("absolute inset-y-0 right-0 w-[6px] rounded-r-lg", stripColors[status])} />;
}

// Horário com contraste próprio para facilitar a leitura durante a rolagem.
const timeChipClass = "inline-flex items-center gap-1 h-6 rounded-full border border-white/15 bg-white/10 px-2.5 text-xs font-semibold tabular-nums text-white shrink-0";
const oddChipClass = "h-6 leading-[22px] text-xs px-2.5 rounded-full bg-white/[0.08] text-zinc-100 font-semibold tabular-nums shrink-0";
const houseChipClass = "h-6 leading-[22px] text-xs px-2.5 rounded-full border border-accent/25 bg-accent/[0.08] text-accent-100 shrink-0";

function BetCardMobile({
  aposta,
  onOpen,
  selection,
  index = 0,
}: {
  aposta: BetItem;
  onOpen: () => void;
  selection: Selection;
  index?: number;
}) {
  const status = mapResultToStatus(aposta);
  const time = new Date(aposta.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isSelected = selection.isSelected(aposta.id);

  // Toque longo entra no modo de seleção já com esta aposta marcada — é o
  // único caminho desde que o ícone saiu do header.
  const longPress = useLongPress(() => {
    tapHaptic();
    selection.enter(aposta.id);
  });

  const handleClick = () => {
    if (selection.selectionMode) selection.toggle(aposta.id);
    else onOpen();
  };

  return (
    <div
      className={cn(
        "press animate-rise stagger relative overflow-hidden rounded-lg p-3 pr-4 flex flex-col gap-2",
        isSelected ? "ring-2 ring-blue-500/60 bg-blue-500/[0.06]" : "bg-card"
      )}
      style={{ boxShadow: isSelected ? undefined : "var(--shadow-sm)", ...stagger(index) }}
      role={selection.selectionMode ? "group" : "button"}
      tabIndex={selection.selectionMode ? -1 : 0}
      aria-label={`${aposta.game}, ${statusLabel[status]}`}
      onKeyDown={(event) => {
        if (!selection.selectionMode && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          handleClick();
        }
      }}
      onClick={handleClick}
      {...longPress}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {selection.selectionMode && (
          <span onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={() => selection.toggle(aposta.id)} aria-label="Selecionar aposta" />
          </span>
        )}
        <span className={timeChipClass}>
          <Clock size={12} weight="bold" /> {time}
        </span>
        <span className={oddChipClass}>@{Number(aposta.odd).toFixed(2)}</span>
        {aposta.houseName && <span className={cn(houseChipClass, "truncate")}>{aposta.houseName}</span>}
      </div>

      <p className="text-base font-medium text-white truncate">{aposta.game}</p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-sm text-zinc-400 truncate min-w-0">{aposta.market}</p>
        <ReturnValue aposta={aposta} className="text-sm shrink-0" />
      </div>

      <StatusStrip status={status} />
    </div>
  );
}

export function ApostasGrouped({ apostas, isLoading, onEdit, onDelete, onDuplicate, onFinalize, selection }: ApostasGroupedProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => groupBets(apostas), [apostas]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  const orderedIds = useMemo(
    () => groups.flatMap((m) => m.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id)))),
    [groups]
  );

  const isMonthOpen = (key: string) => expanded[key] ?? key === groups[0]?.key;
  const toggleMonth = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? key === groups[0]?.key) }));
  };

  // So mostra esqueleto quando NAO ha nada na tela ainda. Em recarga (editar,
  // liquidar, mudar status) trocar a lista inteira por um esqueleto de poucas
  // linhas desabava a altura da pagina, o browser prendia o scroll no novo
  // maximo (~0) e a tela voltava pro topo. Mantendo a lista montada durante o
  // refetch, a posicao do scroll fica onde estava — o spinner do header ja
  // sinaliza o carregamento.
  if (isLoading && apostas.length === 0 && isMobile) {
    return <ApostasMobileSkeleton />;
  }

  if (isLoading && apostas.length === 0) {
    return (
      <div className="card bg-card rounded-md p-4 space-y-3">
        {[38, 88, 72, 80, 56].map((w, i) => (
          <div key={i} className="skeleton h-[10px] rounded" style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    );
  }

  if (apostas.length === 0) {
    return <p className="text-center py-10 text-sm opacity-55">Nenhuma aposta encontrada com os critérios de busca.</p>;
  }

  const detailSheet = (
    <ApostaDetailSheet
      aposta={detailAposta}
      onClose={() => setDetailAposta(null)}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onFinalize={onFinalize}
    />
  );

  if (isMobile) {
    return (
      <>
        <div className="space-y-5">
          {groups.map((month) => {
            const monthIds = month.weeks.flatMap((week) => week.days.flatMap((day) => day.bets.map((bet) => bet.id)));
            const isOpen = isMonthOpen(month.key);
            return (
              <section key={month.key} className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
                  {selection.selectionMode && (
                    <Checkbox checked={groupCheckState(monthIds, selection.selected)}
                      onCheckedChange={() => selection.toggleMany(monthIds)}
                      aria-label={`Selecionar todas as apostas de ${month.label}`} />
                  )}
                  <button type="button" aria-expanded={isOpen} onClick={() => toggleMonth(month.key)}
                    className="min-h-12 flex flex-1 items-center gap-2 min-w-0 text-left">
                    {isOpen ? <CaretDown size={16} /> : <CaretRight size={16} />}
                    <span className="font-semibold text-sm truncate">{month.label}</span>
                    <span className="text-xs text-zinc-400">{month.count}</span>
                  </button>
                  <span className={cn("text-sm tabular-nums shrink-0", month.total >= 0 ? "text-positive" : "text-negative")}>{formatSignedCurrency(month.total)}</span>
                </div>
                {isOpen && month.weeks.flatMap((week) => week.days).map((day) => {
            const dayIds = day.bets.map((bet) => bet.id);
            const total = day.bets.reduce((sum, bet) => sum + settledProfit(bet), 0);
            return (
              <section key={day.key} aria-label={day.label}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-3 mt-5 min-h-14 border-l-4 border-accent rounded-r-lg bg-white/[0.06] px-3 py-3">
                  {selection.selectionMode && (
                    <Checkbox checked={groupCheckState(dayIds, selection.selected)}
                      onCheckedChange={() => selection.toggleMany(dayIds)}
                      aria-label={`Selecionar todas as apostas de ${day.label}`} />
                  )}
                  <h2 className="text-lg font-bold tracking-tight text-white">{format(new Date(day.bets[0].betTime), "dd MMM yyyy", { locale: ptBR })}</h2>
                  <span className="text-xs text-zinc-400">{day.bets.length} {day.bets.length === 1 ? "aposta" : "apostas"}</span>
                  <span className={cn("ml-auto text-sm tabular-nums", total >= 0 ? "text-positive" : "text-negative")}>{formatSignedCurrency(total)}</span>
                </div>
                <div className="space-y-2">
                  {day.bets.map((bet) => (
                    <BetCardMobile key={bet.id} aposta={bet} onOpen={() => setDetailAposta(bet)} selection={selection} />
                  ))}
                </div>
              </section>
            );
                })}
              </section>
            );
          })}
        </div>
        {detailSheet}
      </>
    );
  }

  return (
    <>
      <div className="space-y-3 min-w-0">
        {groups.map((month) => {
          const isOpen = isMonthOpen(month.key);
          const monthIds = month.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id)));
          const monthCheckState = groupCheckState(monthIds, selection.selected);
          return (
            <div key={month.key} className="rounded-md border border-border overflow-hidden min-w-0">
              <div className="w-full flex items-center gap-2 px-[14px] py-3 hover:bg-foreground/[0.03] min-w-0">
                {selection.selectionMode && (
                  <Checkbox
                    checked={monthCheckState}
                    onCheckedChange={() => selection.toggleMany(monthIds)}
                    aria-label={`Selecionar todas as apostas de ${month.label}`}
                    className="shrink-0"
                  />
                )}
                <button
                  type="button"
                  onClick={() => toggleMonth(month.key)}
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  {isOpen ? <CaretDown size={14} className="opacity-50 shrink-0" /> : <CaretRight size={14} className="opacity-50 shrink-0" />}
                  <span className="font-semibold text-sm truncate">{month.label}</span>
                  <span className="text-xs px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 shrink-0">{month.count} apostas</span>
                </button>
                <span className={cn("tabular-nums text-sm font-medium shrink-0", month.total >= 0 ? "text-positive" : "text-negative")}>
                  {formatSignedCurrency(month.total)}
                </span>
              </div>

              {isOpen && (
                <div className="px-[14px] pb-3 space-y-4 min-w-0">
                  {month.weeks.map((week) => {
                    return (
                      <div key={week.key} className="min-w-0">
                        {week.days.map((day) => {
                          const dayIds = day.bets.map((b) => b.id);
                          const dayCheckState = groupCheckState(dayIds, selection.selected);
                          return (
                            <div key={day.key} className="mb-2 rounded-lg border border-border bg-card p-3 min-w-0" style={{ boxShadow: "var(--shadow-sm)" }}>
                              <div className="flex items-center gap-2 pb-2 min-w-0">
                                {selection.selectionMode && (
                                  <Checkbox
                                    checked={dayCheckState}
                                    onCheckedChange={() => selection.toggleMany(dayIds)}
                                    aria-label={`Selecionar todas as apostas de ${day.label}`}
                                    className="shrink-0"
                                  />
                                )}
                                <span className="text-sm font-semibold truncate">{day.label}</span>
                                <span className="text-xs px-[7px] py-[1px] rounded-[5px] bg-foreground/[0.06] opacity-60 shrink-0">
                                  {day.bets.length} {day.bets.length === 1 ? "aposta" : "apostas"}
                                </span>
                              </div>
                              <div className="min-w-0">
                                {day.bets.map((bet) => (
                                  <BetRowDesktop
                                    key={bet.id}
                                    aposta={bet}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    onDuplicate={onDuplicate}
                                    onFinalize={onFinalize}
                                    selection={selection}
                                    orderedIds={orderedIds}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {detailSheet}
    </>
  );
}
