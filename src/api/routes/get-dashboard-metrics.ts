import { apiClient } from "../apiClient";

export interface DashboardQueryParams {
  house_id?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardMetrics {
  totalBets: string | number;
  settledBets: string | number;
  wonBets: string | number;
  lostBets: string | number;
  pendingBets: string | number;
  canceledBets: string | number;
  totalStaked: string | number;
  totalReturn: string | number;
  averageStake: string | number;
  averageOdd: string | number;
  totalProfit: string | number;
  roi: string | number;
  hitRate: string | number;
}

export async function getDashboardMetrics(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<DashboardMetrics>(
    "/dashboard/metrics",
    { params }
  );
  return response.data;
}
