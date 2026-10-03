import { apiClient } from "../apiClient";
import type { DashboardMetrics } from "./get-dashboard-metrics";
import { dashboardQueryParams, type DashboardQueryParams } from "./get-dashboard-daily";

export interface DashboardMetricsComparisonParams extends DashboardQueryParams {
  previousStartDate?: string;
  previousEndDate?: string;
}

export interface DashboardMetricsComparison {
  current: DashboardMetrics;
  previous: DashboardMetrics;
}

export async function getDashboardMetricsComparison(params: DashboardMetricsComparisonParams) {
  const { previousStartDate, previousEndDate, ...rest } = params;
  const response = await apiClient().dashboard.get<DashboardMetricsComparison>(
    "/dashboard/metrics-comparison",
    { params: { ...dashboardQueryParams(rest), previousStartDate, previousEndDate } }
  );
  return response.data;
}
