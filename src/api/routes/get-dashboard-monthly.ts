import { apiClient } from "../apiClient";

export interface MonthlySummaryPoint {
  month: string;
  totalBets: number;
  profitMonth: number;
  settledStake: number;
  /** Fração (0.15 = 15%) sobre o stake liquidado no mês. */
  roi: number;
}

export async function getDashboardMonthlySummary(params?: { startDate?: string; endDate?: string }) {
  const response = await apiClient().dashboard.get<MonthlySummaryPoint[]>("/dashboard/monthly-summary", { params });
  return response.data.map((p) => ({
    ...p,
    totalBets: Number(p.totalBets),
    profitMonth: Number(p.profitMonth),
    settledStake: Number(p.settledStake ?? 0),
    roi: Number(p.roi ?? 0),
  }));
}
