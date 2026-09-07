import { useState } from "react";
import { CheckCircle, PencilSimple, Copy, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatSignedCurrency, formatTime } from "@/lib/format";
import { colorByResultId, mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { BottomSheet } from "./BottomSheet";
import { LiquidarSheet } from "./LiquidarSheet";

export function ApostaDetailSheet({
  aposta,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
}: {
  aposta: BetItem | null;
  onClose: () => void;
  onEdit?: (a: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (a: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
}) {
  const [liquidarOpen, setLiquidarOpen] = useState(false);

  if (!aposta) return null;
  const status = mapResultToStatus(aposta);
  const stake = Number(aposta.stake);
  const profit = aposta.profit != null ? Number(aposta.profit) : null;
  const ganho = status !== "pendente" && profit != null ? stake + profit : null;

  return (
    <BottomSheet
      open={!!aposta}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={<span className="truncate block max-w-[240px]">{aposta.game}</span>}
    >
      <div className="pb-4 space-y-4">
        <p className="text-sm text-zinc-500 -mt-1">
          {formatDate(aposta.betTime)} · {formatTime(aposta.betTime)}
          {aposta.houseName && ` · ${aposta.houseName}`}
        </p>

        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500 mb-1">Lucro</p>
          <p className={cn("text-2xl font-semibold tabular-nums", profit == null ? "opacity-45" : profit >= 0 ? "text-positive" : "text-negative")}>
            {profit != null ? formatSignedCurrency(profit) : "—"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 border border-border rounded-md p-3">
          <div>
            <p className="text-xs uppercase tracking-wide opacity-55 mb-1">Cotação</p>
            <p className="text-sm font-medium tabular-nums">{Number(aposta.odd).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide opacity-55 mb-1">Valor</p>
            <p className="text-sm font-medium tabular-nums">{formatCurrency(stake)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide opacity-55 mb-1">Retorno</p>
            <p className="text-sm font-medium tabular-nums">{ganho != null ? formatCurrency(ganho) : "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide opacity-55 mb-1.5">Seleção</p>
          <div
            className="flex items-start justify-between gap-2 rounded-md border-l-[3px] bg-card p-2.5"
            style={{ borderLeftColor: colorByResultId[String(aposta.resultId)] }}
          >
            <div className="min-w-0">
              <p className="text-sm leading-snug">{aposta.market}</p>
              <p className="text-xs opacity-55">
                {Number(aposta.odd).toFixed(2)}
                {aposta.houseName && ` · ${aposta.houseName}`}
              </p>
            </div>
            <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {onFinalize && (
            <Button
              className={cn(
                "w-full min-h-[44px] gap-2 border-transparent text-white font-bold hover:opacity-90 active:opacity-90",
                profit == null ? "bg-accent" : profit >= 0 ? "bg-green-600" : "bg-red-600"
              )}
              style={{ boxShadow: "var(--shadow-sm)" }}
              onClick={() => setLiquidarOpen(true)}
            >
              <CheckCircle size={17} weight="fill" /> {status === "pendente" ? "Liquidar" : "Alterar liquidação"}
            </Button>
          )}
          <div className="grid grid-cols-3 gap-2">
            {onEdit && (
              <Button variant="outline" className="gap-1.5" onClick={() => { onEdit(aposta); onClose(); }}>
                <PencilSimple size={14} /> Editar
              </Button>
            )}
            {onDuplicate && (
              <Button variant="outline" className="gap-1.5" onClick={() => { onDuplicate(aposta); onClose(); }}>
                <Copy size={14} /> Duplicar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                className="gap-1.5 border-negative/40 text-negative hover:bg-negative/10 hover:text-negative"
                onClick={() => { onDelete(aposta.id); onClose(); }}
              >
                <Trash size={14} /> Excluir
              </Button>
            )}
          </div>
        </div>
      </div>

      {onFinalize && (
        <LiquidarSheet
          open={liquidarOpen}
          onOpenChange={setLiquidarOpen}
          aposta={aposta}
          onFinalize={onFinalize}
          onDone={() => {
            setLiquidarOpen(false);
            onClose();
          }}
        />
      )}
    </BottomSheet>
  );
}
