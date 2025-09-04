import { apiClient } from "../apiClient";

export interface DashboardQueryParams {
  house_id?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardMetrics {
  totalBets: number;
  wonBets: number;
  lostBets: number;
  pendingBets: number;
  canceledBets: number;
  totalStaked: number;
  totalReturn: number;
  averageStake: number;
  averageOdd: number;
  totalProfit: number;
  roi: number;
  hitRate: number;
}

export async function getDashboardMetrics(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<DashboardMetrics>(
    "/dashboard/metrics",
    { params }
  );
  return response.data;
}