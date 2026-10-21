import { apiClient } from "../apiClient";
import { dashboardQueryParams, type DashboardQueryParams } from "./get-dashboard-daily";

export interface SportBreakdown {
  sport: string;
  bets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  /** Stake das liquidadas: a base do ROI, como nas métricas do dashboard. */
  settledStake: number;
  /** Lucro das liquidadas do esporte no período. */
  profit: number;
}

/** Desempenho por esporte no período, do mais apostado pro menos. */
export async function getDashboardBySport(params: DashboardQueryParams): Promise<SportBreakdown[]> {
  const response = await apiClient().dashboard.get<Partial<SportBreakdown>[]>("/dashboard/by-sport", {
    params: dashboardQueryParams(params),
  });
  // API de antes desses campos manda só aposta e lucro: o que falta vira zero
  // e o card esconde acerto e ROI em vez de mostrar 0%.
  return response.data.map((r) => ({
    sport: r.sport ?? "Outros",
    bets: Number(r.bets ?? 0),
    pendingBets: Number(r.pendingBets ?? 0),
    wonBets: Number(r.wonBets ?? 0),
    lostBets: Number(r.lostBets ?? 0),
    settledStake: Number(r.settledStake ?? 0),
    profit: Number(r.profit ?? 0),
  }));
}
