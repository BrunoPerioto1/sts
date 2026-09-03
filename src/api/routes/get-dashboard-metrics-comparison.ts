import { apiClient } from "../apiClient";
import type { DashboardMetrics } from "./get-dashboard-metrics";

export interface DashboardMetricsComparisonParams {
  houseId?: number;
  startDate?: string;
  endDate?: string;
  previousStartDate?: string;
  previousEndDate?: string;
}

export interface DashboardMetricsComparison {
  current: DashboardMetrics;
  previous: DashboardMetrics;
}

export async function getDashboardMetricsComparison(params: DashboardMetricsComparisonParams) {
  const response = await apiClient().dashboard.get<DashboardMetricsComparison>(
    "/dashboard/metrics-comparison",
    { params }
  );
  return response.data;
}
