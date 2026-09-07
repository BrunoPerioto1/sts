import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime } from "@/lib/format";
import { mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { ReturnValue } from "./ReturnValue";
import { RowActions } from "./RowActions";

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
        "group flex items-center gap-3 py-[10px] px-2 -mx-2 border-b border-border last:border-b-0 rounded-md transition-colors",
        selection.selectionMode && "cursor-pointer",
        isSelected && "bg-accent/[0.08]"
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

      <span className="text-xs tabular-nums opacity-50 shrink-0 w-[46px]">{formatTime(aposta.betTime)}</span>

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
