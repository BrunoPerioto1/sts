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
  return response.data;
}