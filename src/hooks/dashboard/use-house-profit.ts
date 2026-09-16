import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";

export interface HouseProfit {
  house: string;
  profit: number;
}

/** Lucro por casa dentro do período, agregado no banco (ordenado desc). */
export function useHouseProfit(startDate: string, endDate: string) {
  const { data } = useQuery({
    queryKey: ["dashboard", "by-house", startDate, endDate],
    queryFn: async () =>
      (
        await apiClient().dashboard.get<HouseProfit[]>("/dashboard/by-house", {
          params: { startDate, endDate },
        })
      ).data,
    enabled: Boolean(startDate && endDate),
  });
  return data ?? [];
}
