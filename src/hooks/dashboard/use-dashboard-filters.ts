import { useEffect, useState } from "react";
import { endOfMonth, format, startOfMonth, subDays, subMonths } from "date-fns";
import { getDashboardDateRange } from "@/api/routes/get-dashboard-daterange";

export type DatePreset = "7d" | "14d" | "currentMonth" | "lastMonth" | "60d" | "90d" | "allTime" | "custom";

const PRESET_KEY = "dashboard_date_preset";

interface Filters {
  houseId?: number;
  startDate: string;
  endDate: string;
}

export function useDashboardFilters() {
  const validPresets: DatePreset[] = ["7d", "14d", "currentMonth", "lastMonth", "60d", "90d", "allTime", "custom"];
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
    endDate: format(endOfMonth(new Date()), "yyyy-MM-dd"),
  });

  useEffect(() => {
    getDashboardDateRange()
      .then(({ firstBetDate, lastBetDate }) => {
        setFirstBetDate(firstBetDate);
        setLastBetDate(lastBetDate);
        setHasNoBets(!lastBetDate);
        applyPreset(preset, firstBetDate);
      })
      .catch(() => {
        applyPreset(preset);
      })
      .finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // firstDate: passado direto pelo fetch inicial, quando o estado firstBetDate
  // ainda não foi comitado (setState é assíncrono).
  function applyPreset(p: DatePreset, firstDate?: string | null) {
    const today = new Date();
    const setRange = (start: Date | string, end: Date | string = today) =>
      setFiltersState((prev) => ({
        ...prev,
        startDate: typeof start === "string" ? start : format(start, "yyyy-MM-dd"),
        endDate: typeof end === "string" ? end : format(end, "yyyy-MM-dd"),
      }));

    if (p === "7d" || p === "14d") {
      // Intervalo inclusivo nas duas pontas: 7 dias = hoje + os 6 anteriores.
      setRange(subDays(today, p === "7d" ? 6 : 13));
    } else if (p === "currentMonth") {
      // Fim do mes, nao hoje: aposta de jogo futuro cai no filtro do mes atual.
      setRange(startOfMonth(today), endOfMonth(today));
    } else if (p === "lastMonth") {
      const lastMonth = subMonths(today, 1);
      setRange(startOfMonth(lastMonth), endOfMonth(lastMonth));
    } else if (p === "60d" || p === "90d") {
      setRange(subDays(today, p === "60d" ? 60 : 90));
    } else if (p === "allTime") {
      setRange(firstDate ?? firstBetDate ?? "2000-01-01");
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
