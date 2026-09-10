import { Check } from "lucide-react";
import { type MatchedTip } from "@/api/routes/post-parse-image";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MatchedTipsCardProps {
  tips: MatchedTip[];
  selected: number | undefined;
  onSelect: (tipId: number | undefined) => void;
}

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * Pendências que batem com o bilhete lido. A melhor candidata já vem marcada,
 * mas nada é vinculado sem o usuário confirmar no submit — e "Não vincular"
 * está sempre disponível.
 */
export function MatchedTipsCard({ tips, selected, onSelect }: MatchedTipsCardProps) {
  if (!tips.length) return null;

  return (
    <section className="space-y-2 rounded-lg border border-white/10 bg-[var(--color-surface)] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium">
          {tips.length === 1
            ? "1 tip pendente bate com esta aposta"
            : `${tips.length} tips pendentes batem com esta aposta`}
        </h3>
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className={cn(
            "rounded px-2 py-1 text-[11px] transition-colors",
            selected === undefined ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white",
          )}
        >
          Não vincular
        </button>
      </div>

      <ul className="space-y-2">
        {tips.map((tip) => {
          const on = selected === tip.tipId;
          return (
            <li key={tip.tipId}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? undefined : tip.tipId)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-[11px] border p-3 text-left transition-colors",
                  on
                    ? "border-accent/50 bg-accent/10"
                    : "border-white/10 bg-[var(--color-bg)] hover:border-white/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px]",
                    on ? "bg-accent" : "border border-white/25",
                  )}
                >
                  {on && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span className="block truncate text-xs font-medium">{tip.event}</span>
                  <span className="block truncate text-[11px] text-zinc-400">{tip.market}</span>
                  <span className="block text-[11px] tabular-nums text-zinc-500">
                    {tip.odd !== null && `odd ${tip.odd.toFixed(2)}`}
                    {tip.stake !== null && ` · stake sugerida ${formatCurrency(tip.stake)}`}
                    {` · ${time(tip.at)}`}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] leading-snug text-zinc-500">
        Vincular à tip pendente — ela sai da fila de Tips e o resultado volta para o canal.
      </p>
    </section>
  );
}
