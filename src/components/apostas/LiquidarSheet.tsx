import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { colorByResultId, mapResultToStatus, previewProfit } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { BottomSheet } from "./BottomSheet";
import { OptionBar } from "./OptionRow";
import { CashoutSheet } from "./CashoutSheet";

const rows: { resultId: ResultIdEnum; label: string; section: "RESULTADO" | "PARCIAL" }[] = [
  { resultId: ResultIdEnum.WON, label: "Ganha", section: "RESULTADO" },
  { resultId: ResultIdEnum.LOST, label: "Perdida", section: "RESULTADO" },
  { resultId: ResultIdEnum.HALF_WON, label: "Meia ganha", section: "PARCIAL" },
  { resultId: ResultIdEnum.HALF_LOST, label: "Meia perdida", section: "PARCIAL" },
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
          {aposta.game} · {formatCurrency(stake)} @ {odd.toFixed(2)}
        </p>

        {(["RESULTADO", "PARCIAL"] as const).map((section) => (
          <div key={section}>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1">{section}</p>
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
                      className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-white/[0.04]"
                    >
                      <OptionBar color={colorByResultId[String(r.resultId)]} />
                      <span className="flex-1 text-sm text-white">{r.label}</span>
                      <span className={cn("text-sm font-medium tabular-nums", value >= 0 ? "text-positive" : "text-negative")}>
                        {formatSignedCurrency(value)}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1">ENCERRAMENTO</p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => setCashoutOpen(true)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-white/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.CASHOUT)]} />
              <span className="flex-1 text-sm text-white">Cashout</span>
              <span className="text-sm text-zinc-500">Informar valor</span>
            </button>
            <button
              type="button"
              onClick={() => finalize(ResultIdEnum.CANCELED)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-white/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.CANCELED)]} />
              <span className="flex-1 text-sm text-white">Cancelada</span>
              <span className="text-sm font-medium tabular-nums text-zinc-300">{formatCurrency(0)}</span>
            </button>
          </div>
        </div>

        {mapResultToStatus(aposta) !== "pendente" && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1">PENDENTE</p>
            <button
              type="button"
              onClick={() => finalize(ResultIdEnum.PENDING)}
              className="press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[44px] text-left hover:bg-white/[0.04]"
            >
              <OptionBar color={colorByResultId[String(ResultIdEnum.PENDING)]} />
              <span className="flex-1 text-sm text-white">Pendente</span>
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
