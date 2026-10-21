import { useQuery } from "@tanstack/react-query";
import { getDashboardBySport, type SportBreakdown } from "@/api/routes/get-dashboard-by-sport";
import { performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { formatInt, formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./DashboardCard";

// Quatro esportes nomeados; do quinto em diante viram "Outros (n)", em cinza.
const NAMED = 4;
const SLOT_COLORS = ["var(--sport-1)", "var(--sport-2)", "var(--sport-3)", "var(--sport-4)"];
const OTHERS_COLOR = "color-mix(in srgb, var(--color-text) 30%, transparent)";
// A cor do ponto segue o esporte, não a posição: futebol é sempre o azul,
// mesmo quando um filtro muda quem aparece. Os demais pegam o slot livre.
const PREFERRED = ["futebol", "basquete", "tênis"];

interface Row extends SportBreakdown {
  color: string;
  others?: boolean;
}

/**
 * Os quatro mais apostados ficam nomeados (volume é o que torna a linha
 * relevante); o resto soma em "Outros". A ordem na tela é por lucro, com
 * "Outros" sempre por último: o esporte que dá prejuízo cai no fim, vermelho.
 */
function rows(data: SportBreakdown[]): Row[] {
  const named = data.slice(0, NAMED);
  const rest = data.slice(NAMED);

  const slot = new Map<string, number>();
  for (const r of named) {
    const preferred = PREFERRED.indexOf(r.sport.toLowerCase());
    if (preferred >= 0) slot.set(r.sport, preferred);
  }
  const free = [0, 1, 2, 3].filter((i) => ![...slot.values()].includes(i));
  for (const r of named) if (!slot.has(r.sport)) slot.set(r.sport, free.shift()!);

  const out: Row[] = named
    .map((r) => ({ ...r, color: SLOT_COLORS[slot.get(r.sport)!] }))
    .sort((a, b) => b.profit - a.profit);
  if (rest.length) {
    const sum = (key: keyof Omit<SportBreakdown, "sport">) => rest.reduce((acc, r) => acc + r[key], 0);
    out.push({
      sport: `Outros (${rest.length})`,
      bets: sum("bets"),
      pendingBets: sum("pendingBets"),
      wonBets: sum("wonBets"),
      lostBets: sum("lostBets"),
      settledStake: sum("settledStake"),
      profit: sum("profit"),
      color: OTHERS_COLOR,
      others: true,
    });
  }
  return out;
}

/**
 * Lucro de cada esporte no período: uma barra por linha, do tamanho do lucro
 * (verde) ou do prejuízo (vermelho), e embaixo apostas, acerto e ROI pra
 * comparar. Segue os filtros de casa e esporte do topo; com `sample` (a
 * vitrine da landing, sem login) mostra esses dados e não busca nada.
 */
export function SportsCard({
  filters,
  sample,
  colors,
  className,
  style,
}: {
  filters?: { startDate: string; endDate: string; houseIds: number[]; sportIds: number[] };
  sample?: SportBreakdown[];
  colors: DashboardPreferences["performanceColors"];
  className?: string;
  style?: React.CSSProperties;
}) {
  const { startDate = "", endDate = "", houseIds = [], sportIds = [] } = filters ?? {};
  const { data: fetched = [] } = useQuery({
    queryKey: ["dashboard", "by-sport", houseIds.join(","), sportIds.join(","), startDate, endDate],
    queryFn: () => getDashboardBySport({ startDate, endDate, houseIds, sportIds }),
    enabled: !sample && Boolean(startDate && endDate),
  });
  const data = sample ?? fetched;
  const list = rows(data);
  const total = data.reduce((sum, r) => sum + r.bets, 0);
  const maxAbs = Math.max(1, ...list.map((r) => Math.abs(r.profit)));

  return (
    <DashboardCard
      title="Lucro por esporte"
      right={total > 0 ? <span className="text-xs text-zinc-500">{formatInt(total)} apostas</span> : undefined}
      className={className}
      style={style}
    >
      {total === 0 ? (
        <p className="py-8 text-center text-[13px] text-zinc-400">Nenhuma aposta no período.</p>
      ) : (
        // Linhas no topo com espaço fixo: sobra de altura fica embaixo, não
        // espalhada entre elas.
        <ul className="flex flex-col gap-4">
          {list.map((r) => {
            // Só pendente: ainda não há resultado, "R$ 0" daria a entender empate.
            const pending = r.pendingBets === r.bets;
            const decided = r.wonBets + r.lostBets;
            const hit = decided > 0 ? r.wonBets / decided : null;
            const roi = r.settledStake > 0 ? r.profit / r.settledStake : null;
            const color = performanceColor(r.profit, colors);
            const tone = colors.enabled && r.profit !== 0 ? color : "color-mix(in srgb, var(--color-text) 35%, transparent)";
            return (
              <li key={r.sport} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                    <span className={cn("truncate text-[13px]", r.others ? "text-zinc-400" : "text-zinc-200")}>{r.sport}</span>
                  </span>
                  <span
                    className={cn("shrink-0 text-[13px] font-medium tabular-nums", pending && "text-zinc-500")}
                    style={pending ? undefined : { color }}
                  >
                    {pending ? "pendente" : formatMoney(r.profit, { signed: true, cents: false })}
                  </span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/[0.05]">
                  {!pending && r.profit !== 0 && (
                    <div
                      className="h-full rounded-full opacity-80"
                      style={{ width: `${(Math.abs(r.profit) / maxAbs) * 100}%`, background: tone }}
                    />
                  )}
                </div>

                <div className="flex gap-3 text-xs text-zinc-500 tabular-nums">
                  <span>
                    {formatInt(r.bets)} aposta{r.bets === 1 ? "" : "s"}
                  </span>
                  {hit != null && <span>{formatPercent(hit, { decimals: 0 })} acerto</span>}
                  {roi != null && (
                    <span style={roi !== 0 && colors.enabled ? { color: performanceColor(roi, colors), opacity: 0.75 } : undefined}>
                      ROI {formatPercent(roi, { decimals: 0, signed: true })}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
