import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/format";
import { parsePtBrNumber } from "@/lib/format";
import { THRESHOLD_MAX, THRESHOLD_MIN, toPtBr, type usePreferencesForm } from "@/hooks/use-preferences-form";

type PreferencesFormState = ReturnType<typeof usePreferencesForm>;

export function PreferencesFields({
  form,
  labelClassName = "text-sm font-normal text-zinc-400",
}: {
  form: PreferencesFormState;
  labelClassName?: string;
}) {
  const stakeNum = parsePtBrNumber(form.stakeInput);
  const bankroll = Number.isFinite(stakeNum) && stakeNum > 0 ? stakeNum : 0;
  const thresholdInReais = bankroll > 0 ? (form.sliderValue / 100) * bankroll : null;

  return (
    <>
      <div className="space-y-1.5">
        <Label className={labelClassName}>Banca</Label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-zinc-500 pointer-events-none">R$</span>
          <Input
            inputMode="numeric"
            placeholder="3.000,00"
            className="min-h-[52px] rounded-lg pl-11 text-xl font-medium tabular-nums"
            value={form.stakeInput === "" ? "" : stakeNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              form.setStakeInput(digits ? toPtBr(Number(digits) / 100) : "");
            }}
          />
        </div>
        {form.stakeError ? (
          <p className="text-sm text-negative">{form.stakeError}</p>
        ) : (
          <p className="text-sm text-zinc-500">
            {bankroll > 0 ? `1 U = ${formatCurrency(bankroll / 100)} · 1% da banca.` : "Informe sua banca. Uma unidade (1 U) equivale a 1% desse valor."}
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
