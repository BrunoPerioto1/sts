// src/hooks/dashboard/useDashboardData.ts
import { useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { type DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { getDashboardMetricsComparison } from "@/api/routes/get-dashboard-metrics-comparison";
import { getDashboardDailySummary } from "@/api/routes/get-dashboard-daily";

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
  const { houseId, startDate, endDate } = filters;

  // A chave é montada a partir dos VALORES, não do objeto `filters`. Isso
  // importa: o useDashboardFilters chama setFiltersState na montagem para
  // aplicar o preset salvo, gerando um objeto novo com o mesmo conteúdo. Com
  // dependência de objeto isso disparava um segundo par de requisições
  // idêntico ao primeiro; com chave por valor, o react-query reconhece a
  // mesma query e serve do cache.
  const key = [houseId ?? null, startDate, endDate] as const;

  const comparison = useQuery({
    queryKey: ["dashboard", "metrics-comparison", ...key],
    queryFn: () => {
      const prev = previousRange(startDate, endDate);
      return getDashboardMetricsComparison({
        houseId,
        startDate,
        endDate,
        previousStartDate: prev.startDate,
        previousEndDate: prev.endDate,
      });
    },
    enabled: Boolean(startDate && endDate),
  });

  const daily = useQuery({
    queryKey: ["dashboard", "daily-summary", ...key],
    queryFn: () =>
      getDashboardDailySummary({ house_id: houseId, startDate, endDate }),
    enabled: Boolean(startDate && endDate),
  });

  return {
    // Mesmo fallback do comportamento anterior, que engolia o erro da
    // comparação e caía em métricas zeradas em vez de quebrar a tela.
    metrics: comparison.data?.current ?? emptyMetrics,
    previousMetrics: comparison.data?.previous ?? emptyMetrics,
    dailyData: daily.data ?? [],
    loading: comparison.isPending || daily.isPending,
    error: comparison.isError || daily.isError,
    reload: () => {
      void comparison.refetch();
      void daily.refetch();
    },
  };
}
