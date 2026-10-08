import { Badge } from "@/components/ui/badge";
import { SelectCheckButton } from "@/components/ui/select-check";
import { cn } from "@/lib/utils";
import { formatMoney, formatTime, formatOdd, houseDisplayName } from "@/lib/format";
import { mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { betDate } from "@/lib/bet-grouping";
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

  const handleSelect = (shiftKey: boolean) => {
    if (shiftKey) selection.selectRange(orderedIds, aposta.id);
    else if (!selection.selectionMode) selection.enter(aposta.id);
    else selection.toggle(aposta.id);
  };

  // Fora do modo de seleção, clique na linha não faz nada — só o shift, que
  // já começa a seleção pelo intervalo (igual à tela de Tips).
  const handleRowClick = (e: React.MouseEvent) => {
    if (!selection.selectionMode && !e.shiftKey) return;
    handleSelect(e.shiftKey);
  };

  // Shift+clique selecionaria o texto entre os dois cliques.
  const preventShiftTextSelection = (e: React.MouseEvent) => {
    if (e.shiftKey) e.preventDefault();
  };

  return (
    <div
      className={cn(
        BET_GRID,
        "group py-[7px] px-2 -mx-2 rounded-md transition-colors duration-150",
        selection.selectionMode && "cursor-pointer",
        // Hover é percebido, não anunciado; seleção é clara, não dominante. O
        // verde/vermelho do resultado segue sendo o mais forte da linha.
        isSelected
          ? "bg-accent/[0.1] hover:bg-accent/[0.14]"
          : "hover:bg-foreground/[0.025]"
      )}
      onClick={handleRowClick}
      onMouseDown={preventShiftTextSelection}
    >
      <span
        className={cn("transition-opacity", selection.selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* onClick traz o shiftKey (intervalo). Círculo no accent, como em
            Tips e Conferência: verde aqui competia com o resultado. */}
        <SelectCheckButton
          checked={isSelected}
          onClick={(e) => handleSelect(e.shiftKey)}
          label="Selecionar aposta"
        />
      </span>

      <span className="text-xs tabular-nums opacity-45">{formatTime(betDate(aposta))}</span>

      <span className="text-xs opacity-55 truncate">{aposta.houseName ? houseDisplayName(aposta.houseName) : ""}</span>

      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{aposta.game}</p>
        <p className="text-xs opacity-55 truncate">{aposta.market}</p>
      </div>

      <span className="text-right text-sm tabular-nums opacity-80">{formatOdd(aposta.odd)}</span>
      <span className="text-right text-sm tabular-nums opacity-80">{formatMoney(Number(aposta.stake))}</span>
      <ReturnValue aposta={aposta} className="text-sm text-right" />

      <Badge variant={statusVariant[status]} className="justify-self-start">{statusLabel[status]}</Badge>

      <span onClick={(e) => e.stopPropagation()} className="justify-self-end">
        <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
      </span>
    </div>
  );
}
