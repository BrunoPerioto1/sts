import { useState } from "react";
import { ArrowSquareOut, Calculator, CaretDown, CaretRight, LinkSimple } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { actionToast } from "@/lib/action-toast";
import { formatMoney, formatOdd, formatPercent, houseDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TipItem } from "@/api/routes/get-tips";

// O canal manda um bloco de emojis; aqui ele vira os números que importam, em
// cards, e o texto cru fica atrás de "Texto original" pra quem quer conferir.
export function TipMessageSheet({
  tip,
  fair,
  open,
  onOpenChange,
  onOpenCalc,
}: {
  tip: TipItem;
  fair: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ausente quando a tip não traz odd justa: aí não há conta pra fazer aqui. */
  onOpenCalc?: () => void;
}) {
  const [rawOpen, setRawOpen] = useState(false);
  const casa = tip.house ? houseDisplayName(tip.house) : null;

  const stats: { label: string; value: string; highlight?: boolean }[] = [
    { label: "Odd", value: tip.odd !== null ? formatOdd(tip.odd) : "—", highlight: true },
    { label: "Odd justa", value: fair !== null ? formatOdd(fair) : "—" },
    { label: "Stake recomendada", value: tip.recommendedStake !== null ? formatMoney(tip.recommendedStake) : "—" },
    { label: "Limite", value: tip.limit !== null ? formatMoney(tip.limit) : "—" },
    { label: "% da banca", value: tip.percent !== null ? formatPercent(tip.percent / 100, { decimals: 2 }) : "—" },
  ];

  const copyLink = async () => {
    if (!tip.link) return;
    try {
      await navigator.clipboard.writeText(tip.link);
      actionToast.success({ title: "Link copiado" });
    } catch {
      actionToast.error({ description: "Não foi possível copiar o link." });
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={tip.game ?? "Mensagem do canal"}
      subHeader={
        <p className="text-xs text-zinc-500">
          {["Mensagem do canal", casa, tip.sport].filter(Boolean).join(" · ")}
        </p>
      }
      footer={
        tip.link ? (
          <div className="flex gap-2">
            <Button asChild size="lg" className="h-12 min-w-0 flex-1">
              <a href={tip.link} target="_blank" rel="noopener noreferrer">
                <ArrowSquareOut size={16} weight="bold" />
                <span className="truncate">{casa ? `Abrir na ${casa}` : "Abrir na casa"}</span>
              </a>
            </Button>
            <Button variant="secondary" className="h-12 w-12 shrink-0 rounded-lg p-0" aria-label="Copiar link" onClick={copyLink}>
              <LinkSimple size={17} />
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-5 pb-2">
        {tip.market && <p className="text-[15px] leading-snug">{tip.market}</p>}

        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 rounded-xl bg-foreground/[0.04] px-3.5 py-3">
              <p className="text-[11.5px] text-zinc-500">{s.label}</p>
              <p className={cn("truncate font-semibold tabular-nums", s.highlight ? "text-lg text-accent-text" : "text-[15px]")}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {onOpenCalc && (
          <button
            type="button"
            onClick={onOpenCalc}
            className="press flex h-12 w-full items-center gap-2.5 rounded-lg border border-border px-4 text-sm text-zinc-200 transition-colors hover:bg-foreground/[0.05]"
          >
            <Calculator size={17} />
            Odd mudou? Calcular quanto vale
            <CaretRight size={13} className="ml-auto text-zinc-500" />
          </button>
        )}

        <div>
          <button
            type="button"
            onClick={() => setRawOpen((v) => !v)}
            className="flex h-9 items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200"
          >
            {rawOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
            Texto original
          </button>
          {rawOpen && (
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-lg border border-border bg-foreground/[0.03] px-4 py-3 font-mono text-xs leading-relaxed text-zinc-300">
              {tip.text}
            </pre>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
