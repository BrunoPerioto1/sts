import { useState } from "react";
import { CheckCircle, PencilSimple, Copy, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMoney, formatDate, formatTime, formatOdd, houseDisplayName, signColor } from "@/lib/format";
import { SectionLabel } from "@/components/ui/section-label";
import { StatCard } from "@/components/ui/stat-card";
import { colorByResultId, mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { betDate } from "@/lib/bet-grouping";
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
  const house = aposta.houseName ? houseDisplayName(aposta.houseName) : null;

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
          {formatDate(betDate(aposta))} · {formatTime(betDate(aposta))}
          {house && ` · ${house}`}
        </p>
        {aposta.eventStartAt && (
          // Só aparece quando o jogo foi identificado: aí a data acima é a do
          // jogo, e esta é a de quando a aposta foi feita.
          <p className="text-xs text-zinc-600 -mt-3">
            Planilhada em {formatDate(aposta.betTime)} · {formatTime(aposta.betTime)}
          </p>
        )}

        <div className="space-y-1">
          <SectionLabel as="p">Lucro</SectionLabel>
          <p className={cn("px-1 text-2xl font-semibold tabular-nums", profit == null ? "text-muted" : signColor(profit))}>
            {profit != null ? formatMoney(profit, { signed: true }) : "—"}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-card p-3">
          <StatCard label="Cotação" value={formatOdd(aposta.odd)} />
          <StatCard label="Valor" value={formatMoney(stake)} />
          <StatCard label="Retorno" value={ganho != null ? formatMoney(ganho) : "—"} />
        </div>

        <div className="space-y-1.5">
          <SectionLabel as="p">Seleção</SectionLabel>
          <div
            className="flex items-start justify-between gap-2 rounded-md border-l-[3px] bg-card p-2.5"
            style={{ borderLeftColor: colorByResultId[String(aposta.resultId)] }}
          >
            <div className="min-w-0">
              <p className="text-sm leading-snug">{aposta.market}</p>
              <p className="text-xs opacity-55">
                {formatOdd(aposta.odd)}
                {house && ` · ${house}`}
              </p>
            </div>
            <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {onFinalize && (
            <Button
              size="lg"
              // Pendente: ação principal (azul). Já liquidada: a cor do resultado,
              // pra "Alterar liquidação" lembrar o que está registrado.
              className={cn(
                "w-full gap-2",
                profit != null && (profit >= 0 ? "bg-success-solid hover:bg-success-solid/90" : "bg-danger-solid hover:bg-danger-solid/90")
              )}
              onClick={() => setLiquidarOpen(true)}
            >
              <CheckCircle size={17} weight="fill" /> {status === "pendente" ? "Liquidar" : "Alterar liquidação"}
            </Button>
          )}
          <div className="grid grid-cols-3 gap-2">
            {onEdit && (
              <Button variant="secondary" className="gap-1.5" onClick={() => { onEdit(aposta); onClose(); }}>
                <PencilSimple size={14} /> Editar
              </Button>
            )}
            {onDuplicate && (
              <Button variant="secondary" className="gap-1.5" onClick={() => { onDuplicate(aposta); onClose(); }}>
                <Copy size={14} /> Duplicar
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" className="gap-1.5" onClick={() => { onDelete(aposta.id); onClose(); }}>
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
