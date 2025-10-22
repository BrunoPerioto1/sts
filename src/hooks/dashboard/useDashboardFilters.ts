import { useState } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export function useDashboardFilters() {
  const today = new Date();
  const [filters, setFilters] = useState({
    houseId: undefined as number | undefined,
    startDate: format(startOfMonth(today), "yyyy-MM-dd"),
    endDate: format(endOfMonth(today), "yyyy-MM-dd"),
  });

  const updateFilters = (newFilters: {
    houseId?: number;
    startDate: string;
    endDate: string;
  }) => {
    setFilters({
      houseId: newFilters.houseId ?? undefined,
      startDate: newFilters.startDate,
      endDate: newFilters.endDate,
    });
  };

  return { filters, setFilters: updateFilters };
}
