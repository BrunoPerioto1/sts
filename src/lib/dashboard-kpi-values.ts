import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { KpiId } from "@/lib/dashboard-preferences";
import { formatInt, formatMoney, formatOdd, formatPercent, formatUnits } from "@/lib/format";

// Mesmos valores/fórmulas no mobile, no desktop e na prévia das configurações.
export function kpiValues(metrics: DashboardMetrics, stake: number): Record<KpiId, { value: string; signed?: number | null }> {
  const profit = Number(metrics.totalProfit);
  const roi = Number(metrics.roi);
  const unitValue = Number.isFinite(stake) && stake > 0 ? stake / 100 : null;
  const units = unitValue != null ? profit / unitValue : null;
  const streak = Number(metrics.streak ?? 0);
  return {
    roi: { value: formatPercent(roi, { signed: true }), signed: roi },
    units: { value: units != null ? formatUnits(units) : "—", signed: units },
    bets: { value: formatInt(metrics.totalBets) },
    pending: { value: formatInt(metrics.pendingBets) },
    totalStaked: { value: formatMoney(Number(metrics.totalStaked), { cents: false }) },
    averageStake: { value: formatMoney(Number(metrics.averageStake), { cents: false }) },
    averageOdd: { value: formatOdd(metrics.averageOdd) },
    hitRate: { value: formatPercent(metrics.hitRate) },
    profit: { value: formatMoney(profit, { signed: true, cents: false }), signed: profit },
    // API não manda retorno pronto: é o stake liquidado de volta mais o lucro.
    totalReturn: { value: formatMoney(Number(metrics.settledStake) + profit, { cents: false }) },
    wonLost: { value: `${formatInt(metrics.wonBets)} V · ${formatInt(metrics.lostBets)} D` },
    canceled: { value: formatInt(metrics.canceledBets) },
    streak: { value: streak === 0 ? "—" : `${Math.abs(streak)} ${streak > 0 ? (streak === 1 ? "vitória" : "vitórias") : (streak === -1 ? "derrota" : "derrotas")}`, signed: streak },
    biggestWin: { value: formatMoney(Number(metrics.biggestWin), { signed: true, cents: false }), signed: Number(metrics.biggestWin) },
    biggestLoss: { value: formatMoney(Number(metrics.biggestLoss), { signed: true, cents: false }), signed: Number(metrics.biggestLoss) },
    // Queda é perda: mostra negativo pra ler e colorir como prejuízo.
    maxDrawdown: { value: formatMoney(-Number(metrics.maxDrawdown), { signed: true, cents: false }), signed: -Number(metrics.maxDrawdown) },
  };
}
