import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardBySport, type SportBreakdown } from "@/api/routes/get-dashboard-by-sport";
import { performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { formatInt, formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./DashboardCard";

// Quatro esportes com cor própria; do quinto em diante vira "Outros", em cinza.
const SLOTS = 4;
const SLOT_COLORS = ["var(--sport-1)", "var(--sport-2)", "var(--sport-3)", "var(--sport-4)"];
const OTHERS_COLOR = "color-mix(in srgb, var(--color-text) 22%, transparent)";
// A cor segue o esporte, não a posição: futebol é sempre o azul, mesmo quando
// um filtro muda quem aparece. Os demais pegam o primeiro slot livre.
const PREFERRED = ["futebol", "basquete", "tênis"];

interface Slice extends SportBreakdown {
  color: string;
  share: number;
}

function slices(rows: SportBreakdown[]): Slice[] {
  const total = rows.reduce((sum, r) => sum + r.bets, 0) || 1;
  const named = rows.length > SLOTS ? rows.slice(0, SLOTS) : rows;
  const rest = rows.length > SLOTS ? rows.slice(SLOTS) : [];

  const taken = new Map<string, number>();
  for (const r of named) {
    const preferred = PREFERRED.indexOf(r.sport.toLowerCase());
    if (preferred >= 0) taken.set(r.sport, preferred);
  }
  const free = [0, 1, 2, 3].filter((i) => ![...taken.values()].includes(i));
  for (const r of named) if (!taken.has(r.sport)) taken.set(r.sport, free.shift()!);

  const out: Slice[] = named.map((r) => ({ ...r, color: SLOT_COLORS[taken.get(r.sport)!], share: r.bets / total }));
  if (rest.length) {
    const bets = rest.reduce((sum, r) => sum + r.bets, 0);
    out.push({ sport: "Outros", bets, profit: rest.reduce((sum, r) => sum + r.profit, 0), color: OTHERS_COLOR, share: bets / total });
  }
  return out;
}

/**
 * Parte das apostas que vai pra cada esporte (a barra) e o lucro de cada um
 * (a lista). Segue os filtros de casa e esporte do topo.
 */
export function SportsCard({
  filters,
  colors,
  className,
  style,
}: {
  filters: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  colors: DashboardPreferences["performanceColors"];
  className?: string;
  style?: React.CSSProperties;
}) {
  const { startDate, endDate, houseIds, sportIds } = filters;
  const { data = [] } = useQuery({
    queryKey: ["dashboard", "by-sport", houseIds.join(","), sportIds.join(","), startDate, endDate],
    queryFn: () => getDashboardBySport({ startDate, endDate, houseIds, sportIds }),
    enabled: Boolean(startDate && endDate),
  });
  const [hover, setHover] = useState<string | null>(null);
  const parts = slices(data);
  const total = data.reduce((sum, r) => sum + r.bets, 0);

  return (
    <DashboardCard
      title="Por esporte"
      right={total > 0 ? <span className="text-xs text-zinc-500">{formatInt(total)} apostas</span> : undefined}
      className={className}
      style={style}
    >
      {total === 0 ? (
        <p className="flex flex-1 items-center text-[13px] text-zinc-400">Nenhuma aposta no período.</p>
      ) : (
        <>
          {/* Fatias separadas por 2px de fundo, pontas arredondadas só nas bordas da barra. */}
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" onMouseLeave={() => setHover(null)}>
            {parts.map((p) => (
              <span
                key={p.sport}
                title={`${p.sport} · ${formatPercent(p.share, { decimals: 0 })} · ${formatInt(p.bets)} apostas`}
                onMouseEnter={() => setHover(p.sport)}
                className="h-full transition-opacity duration-150"
                style={{ width: `${p.share * 100}%`, minWidth: 4, background: p.color, opacity: hover && hover !== p.sport ? 0.35 : 1 }}
              />
            ))}
          </div>

          <ul className="mt-5 flex flex-1 flex-col justify-between gap-1" onMouseLeave={() => setHover(null)}>
            {parts.map((p) => (
              <li
                key={p.sport}
                onMouseEnter={() => setHover(p.sport)}
                className={cn(
                  "grid grid-cols-[minmax(0,1fr)_44px_auto] items-center gap-3 rounded-lg px-2 py-2 -mx-2 text-[13px] transition-colors",
                  hover === p.sport && "bg-foreground/[0.04]",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden="true" />
                  <span className="truncate text-zinc-200">{p.sport}</span>
                  <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{formatInt(p.bets)} ap.</span>
                </span>
                <span className="text-right text-zinc-400 tabular-nums">{formatPercent(p.share, { decimals: 0 })}</span>
                <span className="min-w-[88px] text-right font-medium tabular-nums" style={{ color: performanceColor(p.profit, colors) }}>
                  {formatMoney(p.profit, { signed: true, cents: false })}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashboardCard>
  );
}
