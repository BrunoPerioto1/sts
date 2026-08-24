import { useEffect, useState } from "react";
import { format, startOfMonth, subDays } from "date-fns";
import { getDashboardDateRange } from "@/api/routes/get-dashboard-daterange";

export type DatePreset = "currentMonth" | "60d" | "90d" | "allTime" | "custom";

const PRESET_KEY = "dashboard_date_preset";

interface Filters {
  houseId?: number;
  startDate: string;
  endDate: string;
}

export function useDashboardFilters() {
  const validPresets: DatePreset[] = ["currentMonth", "60d", "90d", "allTime", "custom"];
  const [preset, setPresetState] = useState<DatePreset>(() => {
    const stored = localStorage.getItem(PRESET_KEY) as DatePreset | null;
    return stored && validPresets.includes(stored) ? stored : "currentMonth";
  });
  const [lastBetDate, setLastBetDate] = useState<string | null>(null);
  const [firstBetDate, setFirstBetDate] = useState<string | null>(null);
  const [hasNoBets, setHasNoBets] = useState(false);
  const [ready, setReady] = useState(false);

  const [filters, setFiltersState] = useState<Filters>({
    houseId: undefined,
    startDate: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    getDashboardDateRange()
      .then(({ firstBetDate, lastBetDate }) => {
        setFirstBetDate(firstBetDate);
        setLastBetDate(lastBetDate);
        setHasNoBets(!lastBetDate);
        applyPreset(preset);
      })
      .catch(() => {
        applyPreset(preset);
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(p: DatePreset) {
    const today = new Date();
    if (p === "currentMonth") {
      setFiltersState((prev) => ({
        ...prev,
        startDate: format(startOfMonth(today), "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
      }));
    } else if (p === "60d" || p === "90d") {
      setFiltersState((prev) => ({
        ...prev,
        startDate: format(subDays(today, p === "60d" ? 60 : 90), "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
      }));
    } else if (p === "allTime") {
      setFiltersState((prev) => ({
        ...prev,
        startDate: "2000-01-01",
        endDate: format(today, "yyyy-MM-dd"),
      }));
    }
  }

  const setPreset = (p: DatePreset) => {
    setPresetState(p);
    localStorage.setItem(PRESET_KEY, p);
    applyPreset(p);
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
