// src/pages/dashboard/hooks/useDashboardData.ts
import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { type DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { getDashboardMetricsComparison } from "@/api/routes/get-dashboard-metrics-comparison";
import {
  getDashboardDailySummary,
  type DailySummaryPoint,
} from "@/api/routes/get-dashboard-daily";
import { getAllHouses, type HouseDto } from "@/api/routes/get-houses";

interface Params {
  houseId?: number;
  startDate: string;
  endDate: string;
}

const emptyMetrics: DashboardMetrics = {
  totalBets: 0,
  wonBets: 0,
  lostBets: 0,
  pendingBets: 0,
  canceledBets: 0,
  totalStaked: 0,
  totalReturn: 0,
  averageStake: 0,
  averageOdd: 0,
  totalProfit: 0,
  roi: 0,
  hitRate: 0,
};

// Período imediatamente anterior, com a mesma duração do período selecionado —
// é o que os KPIs usam pra mostrar "vs. período anterior".
function previousRange(startDate: string, endDate: string) {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const days = differenceInCalendarDays(end, start) + 1;
  return {
    startDate: format(subDays(start, days), "yyyy-MM-dd"),
    endDate: format(subDays(start, 1), "yyyy-MM-dd"),
  };
}

export function useDashboardData(filters: Params) {
  const [houses, setHouses] = useState<HouseDto[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [previousMetrics, setPreviousMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [dailyData, setDailyData] = useState<DailySummaryPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadHouses = async () => {
      try {
        const housesData = await getAllHouses();
        setHouses(housesData || []);
      } catch (err) {
        console.error("Erro ao carregar casas:", err);
        setHouses([]);
      }
    };
    loadHouses();
  }, []);

  // 🔹 Carrega métricas e dados diários
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const params = {
        house_id: filters.houseId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      const prev = previousRange(filters.startDate, filters.endDate);
      const [comparison, daily] = await Promise.all([
        getDashboardMetricsComparison({
          houseId: filters.houseId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          previousStartDate: prev.startDate,
          previousEndDate: prev.endDate,
        }).catch(() => ({ current: emptyMetrics, previous: emptyMetrics })),
        getDashboardDailySummary(params),
      ]);
      setMetrics(comparison.current);
      setPreviousMetrics(comparison.previous);
      setDailyData(daily || []);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  return {
    houses,
    metrics,
    previousMetrics,
    dailyData,
    loading,
    reload: loadDashboardData,
  };
}
