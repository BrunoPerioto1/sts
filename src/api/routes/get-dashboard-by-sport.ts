import { apiClient } from "../apiClient";
import { dashboardQueryParams, type DashboardQueryParams } from "./get-dashboard-daily";

export interface SportBreakdown {
  sport: string;
  bets: number;
  /** Lucro das liquidadas do esporte no período. */
  profit: number;
}

/** Apostas e lucro por esporte, do mais apostado pro menos. */
export async function getDashboardBySport(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<SportBreakdown[]>("/dashboard/by-sport", {
    params: dashboardQueryParams(params),
  });
  return response.data.map((r) => ({ sport: r.sport, bets: Number(r.bets), profit: Number(r.profit) }));
}
