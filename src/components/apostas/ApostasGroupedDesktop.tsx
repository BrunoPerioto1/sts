import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";
import { betIdsOfMonth, groupCheckState, type MonthGroup } from "@/lib/bet-grouping";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { BetRowDesktop } from "./BetRowDesktop";

interface ApostasGroupedDesktopProps {
  groups: MonthGroup[];
  selection: BulkSelection;
  orderedIds: number[];
  isMonthOpen: (key: string) => boolean;
  onToggleMonth: (key: string) => void;
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
}

export function ApostasGroupedDesktop({
  groups,
  selection,
  orderedIds,
  isMonthOpen,
  onToggleMonth,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
}: ApostasGroupedDesktopProps) {
  return (
    <div className="space-y-3 min-w-0">
      {groups.map((month) => {
        const isOpen = isMonthOpen(month.key);
        const monthIds = betIdsOfMonth(month);
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
                onClick={() => onToggleMonth(month.key)}
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
                {month.weeks.map((week) => (
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
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
