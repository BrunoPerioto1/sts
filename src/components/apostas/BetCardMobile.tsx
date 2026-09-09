import { Clock } from "@phosphor-icons/react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { stagger } from "@/lib/motion";
import { tapHaptic } from "@/lib/haptics";
import { mapResultToStatus, statusLabel, type Status } from "@/lib/bet-status";
import { betDate } from "@/lib/bet-grouping";
import type { BetItem } from "@/api/routes/get-bets";
import { useLongPress } from "@/hooks/apostas/use-long-press";
import type { BulkSelection } from "@/hooks/apostas/use-bulk-selection";
import { ReturnValue } from "./ReturnValue";

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
const houseChipClass = "inline-flex items-center min-w-0 h-6 text-xs leading-none px-2.5 rounded-full border border-accent/25 bg-accent/[0.08] text-accent-100";

export function BetCardMobile({
  aposta,
  onOpen,
  selection,
  index = 0,
}: {
  aposta: BetItem;
  onOpen: () => void;
  selection: BulkSelection;
  index?: number;
}) {
  const status = mapResultToStatus(aposta);
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
        isSelected ? "ring-2 ring-accent/60 bg-accent/[0.08]" : "bg-card"
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
          <Clock size={12} weight="bold" /> {formatTime(betDate(aposta))}
        </span>
        <span className={oddChipClass}>@{Number(aposta.odd).toFixed(2)}</span>
        {aposta.houseName && <span className={houseChipClass} title={aposta.houseName}><span className="truncate">{aposta.houseName}</span></span>}
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
