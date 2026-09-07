import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";
import { settledProfit } from "@/lib/bet-status";
import { betIdsOfMonth, groupCheckState, type MonthGroup } from "@/lib/bet-grouping";
import type { BetItem } from "@/api/routes/get-bets";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { BetCardMobile } from "./BetCardMobile";

interface ApostasGroupedMobileProps {
  groups: MonthGroup[];
  selection: BulkSelection;
  isMonthOpen: (key: string) => boolean;
  onToggleMonth: (key: string) => void;
  onOpenDetail: (aposta: BetItem) => void;
}

export function ApostasGroupedMobile({ groups, selection, isMonthOpen, onToggleMonth, onOpenDetail }: ApostasGroupedMobileProps) {
  return (
    <div className="space-y-5">
      {groups.map((month) => {
        const monthIds = betIdsOfMonth(month);
        const isOpen = isMonthOpen(month.key);
        return (
          <section key={month.key} className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3">
              {selection.selectionMode && (
                <Checkbox checked={groupCheckState(monthIds, selection.selected)}
                  onCheckedChange={() => selection.toggleMany(monthIds)}
                  aria-label={`Selecionar todas as apostas de ${month.label}`} />
              )}
              <button type="button" aria-expanded={isOpen} onClick={() => onToggleMonth(month.key)}
                className="min-h-12 flex flex-1 items-center gap-2 min-w-0 text-left">
                {isOpen ? <CaretDown size={16} /> : <CaretRight size={16} />}
                <span className="font-semibold text-lg truncate">{month.label}</span>
                <span className="text-xs font-normal text-zinc-400 shrink-0">{month.count}</span>
              </button>
              <span className={cn("text-sm tabular-nums shrink-0", month.total >= 0 ? "text-positive" : "text-negative")}>{formatSignedCurrency(month.total)}</span>
            </div>
            {isOpen && month.weeks.flatMap((week) => week.days).map((day) => {
              const dayIds = day.bets.map((bet) => bet.id);
              const total = day.bets.reduce((sum, bet) => sum + settledProfit(bet), 0);
              return (
                <section key={day.key} aria-label={day.label} className="ml-2 border-l border-white/[0.06] pl-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1 min-h-8 py-1">
                    {selection.selectionMode && (
                      <Checkbox checked={groupCheckState(dayIds, selection.selected)}
                        onCheckedChange={() => selection.toggleMany(dayIds)}
                        aria-label={`Selecionar todas as apostas de ${day.label}`} />
                    )}
                    <h2 className="text-base font-medium text-zinc-300">{format(new Date(day.bets[0].betTime), "dd MMM yyyy", { locale: ptBR })}</h2>
                    <span className="text-[11px] text-zinc-400">{day.bets.length} {day.bets.length === 1 ? "aposta" : "apostas"}</span>
                    <span className={cn("ml-auto text-xs tabular-nums shrink-0", total >= 0 ? "text-positive" : "text-negative")}>{formatSignedCurrency(total)}</span>
                  </div>
                  <div className="space-y-2">
                    {day.bets.map((bet) => (
                      <BetCardMobile key={bet.id} aposta={bet} onOpen={() => onOpenDetail(bet)} selection={selection} />
                    ))}
                  </div>
                </section>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
