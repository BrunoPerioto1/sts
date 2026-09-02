import { useMemo, useState } from "react";
import { format, getISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { mapResultToStatus, statusVariant, statusLabel, ReturnValue, RowActions, ApostaDetailSheet } from "./ApostasList";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLongPress } from "@/hooks/apostas/useLongPress";
import type { useBulkSelection } from "@/hooks/apostas/useBulkSelection";

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

      <span className="text-[11.5px] tabular-nums opacity-50 shrink-0 w-[46px]">{time}</span>

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {aposta.houseName && (
          <span className="text-[10.5px] px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 whitespace-nowrap shrink-0">
            {aposta.houseName}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-medium text-[13.5px] truncate">{aposta.game}</p>
          <p className="text-[11.5px] opacity-55 truncate">{aposta.market}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <span className="text-right w-12 text-[13px] tabular-nums opacity-80">{Number(aposta.odd).toFixed(2)}</span>
        <span className="text-right w-20 text-[13px] tabular-nums opacity-80 shrink-0">{formatCurrency(Number(aposta.stake))}</span>
        <ReturnValue aposta={aposta} className="text-[13px] w-24 text-right shrink-0" />
      </div>

      <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>

      <span onClick={(e) => e.stopPropagation()}>
        <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
      </span>
    </div>
  );
}

function BetCardMobile({
  aposta,
  onOpen,
  selection,
}: {
  aposta: BetItem;
  onOpen: () => void;
  selection: Selection;
}) {
  const status = mapResultToStatus(aposta);
  const time = new Date(aposta.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isSelected = selection.isSelected(aposta.id);

  const longPress = useLongPress(() => selection.enter(aposta.id));

  const handleClick = () => {
    if (selection.selectionMode) selection.toggle(aposta.id);
    else onOpen();
  };

  return (
    <div
      className={cn(
        "rounded-lg p-3 flex flex-col gap-2 active:opacity-90 transition-shadow",
        isSelected ? "ring-2 ring-blue-500/60 bg-blue-500/[0.06]" : "bg-card"
      )}
      style={{ boxShadow: isSelected ? undefined : "var(--shadow-sm)" }}
      onClick={handleClick}
      {...longPress}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {selection.selectionMode && (
            <span onClick={(e) => e.stopPropagation()}>
              <Checkbox checked={isSelected} onCheckedChange={() => selection.toggle(aposta.id)} aria-label="Selecionar aposta" />
            </span>
          )}
          <span className="text-[11px] opacity-50 tabular-nums shrink-0">{time}</span>
          {aposta.houseName && (
            <span className="text-[10.5px] px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 truncate">
              {aposta.houseName}
            </span>
          )}
        </div>
        <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>
      </div>

      <p className="font-medium text-[15px] truncate">{aposta.game}</p>

      <div className="flex items-end justify-between gap-2">
        <p className="text-xs opacity-55 truncate min-w-0">
          {aposta.market} · odd {Number(aposta.odd).toFixed(2)}
        </p>
        <ReturnValue aposta={aposta} className="text-[13.5px] shrink-0" />
      </div>
    </div>
  );
}

export function ApostasGrouped({ apostas, isLoading, onEdit, onDelete, onDuplicate, onFinalize, selection }: ApostasGroupedProps) {
  const isMobile = useIsMobile();
  const groups = useMemo(() => groupBets(apostas), [apostas]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups[0] ? [groups[0].key] : []));
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  const orderedIds = useMemo(
    () => groups.flatMap((m) => m.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id)))),
    [groups]
  );

  if (isLoading) {
    return (
      <div className="card bg-card rounded-md p-4 space-y-3">
        {[38, 88, 72, 80, 56].map((w, i) => (
          <div key={i} className="h-[10px] rounded" style={{ width: `${w}%`, background: "color-mix(in srgb, var(--color-text) 8%, transparent)" }} />
        ))}
      </div>
    );
  }

  if (apostas.length === 0) {
    return <p className="text-center py-10 text-[12.5px] opacity-55">Nenhuma aposta encontrada com os critérios de busca.</p>;
  }

  return (
    <>
      <div className="space-y-3 min-w-0">
        {groups.map((month) => {
          const isOpen = expanded.has(month.key);
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
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(month.key)) next.delete(month.key);
                      else next.add(month.key);
                      return next;
                    })
                  }
                  className="flex items-center gap-2 min-w-0 flex-1 text-left"
                >
                  {isOpen ? <CaretDown size={14} className="opacity-50 shrink-0" /> : <CaretRight size={14} className="opacity-50 shrink-0" />}
                  <span className="font-semibold text-[14px] truncate">{month.label}</span>
                  {!isMobile && (
                    <span className="text-[11px] px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 shrink-0">{month.count} apostas</span>
                  )}
                </button>
                <span className={cn("tabular-nums text-[13.5px] font-medium shrink-0", month.total >= 0 ? "text-positive" : "text-negative")}>
                  {formatSignedCurrency(month.total)}
                </span>
              </div>

              {isOpen && (
                <div className="px-[14px] pb-3 space-y-4 min-w-0">
                  {month.weeks.map((week) => {
                    const weekIds = week.days.flatMap((d) => d.bets.map((b) => b.id));
                    const weekCheckState = groupCheckState(weekIds, selection.selected);
                    return (
                      <div key={week.key} className="min-w-0">
                        <div className="flex items-center gap-2 py-1.5 min-w-0">
                          {selection.selectionMode && (
                            <Checkbox
                              checked={weekCheckState}
                              onCheckedChange={() => selection.toggleMany(weekIds)}
                              aria-label={`Selecionar todas as apostas da ${week.label}`}
                              className="shrink-0"
                            />
                          )}
                          <span className="text-[11px] uppercase tracking-wider opacity-45 shrink-0">{week.label}</span>
                          <span className={cn("ml-auto tabular-nums text-[12px] shrink-0", week.total >= 0 ? "text-positive" : "text-negative")}>
                            {formatSignedCurrency(week.total)}
                          </span>
                        </div>
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
                                <span className="text-[13px] font-semibold truncate">{day.label}</span>
                                {!isMobile && (
                                  <span className="text-[10.5px] px-[7px] py-[1px] rounded-[5px] bg-foreground/[0.06] opacity-60 shrink-0">
                                    {day.bets.length} {day.bets.length === 1 ? "aposta" : "apostas"}
                                  </span>
                                )}
                              </div>
                              {isMobile ? (
                                <div className="space-y-2">
                                  {day.bets.map((bet) => (
                                    <BetCardMobile key={bet.id} aposta={bet} onOpen={() => setDetailAposta(bet)} selection={selection} />
                                  ))}
                                </div>
                              ) : (
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
                              )}
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

      <ApostaDetailSheet
        aposta={detailAposta}
        onClose={() => setDetailAposta(null)}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onFinalize={onFinalize}
      />
    </>
  );
}
