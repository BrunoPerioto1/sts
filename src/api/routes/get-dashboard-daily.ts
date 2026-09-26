import { apiClient } from "../apiClient";

export interface DashboardQueryParams {
  houseIds?: number[];
  sportIds?: number[];
  startDate?: string;
  endDate?: string;
}

export interface DailySummaryPoint {
  date: string;
  totalBets: number;
  profitDay: number;
}

// Listas vão separadas por vírgula (toNumberArray no back). O antigo
// `house_id` nunca chegou a filtrar: a API recusa campo fora do DTO.
export function dashboardQueryParams({ houseIds, sportIds, ...rest }: DashboardQueryParams) {
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(rest)) if (value) params[key] = value;
  if (houseIds?.length) params.houseIds = houseIds.join(",");
  if (sportIds?.length) params.sportIds = sportIds.join(",");
  return params;
}

export async function getDashboardDailySummary(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<DailySummaryPoint[]>(
    "/dashboard/daily-summary",
    { params: dashboardQueryParams(params) }
  );

  // Garante que os valores sejam números
  return response.data.map(point => ({
    date: point.date,
    totalBets: Number(point.totalBets),
    profitDay: Number(point.profitDay)
  }));
}
