import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { KpiId } from "@/lib/dashboard-preferences";

// Linha "vs. período anterior" da régua de KPIs do desktop. Cada KPI compara
// no jeito que faz sentido lê-lo: taxa em pontos percentuais, volume em % do
// anterior, contagem e unidades pela diferença.
type Mode = "pp" | "percent" | "diff";

// "streak" fica sem: sequência atual não tem um "anterior" que faça sentido.
const MODES: Partial<Record<KpiId, { mode: Mode; decimals: number; suffix?: string; prefix?: string }>> = {
  roi: { mode: "pp", decimals: 1 },
  hitRate: { mode: "pp", decimals: 1 },
  units: { mode: "diff", decimals: 2, suffix: " U" },
  bets: { mode: "diff", decimals: 0 },
  totalStaked: { mode: "percent", decimals: 0 },
  averageStake: { mode: "percent", decimals: 0 },
  averageOdd: { mode: "diff", decimals: 2 },
  profit: { mode: "diff", decimals: 0, prefix: "R$ " },
  totalReturn: { mode: "percent", decimals: 0 },
  canceled: { mode: "diff", decimals: 0 },
  biggestWin: { mode: "diff", decimals: 0, prefix: "R$ " },
  biggestLoss: { mode: "diff", decimals: 0, prefix: "R$ " },
  maxDrawdown: { mode: "diff", decimals: 0, prefix: "R$ " },
};

function raw(id: KpiId, m: DashboardMetrics, stake: number): number | null {
  switch (id) {
    case "roi": return Number(m.roi) * 100;
    case "hitRate": return Number(m.hitRate) * 100;
    case "units": return stake > 0 ? Number(m.totalProfit) / (stake / 100) : null;
    case "bets": return Number(m.totalBets);
    case "totalStaked": return Number(m.totalStaked);
    case "averageStake": return Number(m.averageStake);
    case "averageOdd": return Number(m.averageOdd);
    case "profit": return Number(m.totalProfit);
    case "totalReturn": return Number(m.settledStake) + Number(m.totalProfit);
    case "canceled": return Number(m.canceledBets);
    case "biggestWin": return Number(m.biggestWin);
    case "biggestLoss": return Number(m.biggestLoss);
    // Mesmo sinal do card (negativo): "−R$ 200" é queda maior que a anterior.
    case "maxDrawdown": return -Number(m.maxDrawdown);
    default: return null;
  }
}

export function kpiDelta(
  id: KpiId,
  current: DashboardMetrics,
  previous: DashboardMetrics,
  stake: number,
): { text: string; signed: number } | null {
  // Dois números num card: compara cada um pela diferença.
  if (id === "wonLost" && Number(previous.totalBets) > 0) {
    const diff = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toLocaleString("pt-BR")}`;
    const won = Number(current.wonBets) - Number(previous.wonBets);
    const lost = Number(current.lostBets) - Number(previous.lostBets);
    return { text: `${diff(won)} V · ${diff(lost)} D`, signed: 0 };
  }
  const spec = MODES[id];
  // Período anterior vazio não é "caiu 100%": simplesmente não há com o que comparar.
  if (!spec || Number(previous.totalBets) === 0) return null;
  const now = raw(id, current, stake);
  const before = raw(id, previous, stake);
  if (now == null || before == null || !Number.isFinite(now) || !Number.isFinite(before)) return null;

  let delta: number;
  if (spec.mode === "percent") {
    if (before === 0) return null;
    delta = ((now - before) / Math.abs(before)) * 100;
  } else {
    delta = now - before;
  }

  const factor = 10 ** spec.decimals;
  const signed = Math.round(delta * factor) / factor;
  if (signed === 0) return { text: "igual", signed: 0 };

  const abs = Math.abs(signed).toLocaleString("pt-BR", {
    minimumFractionDigits: spec.mode === "pp" ? spec.decimals : 0,
    maximumFractionDigits: spec.decimals,
  });
  const unit = spec.mode === "pp" ? " p.p." : spec.mode === "percent" ? "%" : (spec.suffix ?? "");
  return { text: `${signed > 0 ? "+" : "−"}${spec.prefix ?? ""}${abs}${unit}`, signed };
}
