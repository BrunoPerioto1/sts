import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime, formatOdd } from "@/lib/format";
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
        // color-mix e não bg-accent/[x]: o accent é var(), e aí o Tailwind 3
        // não gera a opacidade (a classe sai vazia).
        isSelected
          ? "bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)]"
          : "hover:bg-foreground/[0.025]"
      )}
      onClick={handleRowClick}
      onMouseDown={preventShiftTextSelection}
    >
      <span
        className={cn("transition-opacity", selection.selectionMode || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          // onClick e não onCheckedChange: é o que traz o shiftKey. O checked
          // é controlado, então o Radix não alterna nada sozinho.
          onClick={(e) => handleSelect(e.shiftKey)}
          aria-label="Selecionar aposta"
          // Verde apagado (sem o neon do padrão) e borda que acende no hover:
          // o checkbox indica a seleção sem competir com o resultado.
          className="transition-colors duration-150 group-hover:border-foreground/45 data-[state=checked]:bg-[color-mix(in_srgb,var(--color-positive)_62%,var(--color-bg))]"
        />
      </span>

      <span className="text-xs tabular-nums opacity-45">{formatTime(betDate(aposta))}</span>

      <span className="text-[11px] uppercase tracking-wide opacity-45 truncate">{aposta.houseName}</span>

      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{aposta.game}</p>
        <p className="text-xs opacity-55 truncate">{aposta.market}</p>
      </div>

      <span className="text-right text-sm tabular-nums opacity-80">{formatOdd(aposta.odd)}</span>
      <span className="text-right text-sm tabular-nums opacity-80">{formatCurrency(Number(aposta.stake))}</span>
      <ReturnValue aposta={aposta} className="text-sm text-right" />

      <Badge variant={statusVariant[status]} className="justify-self-start">{statusLabel[status]}</Badge>

      <span onClick={(e) => e.stopPropagation()} className="justify-self-end">
        <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
      </span>
    </div>
  );
}
