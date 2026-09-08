import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime } from "@/lib/format";
import { mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { ReturnValue } from "./ReturnValue";
import { RowActions } from "./RowActions";

// Uma única definição de colunas pro cabeçalho e pras linhas — antes cada
// célula tinha sua largura solta (w-12/w-20/w-24) e nada alinhava de fato.
export const BET_GRID =
  "grid items-center gap-3 grid-cols-[20px_46px_88px_minmax(0,1fr)_56px_84px_100px_104px_32px]";

export function BetRowDesktop({
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
  selection: BulkSelection;
  orderedIds: number[];
}) {
  const status = mapResultToStatus(aposta);
  const isSelected = selection.isSelected(aposta.id);

  const handleRowClick = (e: React.MouseEvent) => {
    if (!selection.selectionMode) return;
    if (e.shiftKey) selection.selectRange(orderedIds, aposta.id);
    else selection.toggle(aposta.id);
  };

  return (
    <div
      className={cn(
        BET_GRID,
        "group py-[9px] px-2 -mx-2 rounded-md transition-colors hover:bg-foreground/[0.03]",
        selection.selectionMode && "cursor-pointer",
        isSelected && "bg-accent/[0.08]"
      )}
      onClick={handleRowClick}
    >
      <span
        className={cn("transition-opacity", selection.selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
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

      <span className="text-xs tabular-nums opacity-45">{formatTime(aposta.betTime)}</span>

      <span className="text-[11px] uppercase tracking-wide opacity-45 truncate">{aposta.houseName}</span>

      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{aposta.game}</p>
        <p className="text-xs opacity-55 truncate">{aposta.market}</p>
      </div>

      <span className="text-right text-sm tabular-nums opacity-80">{Number(aposta.odd).toFixed(2)}</span>
      <span className="text-right text-sm tabular-nums opacity-80">{formatCurrency(Number(aposta.stake))}</span>
      <ReturnValue aposta={aposta} className="text-sm text-right" />

      <Badge variant={statusVariant[status]} className="justify-self-start">{statusLabel[status]}</Badge>

      <span onClick={(e) => e.stopPropagation()} className="justify-self-end">
        <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
      </span>
    </div>
  );
}
