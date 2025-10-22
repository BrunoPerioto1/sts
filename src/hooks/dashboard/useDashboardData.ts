// src/pages/dashboard/hooks/useDashboardData.ts
import { useEffect, useState } from "react";
import {
  getDashboardMetrics,
  type DashboardMetrics,
} from "@/api/routes/get-dashboard-metrics";
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

export function useDashboardData(filters: Params) {
  const [houses, setHouses] = useState<HouseDto[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
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
  });
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
      const [metricsData, daily] = await Promise.all([
        getDashboardMetrics(params),
        getDashboardDailySummary(params),
      ]);
      setMetrics(metricsData);
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
    dailyData,
    loading,
    reload: loadDashboardData,
  };
}
