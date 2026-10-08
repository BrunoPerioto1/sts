import { Check, Warning } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMoney, formatOdd, houseDisplayName } from "@/lib/format";
import type { TipItem } from "@/api/routes/get-tips";

// Sem stake ou odd o lote recusa a tip (tipPlanilharDefaults): avisa antes,
// em vez de deixar o toast de falha explicar depois.
const incompleta = (tip: TipItem) => !(tip.recommendedStake! > 0) || !(tip.odd! > 1);

function TipBatchList({ tips }: { tips: TipItem[] }) {
  return (
    <ul className="space-y-2">
      {tips.map((tip) => (
        <li key={tip.id} className="flex items-start gap-3 rounded-xl bg-foreground/[0.04] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">{tip.game ?? "Jogo não identificado"}</p>
            {tip.market && <p className="mt-0.5 truncate text-sm text-zinc-400">{tip.market}</p>}
            <p className="mt-1 text-xs text-zinc-500">
              {tip.house ? houseDisplayName(tip.house) : "Casa não reconhecida"}
              {tip.odd != null && ` · odd ${formatOdd(tip.odd)}`}
            </p>
            {incompleta(tip) && (
              <p className="mt-1.5 flex items-center gap-1 text-xs text-warning">
                <Warning size={13} weight="fill" /> Sem stake ou odd — planilhe esta sozinha
              </p>
            )}
          </div>
          <p className="shrink-0 text-[15px] font-semibold tabular-nums">
            {tip.recommendedStake !== null ? formatMoney(tip.recommendedStake) : "—"}
          </p>
        </li>
      ))}
    </ul>
  );
}

// Revisão do "Apostei" em lote: cada tip vai com a stake sugerida, a odd e a
// casa do sinal. No celular é sheet, como o resto do fluxo de planilhar.
export function TipBatchReview({
  tips,
  isMobile,
  onOpenChange,
  onConfirm,
}: {
  tips: TipItem[] | null;
  isMobile: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tips: TipItem[]) => void;
}) {
  const list = tips ?? [];
  const total = list.reduce((sum, tip) => sum + (tip.recommendedStake ?? 0), 0);
  const title = `Apostei em ${list.length} ${list.length === 1 ? "tip" : "tips"}`;
  const hint = "Cada uma vai para Apostas com a stake, a odd e a casa abaixo.";

  const confirm = (
    <Button
      size="lg"
      className="h-12 w-full border-transparent bg-success-solid text-base text-white hover:bg-success-solid/90"
      disabled={list.length === 0}
      onClick={() => onConfirm(list)}
    >
      <Check size={16} weight="bold" />
      Planilhar {formatMoney(total)}
    </Button>
  );

  const totalRow = (
    <div className="flex items-baseline justify-between border-t border-border pt-3 text-sm">
      <span className="text-zinc-400">Stake total</span>
      <span className="text-base font-semibold tabular-nums">{formatMoney(total)}</span>
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={tips !== null}
        onOpenChange={onOpenChange}
        title={title}
        subHeader={<p className="text-sm text-zinc-400">{hint}</p>}
        footer={confirm}
      >
        <div className="space-y-4 pb-2">
          <TipBatchList tips={list} />
          {totalRow}
        </div>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={tips !== null} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="batch-description" className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p id="batch-description" className="text-sm text-zinc-400">{hint}</p>
        </DialogHeader>
        <div className="max-h-[50dvh] overflow-y-auto">
          <TipBatchList tips={list} />
        </div>
        {totalRow}
        {confirm}
      </DialogContent>
    </Dialog>
  );
}
