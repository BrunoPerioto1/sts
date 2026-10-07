import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/utils";
import { AnimatedSignedCurrency } from "@/components/ui/animated-currency";
import { settledProfit } from "@/lib/bet-status";
import { betDate, betIdsOfMonth, groupCheckState, type MonthGroup } from "@/lib/bet-grouping";
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
              {selection.selectionMode && monthIds.length > 0 && (
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
              <AnimatedSignedCurrency value={month.total} className="text-sm shrink-0" />
            </div>
            {isOpen && month.loading && month.weeks.length === 0 && (
              <div className="space-y-2" aria-label="Carregando apostas do mês">
                {[0, 1].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" delay={i * 60} />
                ))}
              </div>
            )}
            {isOpen && month.weeks.flatMap((week) => week.days).map((day) => {
              const dayIds = day.bets.map((bet) => bet.id);
              const total = day.bets.reduce((sum, bet) => sum + settledProfit(bet), 0);
              return (
                <section key={day.key} aria-label={day.label} className="ml-2 border-l border-foreground/[0.06] pl-2">
                  <div className="flex items-center gap-2 mb-1 min-h-8 py-1">
                    {selection.selectionMode && (
                      <Checkbox checked={groupCheckState(dayIds, selection.selected)}
                        onCheckedChange={() => selection.toggleMany(dayIds)}
                        aria-label={`Selecionar todas as apostas de ${day.label}`} />
                    )}
                    <SectionLabel
                      className="flex-1 px-0"
                      count={day.bets.length}
                      action={<AnimatedSignedCurrency value={total} className="text-xs" />}
                    >
                      {format(betDate(day.bets[0]), "dd MMM yyyy", { locale: ptBR })}
                    </SectionLabel>
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
