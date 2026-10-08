import { useState } from "react";
import { Calculator, Check, CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/queries/use-me";
import { evaluateOdd, type OddVerdict } from "@/lib/odd-calc";
import { formatMoney, formatOdd, formatPercent, parsePtBrNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TipItem } from "@/api/routes/get-tips";

const verdictMeta: Record<OddVerdict, { icon: typeof CheckCircle; title: string; box: string }> = {
  ok: { icon: CheckCircle, title: "Ainda vale", box: "border-success/30 bg-success/[0.06] text-success" },
  warn: { icon: WarningCircle, title: "Vale pouco", box: "border-warning/30 bg-warning/[0.06] text-warning" },
  bad: { icon: XCircle, title: "Não vale mais", box: "border-danger/35 bg-danger/[0.07] text-danger" },
};

// A odd da tip envelhece: você volta da casa com a odd de agora e a pergunta é
// "ainda vale? quanto?". Mesma conta da calculadora que o canal linka, só que
// na sua banca e sem sair do app. "Apostei" segue pro planilhar já com a stake
// e a odd daqui.
export function TipOddCalcSheet({
  tip,
  fair,
  open,
  onOpenChange,
  onApostei,
  onDismiss,
}: {
  tip: TipItem;
  fair: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApostei: (values: { stake: number | null; odd: number }) => void;
  onDismiss: () => void;
}) {
  const { me } = useMe();
  const bankroll = me?.stake != null ? Number(me.stake) : null;
  const [oddInput, setOddInput] = useState(tip.odd !== null ? tip.odd.toFixed(2).replace(".", ",") : "");

  const odd = parsePtBrNumber(oddInput);
  const valid = Number.isFinite(odd) && odd > 1;
  const result = valid ? evaluateOdd({ odd, fair, tipOdd: tip.odd, limit: tip.limit, bankroll }) : null;
  const meta = result ? verdictMeta[result.verdict] : null;
  const VerdictIcon = meta?.icon;
  const vale = result !== null && result.verdict !== "bad";

  const body = !result
    ? null
    : result.verdict === "bad"
      ? `A ${formatOdd(odd)} está abaixo da odd justa (${formatOdd(fair)}). Melhor marcar como caiu.`
      : result.verdict === "warn"
        ? `A ${formatOdd(odd)} mal passa da odd justa. Se entrar, a stake cai junto.`
        : `A ${formatOdd(odd)} segue acima da odd justa. Stake ajustada à vantagem atual.`;

  // A % é o que dá pra comparar com a da tip (o 🔴 do canal); o valor em
  // reais depende da banca do Perfil.
  const percentLabel = vale ? formatPercent(result.percent / 100, { decimals: 2 }) : "—";
  const apostarLabel = vale && result.stake !== null ? formatMoney(result.stake) : "—";

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Odd mudou?"
      subHeader={tip.market && <p className="text-sm text-zinc-400">{tip.market}</p>}
      footer={
        <div className="space-y-2">
          <Button
            size="lg"
            className="h-12 w-full border-transparent bg-success-solid text-base text-white hover:bg-success-solid/90"
            disabled={!vale}
            onClick={() => result && onApostei({ stake: result.stake, odd })}
          >
            <Check size={16} weight="bold" />
            {!result ? "Informe a odd" : vale ? (result.stake !== null ? `Apostei ${formatMoney(result.stake)}` : "Apostei") : "Não vale apostar"}
          </Button>
          <Button variant="secondary" className="h-11 w-full border-danger/30 text-danger hover:bg-danger/10" onClick={onDismiss}>
            Não vale mais · caiu
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-foreground/[0.04] px-4 py-3">
            <p className="text-xs text-zinc-500">Odd da tip</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{tip.odd !== null ? formatOdd(tip.odd) : "—"}</p>
          </div>
          <div className="rounded-xl bg-foreground/[0.04] px-4 py-3">
            <p className="text-xs text-zinc-500">Odd justa</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums">{formatOdd(fair)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="calc-odd" className="text-xs font-medium uppercase tracking-wider text-muted">
            Odd que está na casa agora
          </Label>
          <div className="relative">
            <Calculator size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <Input
              id="calc-odd"
              inputMode="decimal"
              autoFocus
              value={oddInput}
              onChange={(e) => setOddInput(e.target.value)}
              onFocus={(e) => e.target.select()}
              className="h-14 rounded-xl pl-12 text-2xl font-semibold tabular-nums"
              placeholder="0,00"
            />
          </div>
        </div>

        {result && meta && VerdictIcon && (
          <div className={cn("space-y-2 rounded-xl border px-4 py-3.5", meta.box)}>
            <p className="flex items-center gap-2 text-base font-semibold">
              <VerdictIcon size={20} weight="fill" />
              {meta.title}
            </p>
            <p className="text-sm leading-relaxed text-zinc-400">{body}</p>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <p className="text-xs text-zinc-500">% da banca</p>
                <p className="text-[17px] font-semibold tabular-nums">{percentLabel}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Apostar</p>
                <p className="text-[17px] font-semibold tabular-nums">{apostarLabel}</p>
              </div>
            </div>
            {bankroll === null && vale && (
              <p className="text-xs text-zinc-500">Defina sua banca no Perfil para ver a stake em reais.</p>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
