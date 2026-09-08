import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";
import { betIdsOfMonth, groupCheckState, type MonthGroup } from "@/lib/bet-grouping";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { BET_GRID, BetRowDesktop } from "./BetRowDesktop";

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

const totalClass = (v: number) => (v >= 0 ? "text-positive" : "text-negative");

// Cabeçalho de colunas. O `px-2 -mx-2` repete o das linhas — sem ele o
// cabeçalho ficava 8px deslocado e as colunas pareciam tortas.
function ColumnHeader() {
  return (
    <div className={cn(BET_GRID, "px-2 -mx-2 pb-1.5 text-[11px] uppercase tracking-wider opacity-40")}>
      <span />
      <span>Hora</span>
      <span>Casa</span>
      <span>Evento</span>
      <span className="text-right">Odd</span>
      <span className="text-right">Valor</span>
      <span className="text-right">Retorno</span>
      <span>Status</span>
      <span />
    </div>
  );
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
    <div className="min-w-0">
      {groups.map((month) => {
        const isOpen = isMonthOpen(month.key);
        const monthIds = betIdsOfMonth(month);
        const monthCheckState = groupCheckState(monthIds, selection.selected);
        // A semana não aparece na tela — só o mês e o dia. Achatar aqui evita
        // um nível de div que não desenha nada.
        const days = month.weeks.flatMap((w) => w.days);
        return (
          <section key={month.key} className="min-w-0 border-b border-border last:border-b-0">
            <div className="w-full flex items-center gap-2 py-3 min-w-0">
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
                className="flex items-baseline gap-2 min-w-0 flex-1 text-left"
              >
                {isOpen ? <CaretDown size={13} className="opacity-40 shrink-0" /> : <CaretRight size={13} className="opacity-40 shrink-0" />}
                <span className="font-semibold text-[15px] tracking-tight truncate">{month.label}</span>
                <span className="text-xs opacity-45 shrink-0">{month.count} apostas</span>
              </button>
              <span className={cn("tabular-nums text-sm font-semibold shrink-0", totalClass(month.total))}>
                {formatSignedCurrency(month.total)}
              </span>
            </div>

            {isOpen && (
              <div className="pb-4 min-w-0">
                <ColumnHeader />
                {days.map((day) => {
                  const dayIds = day.bets.map((b) => b.id);
                  const dayCheckState = groupCheckState(dayIds, selection.selected);
                  return (
                    <div key={day.key} className="min-w-0">
                      <div className="flex items-center gap-2 pt-3 pb-1 min-w-0">
                        {selection.selectionMode && (
                          <Checkbox
                            checked={dayCheckState}
                            onCheckedChange={() => selection.toggleMany(dayIds)}
                            aria-label={`Selecionar todas as apostas de ${day.label}`}
                            className="shrink-0"
                          />
                        )}
                        <span className="text-xs font-medium uppercase tracking-wider opacity-55 truncate">{day.label}</span>
                        <span className="h-px flex-1 bg-border" />
                        <span className={cn("tabular-nums text-xs font-medium shrink-0", totalClass(day.total))}>
                          {formatSignedCurrency(day.total)}
                        </span>
                      </div>
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
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
