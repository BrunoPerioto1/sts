import { apiClient } from "../apiClient";

export interface DashboardQueryParams {
  house_id?: number;
  startDate?: string;
  endDate?: string;
}

export interface DailySummaryPoint {
  date: string;
  totalBets: number;
  profitDay: number;
}

export async function getDashboardDailySummary(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<DailySummaryPoint[]>(
    "/dashboard/daily-summary",
    { params }
  );
  
  // Garante que os valores sejam números
  return response.data.map(point => ({
    date: point.date,
    totalBets: Number(point.totalBets),
    profitDay: Number(point.profitDay)
  }));
}