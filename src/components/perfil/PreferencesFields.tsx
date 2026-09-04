import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { THRESHOLD_MAX, THRESHOLD_MIN, toPtBr, type usePreferencesForm } from "@/hooks/use-preferences-form";

type PreferencesFormState = ReturnType<typeof usePreferencesForm>;

export function PreferencesFields({ form, labelClassName = "text-xs uppercase tracking-wider text-zinc-500" }: {
  form: PreferencesFormState;
  labelClassName?: string;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label className={labelClassName}>Stake padrão</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">R$</span>
          <Input
            inputMode="decimal"
            placeholder="100,00"
            className="pl-9"
            value={form.stakeInput}
            onChange={(e) => form.setStakeInput(e.target.value)}
          />
        </div>
        {form.stakeError && <p className="text-xs text-negative">{form.stakeError}</p>}
        <p className="text-xs text-zinc-500">Valor padrão usado ao registrar uma nova aposta.</p>
      </div>

      <div className="space-y-1.5">
        <Label className={labelClassName}>Filtro de banca para notificação</Label>
        <div className="relative">
          <Input
            inputMode="decimal"
            className="pr-8"
            value={form.thresholdInput}
            onChange={(e) => form.setThresholdInput(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">%</span>
        </div>
        <Slider
          value={[form.sliderValue]}
          min={THRESHOLD_MIN}
          max={THRESHOLD_MAX}
          step={0.01}
          onValueChange={([v]) => form.setThresholdInput(toPtBr(v))}
          className="py-1"
        />
        {form.thresholdError ? (
          <p className="text-xs text-negative">{form.thresholdError}</p>
        ) : (
          <p className="text-xs text-zinc-500">Só recebe notificação do bot quando o sinal indicar stake acima desta porcentagem da banca.</p>
        )}
      </div>
    </>
  );
}
