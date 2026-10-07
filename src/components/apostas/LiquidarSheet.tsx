import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatMoney, formatOdd, signColor } from "@/lib/format";
import { SectionLabel } from "@/components/ui/section-label";
import { colorByResultId, mapResultToStatus, previewProfit } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { BottomSheet } from "./BottomSheet";
import { OptionBar } from "./OptionRow";
import { CashoutSheet } from "./CashoutSheet";

const rows: { resultId: ResultIdEnum; label: string; section: "Resultado" | "Parcial" }[] = [
  { resultId: ResultIdEnum.WON, label: "Ganha", section: "Resultado" },
  { resultId: ResultIdEnum.LOST, label: "Perdida", section: "Resultado" },
  { resultId: ResultIdEnum.HALF_WON, label: "Meia ganha", section: "Parcial" },
  { resultId: ResultIdEnum.HALF_LOST, label: "Meia perdida", section: "Parcial" },
];

export function LiquidarSheet({
  open,
  onOpenChange,
  aposta,
  onFinalize,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aposta: BetItem;
  onFinalize: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  // Fecha o LiquidarSheet E o ApostaDetailSheet por trás — depois de liquidar
  // volta pra listagem, mesmo comportamento de antes.
  onDone: () => void;
}) {
  const [cashoutOpen, setCashoutOpen] = useState(false);
  const stake = Number(aposta.stake);
  const odd = Number(aposta.odd);

  const finalize = (resultId: ResultIdEnum) => {
    onFinalize(aposta.id, resultId);
    onDone();
  };

  return (
    <BottomSheet nested open={open} onOpenChange={onOpenChange} title="Liquidar">
      <div className="pb-4 space-y-4">
        <p className="text-sm text-zinc-500 -mt-1 truncate">
          {aposta.game} · {formatMoney(stake)} @ {formatOdd(odd)}
        </p>

        {(["Resultado", "Parcial"] as const).map((section) => (
          <div key={section} className="space-y-1">
            <SectionLabel as="h3">{section}</SectionLabel>
            <div className="flex flex-col gap-1">
              {rows
                .filter((r) => r.section === section)
                .map((r) => {
                  const value = previewProfit(r.resultId, stake, odd);
                  return (
                    <button
                      key={r.resultId}
                      type="button"
                      onClick={() => finalize(r.resultId)}
                      className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-foreground/[0.04]"
                    >
                      <OptionBar color={colorByResultId[String(r.resultId)]} />
                      <span className="flex-1 text-sm text-foreground">{r.label}</span>
                      <span className={cn("text-sm font-medium tabular-nums", signColor(value))}>
                        {formatMoney(value, { signed: true })}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        <div className="space-y-1">
          <SectionLabel as="h3">Encerramento</SectionLabel>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setCashoutOpen(true)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-foreground/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.CASHOUT)]} />
              <span className="flex-1 text-sm text-foreground">Cashout</span>
              <span className="text-sm text-zinc-500">Informar valor</span>
            </button>
            <button
              type="button"
              onClick={() => finalize(ResultIdEnum.CANCELED)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-foreground/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.CANCELED)]} />
              <span className="flex-1 text-sm text-foreground">Cancelada</span>
              <span className={cn("text-sm font-medium tabular-nums", signColor(0))}>{formatMoney(0)}</span>
            </button>
          </div>
        </div>

        {mapResultToStatus(aposta) !== "pendente" && (
          <div className="space-y-1">
            <SectionLabel as="h3">Pendente</SectionLabel>
            <button
              type="button"
              onClick={() => finalize(ResultIdEnum.PENDING)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-foreground/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.PENDING)]} />
              <span className="flex-1 text-sm text-foreground">Pendente</span>
              <span className="text-sm text-zinc-500">Sem resultado</span>
            </button>
          </div>
        )}
      </div>

      <CashoutSheet
        open={cashoutOpen}
        onOpenChange={setCashoutOpen}
        onConfirm={(value) => {
          onFinalize(aposta.id, ResultIdEnum.CASHOUT, value);
          onDone();
        }}
      />
    </BottomSheet>
  );
}
