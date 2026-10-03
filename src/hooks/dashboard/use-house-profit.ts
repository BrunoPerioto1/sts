import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { dashboardQueryParams } from "@/api/routes/get-dashboard-daily";

export interface HouseProfit {
  house: string;
  profit: number;
}

/** Lucro por casa dentro do período, agregado no banco (ordenado desc). */
export function useHouseProfit(startDate: string, endDate: string, houseIds: number[] = [], sportIds: number[] = []) {
  const { data } = useQuery({
    queryKey: ["dashboard", "by-house", startDate, endDate, houseIds.join(","), sportIds.join(",")],
    queryFn: async () =>
      (
        await apiClient().dashboard.get<HouseProfit[]>("/dashboard/by-house", {
          params: dashboardQueryParams({ startDate, endDate, houseIds, sportIds }),
        })
      ).data,
    enabled: Boolean(startDate && endDate),
  });
  return data ?? [];
}
