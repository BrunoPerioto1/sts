import { apiClient } from "../apiClient";

export interface DateRangeResponse {
  firstBetDate: string | null;
  lastBetDate: string | null;
}

export async function getDashboardDateRange() {
  const response = await apiClient().dashboard.get<DateRangeResponse>("/dashboard/date-range");
  return response.data;
}
