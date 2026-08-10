import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { getDashboardDateRange } from "@/api/routes/get-dashboard-daterange";

export type DatePreset = "lastWithData" | "90d" | "allTime" | "custom";

const PRESET_KEY = "dashboard_date_preset";

interface Filters {
  houseId?: number;
  startDate: string;
  endDate: string;
}

export function useDashboardFilters() {
  const [preset, setPresetState] = useState<DatePreset>(
    () => (localStorage.getItem(PRESET_KEY) as DatePreset) || "lastWithData"
  );
  const [lastBetDate, setLastBetDate] = useState<string | null>(null);
  const [firstBetDate, setFirstBetDate] = useState<string | null>(null);
  const [hasNoBets, setHasNoBets] = useState(false);
  const [ready, setReady] = useState(false);

  const [filters, setFiltersState] = useState<Filters>({
    houseId: undefined,
    startDate: format(subDays(new Date(), 90), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    getDashboardDateRange()
      .then(({ firstBetDate, lastBetDate }) => {
        setFirstBetDate(firstBetDate);
        setLastBetDate(lastBetDate);
        setHasNoBets(!lastBetDate);

        const anchor = lastBetDate ? new Date(lastBetDate) : new Date();
        applyPreset(preset, anchor);
      })
      .catch(() => {
        applyPreset(preset, new Date());
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(p: DatePreset, anchor: Date) {
    if (p === "90d" || p === "lastWithData") {
      setFiltersState((prev) => ({
        ...prev,
        startDate: format(subDays(anchor, 90), "yyyy-MM-dd"),
        endDate: format(anchor, "yyyy-MM-dd"),
      }));
    } else if (p === "allTime") {
      setFiltersState((prev) => ({
        ...prev,
        startDate: "2000-01-01",
        endDate: format(new Date(), "yyyy-MM-dd"),
      }));
    }
  }

  const setPreset = (p: DatePreset) => {
    setPresetState(p);
    localStorage.setItem(PRESET_KEY, p);
    applyPreset(p, lastBetDate ? new Date(lastBetDate) : new Date());
  };

  const setCustomRange = (startDate: string, endDate: string) => {
    setPresetState("custom");
    localStorage.setItem(PRESET_KEY, "custom");
    setFiltersState((prev) => ({ ...prev, startDate, endDate }));
  };

  const setHouseId = (houseId?: number) => {
    setFiltersState((prev) => ({ ...prev, houseId }));
  };

  return {
    filters,
    preset,
    setPreset,
    setCustomRange,
    setHouseId,
    firstBetDate,
    lastBetDate,
    hasNoBets,
    ready,
  };
}
