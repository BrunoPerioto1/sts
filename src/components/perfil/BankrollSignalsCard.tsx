import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatCurrency, parsePtBrNumber } from "@/lib/format";
import { toPtBr, type usePreferencesForm } from "@/hooks/use-preferences-form";
import { DEFAULT_STALE_BET_DAYS } from "@/lib/house-activity";

type PreferencesFormState = ReturnType<typeof usePreferencesForm>;

function Field({ id, label, prefix, suffix, hint, error, children }: {
  id: string; label: string; prefix?: string; suffix?: string; hint: string; error: string | null; children: ReactNode;
}) {
  return (
    <div className="space-y-1.5 min-w-0">
      <Label htmlFor={id} className="text-[13px] font-normal text-zinc-400">{label}</Label>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">{prefix}</span>}
        {children}
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 pointer-events-none">{suffix}</span>}
      </div>
      <p className={cn("text-xs", error ? "text-negative" : "text-zinc-500")}>{error ?? hint}</p>
    </div>
  );
}

// Versão compacta (desktop) dos campos de PreferencesFields: os três lado a
// lado, limite de sinal digitado em vez de slider.
export function BankrollSignalsCard({ form }: { form: PreferencesFormState }) {
  const stakeNum = parsePtBrNumber(form.stakeInput);
  const bankroll = Number.isFinite(stakeNum) && stakeNum > 0 ? stakeNum : 0;
  const thresholdNum = parsePtBrNumber(form.thresholdInput);
  const inputClass = "h-10 rounded-lg tabular-nums";

  return (
    <section className="rounded-xl border border-border bg-card p-5" aria-labelledby="bankroll-title">
      <h2 id="bankroll-title" className="text-base font-semibold">Banca e sinais</h2>
      <p className="text-[13px] text-zinc-400 mt-1 mb-4">O bot do Telegram e a lista de casas usam estes valores.</p>
      <div className="grid grid-cols-3 gap-3">
        <Field
          id="pref-bankroll"
          label="Banca"
          prefix="R$"
          error={form.stakeError}
          hint={bankroll > 0 ? `1 U = ${formatCurrency(bankroll / 100)} · 1% da banca` : "1 U = 1% da banca"}
        >
          <Input
            id="pref-bankroll"
            inputMode="numeric"
            placeholder="3.000,00"
            className={cn(inputClass, "pl-9")}
            value={form.stakeInput === "" ? "" : stakeNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              form.setStakeInput(digits ? toPtBr(Number(digits) / 100) : "");
            }}
          />
        </Field>
        <Field
          id="pref-threshold"
          label="Avisar sinais acima de"
          suffix="%"
          error={form.thresholdError}
          hint={bankroll > 0 && Number.isFinite(thresholdNum) ? `≈ ${formatCurrency((thresholdNum / 100) * bankroll)} de stake` : "da banca, por sinal"}
        >
          <Input
            id="pref-threshold"
            inputMode="decimal"
            className={cn(inputClass, "pr-8")}
            value={form.thresholdInput}
            onChange={(e) => form.setThresholdInput(e.target.value.replace(/[^\d,]/g, "").slice(0, 5))}
          />
        </Field>
        <Field id="pref-stale" label="Sugerir saque após" suffix="dias" error={form.staleDaysError} hint="sem apostas na casa">
          <Input
            id="pref-stale"
            inputMode="numeric"
            placeholder={String(DEFAULT_STALE_BET_DAYS)}
            className={cn(inputClass, "pr-12")}
            value={form.staleDaysInput}
            onChange={(e) => form.setStaleDaysInput(e.target.value.replace(/\D/g, "").slice(0, 3))}
          />
        </Field>
      </div>
    </section>
  );
}
