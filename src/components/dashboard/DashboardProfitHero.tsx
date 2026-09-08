import type { CSSProperties } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatSignedCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

/** Linha "3 dias positivos · 1 negativo" que acompanha o número-herói. */
export function daysSummary(dailyData: DailySummaryPoint[]): string {
  if (dailyData.length === 0) return "Nenhum dia com resultado";
  if (dailyData.length === 1)
    return `1 dia com resultado · ${format(parseISO(dailyData[0].date), "d MMM", { locale: ptBR })}`;

  const positives = dailyData.filter((d) => d.profitDay > 0).length;
  const negatives = dailyData.filter((d) => d.profitDay < 0).length;
  const neutrals = dailyData.filter((d) => d.profitDay === 0).length;
  return [
    `${positives} dia${positives === 1 ? "" : "s"} positivo${positives === 1 ? "" : "s"}`,
    `${negatives} negativo${negatives === 1 ? "" : "s"}`,
    neutrals > 0 ? `${neutrals} neutro${neutrals === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Número-herói do dashboard, igual nas duas larguras: rótulo pequeno, valor
 * grande contando até o total e a linha de resumo dos dias. `resetKey` muda
 * junto do período pra contagem recomeçar do zero em vez de interpolar do
 * valor antigo pro novo.
 */
export function DashboardProfitHero({
  profit,
  summary,
  color,
  resetKey,
  size = "mobile",
  className,
  style,
}: {
  profit: number;
  summary: string;
  color?: string;
  resetKey: string;
  size?: "mobile" | "desktop";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn("min-w-0", className)} style={style}>
      <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1.5">Lucro líquido</p>
      <p
        className={cn(
          "font-semibold tabular-nums leading-tight tracking-tight",
          size === "desktop" ? "text-[clamp(2rem,2.4vw,2.5rem)]" : "text-[clamp(1.75rem,9vw,2.5rem)]"
        )}
        style={{ color }}
      >
        <AnimatedNumber key={resetKey} value={profit} format={formatSignedCurrency} />
      </p>
      <p className={cn("text-zinc-300", size === "desktop" ? "text-[13px] mt-3" : "text-sm mt-1")}>{summary}</p>
    </div>
  );
}
