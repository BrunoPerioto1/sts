import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/format";
import { parsePtBrNumber } from "@/lib/format";
import { THRESHOLD_MAX, THRESHOLD_MIN, toPtBr, type usePreferencesForm } from "@/hooks/use-preferences-form";

type PreferencesFormState = ReturnType<typeof usePreferencesForm>;

export function PreferencesFields({
  form,
  bankroll = 0,
  labelClassName = "text-sm font-normal text-zinc-400",
}: {
  form: PreferencesFormState;
  // Saldo somado das casas — usado só pra traduzir os percentuais em reais.
  bankroll?: number;
  labelClassName?: string;
}) {
  const stakeNum = parsePtBrNumber(form.stakeInput);
  const stakeShare = bankroll > 0 && Number.isFinite(stakeNum) && stakeNum > 0 ? (stakeNum / bankroll) * 100 : null;
  const thresholdInReais = bankroll > 0 ? (form.sliderValue / 100) * bankroll : null;

  return (
    <>
      <div className="space-y-1.5">
        <Label className={labelClassName}>Stake padrão</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-zinc-500 pointer-events-none">R$</span>
          <Input
            inputMode="decimal"
            placeholder="100,00"
            className="min-h-[52px] rounded-lg pl-11 text-xl font-medium tabular-nums"
            value={form.stakeInput}
            onChange={(e) => form.setStakeInput(e.target.value)}
          />
        </div>
        {form.stakeError ? (
          <p className="text-sm text-negative">{form.stakeError}</p>
        ) : (
          <p className="text-sm text-zinc-500">
            Valor sugerido ao registrar uma aposta
            {stakeShare != null && ` — ${stakeShare.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% da banca atual`}.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <Label className={labelClassName}>Avisar só acima de</Label>
          <span className="text-base font-medium text-accent tabular-nums">{form.thresholdInput}%</span>
        </div>
        <Slider
          value={[form.sliderValue]}
          min={THRESHOLD_MIN}
          max={THRESHOLD_MAX}
          step={0.01}
          onValueChange={([v]) => form.setThresholdInput(toPtBr(v))}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>0%</span>
          <span>{THRESHOLD_MAX}%</span>
        </div>
        {form.thresholdError ? (
          <p className="text-sm text-negative">{form.thresholdError}</p>
        ) : (
          <p className="text-sm text-zinc-500">
            {thresholdInReais != null
              ? `Equivale a ${formatCurrency(thresholdInReais)} de stake. Sinal abaixo disso não vira notificação.`
              : "Só recebe notificação do bot quando o sinal indicar stake acima desta porcentagem da banca."}
          </p>
        )}
      </div>
    </>
  );
}
