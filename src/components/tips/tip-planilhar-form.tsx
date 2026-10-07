import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatOdd } from "@/lib/format";
import { toInput, type TipPlanilharForm } from "./use-tip-planilhar";
import type { TipItem } from "@/api/routes/get-tips";

const chipClass =
  "h-10 shrink-0 rounded-lg border border-border px-3 text-sm text-zinc-300 transition-colors hover:bg-foreground/[0.07]";

export function TipContextLine({ tip }: { tip: TipItem }) {
  const meta = [tip.house, tip.odd !== null && `odd ${formatOdd(tip.odd)}`].filter(Boolean).join(" · ");
  return (
    <div className="space-y-0.5">
      {tip.market && <p className="text-sm text-zinc-400">{tip.market}</p>}
      {meta && <p className="text-xs text-zinc-500">{meta}</p>}
    </div>
  );
}

// Stake + atalhos + linha de retorno. O campo de odd entra junto porque só
// aparece no modo "Editar", que os dois invólucros ligam do mesmo jeito; a
// casa fica de fora — no mobile é sheet com busca, no desktop é um select.
export function TipStakeFields({
  tip,
  form,
}: {
  tip: TipItem;
  form: TipPlanilharForm;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="tip-stake" className="text-sm text-zinc-400">
          Stake apostada
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-base text-zinc-500">
            R$
          </span>
          <Input
            id="tip-stake"
            inputMode="decimal"
            value={form.stake}
            onChange={(e) => form.setStake(e.target.value)}
            className="h-14 rounded-xl pl-12 text-2xl font-semibold tabular-nums"
            placeholder="0,00"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {tip.recommendedStake !== null && (
            <button
              type="button"
              className={chipClass}
              onClick={() => form.setStake(toInput(tip.recommendedStake))}
            >
              Sugerida <span className="text-zinc-500">{formatCurrency(tip.recommendedStake)}</span>
            </button>
          )}
          {tip.limit !== null && (
            <button
              type="button"
              className={chipClass}
              onClick={() => form.setStake(toInput(tip.limit))}
            >
              Limite <span className="text-zinc-500">{formatCurrency(tip.limit)}</span>
            </button>
          )}
        </div>
      </div>

      {form.valid && (
        <p className="text-sm tabular-nums text-zinc-400">
          Retorno {formatCurrency(form.retorno)} · lucro{" "}
          <span className="text-positive">{formatCurrency(form.retorno - form.stakeValue)}</span>
        </p>
      )}
    </>
  );
}

export function TipOddField({ form }: { form: TipPlanilharForm }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="tip-odd">Odd</Label>
      <Input
        id="tip-odd"
        inputMode="decimal"
        value={form.odd}
        onChange={(e) => form.setOdd(e.target.value)}
        placeholder="0,00"
      />
    </div>
  );
}
