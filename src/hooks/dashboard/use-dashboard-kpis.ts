import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { useMe } from "@/hooks/queries/use-me";
import { normalizeDashboardPreferences } from "@/lib/dashboard-preferences";
import type { KpiInput } from "@/lib/dashboard-kpi-values";
import { useBankrollSeries } from "./use-bankroll-series";

/**
 * O que os cards de KPI e o gráfico de banca precisam, igual no desktop e no
 * celular: preferências, a série da banca e a entrada dos KPIs (com a banca
 * do fim do período).
 */
export function useDashboardKpis(filters: { startDate: string; endDate: string }, metrics: DashboardMetrics) {
  const { me } = useMe();
  const bankroll = useBankrollSeries(filters.startDate, filters.endDate);
  const input: KpiInput = {
    metrics,
    stake: Number(me?.stake ?? 0),
    bankroll: bankroll.length ? bankroll[bankroll.length - 1].balance : null,
  };
  return { preferences: normalizeDashboardPreferences(me?.dashboardPreferences), bankrollPoints: bankroll, input };
}
