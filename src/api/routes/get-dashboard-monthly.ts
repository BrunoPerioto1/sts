import { apiClient } from "../apiClient";

export interface MonthlySummaryPoint {
  month: string;
  totalBets: number;
  profitMonth: number;
}

export async function getDashboardMonthlySummary(params?: { startDate?: string; endDate?: string }) {
  const response = await apiClient().dashboard.get<MonthlySummaryPoint[]>("/dashboard/monthly-summary", { params });
  return response.data.map((p) => ({ ...p, totalBets: Number(p.totalBets), profitMonth: Number(p.profitMonth) }));
}
