import { useQuery } from "@tanstack/react-query";
import { getDashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { useHouses, useHouseBalances, useHouseMetrics } from "@/hooks/queries/use-houses";

export interface ProfileSummary {
  totalBets: number;
  settledBets: number;
  wonBets: number;
  totalProfit: number;
  roi: number;
  hitRate: number;
  totalHouses: number;
  housesWithBalance: number;
  bankroll: number;
}

// Números de "vida toda" do perfil, reunidos de três queries diferentes.
export function useProfileSummary() {
  // Chave sob "dashboard" de proposito: e a mesma metrica que o dashboard
  // mostra, entao uma aposta nova invalida as duas de uma vez.
  const metricsQuery = useQuery({
    queryKey: ["dashboard", "metrics", "all-time"],
    queryFn: () => getDashboardMetrics({}),
  });
  const houses = useHouses();
  const balances = useHouseBalances();
  const houseMetrics = useHouseMetrics();

  const summary: ProfileSummary = {
    totalBets: Number(metricsQuery.data?.totalBets ?? 0),
    settledBets: Number(metricsQuery.data?.settledBets ?? 0),
    wonBets: Number(metricsQuery.data?.wonBets ?? 0),
    totalProfit: Number(metricsQuery.data?.totalProfit ?? 0),
    roi: Number(metricsQuery.data?.roi ?? 0),
    hitRate: Number(metricsQuery.data?.hitRate ?? 0),
    totalHouses: houses.length,
    housesWithBalance: (balances.data ?? []).filter((h) => Number(h.houseBalance) > 0).length,
    bankroll: Number(houseMetrics.data?.totalBalance ?? 0),
  };

  return {
    summary,
    loading: metricsQuery.isPending,
    isError: metricsQuery.isError,
    // Sem métrica na mão (carregando ou falhou) os tiles mostram "—".
    unavailable: metricsQuery.isPending || metricsQuery.isError,
  };
}
