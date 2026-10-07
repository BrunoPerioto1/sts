import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getDashboardDailySummary } from "@/api/routes/get-dashboard-daily";

/**
 * Lucro acumulado dia a dia desde a criação da conta, pro sparkline do card do
 * perfil. Chave sob "dashboard" (mesmo formato do use-bankroll-series): aposta
 * nova invalida junto com o resto do dashboard.
 */
export function useProfitSparkline(createdAt: string | null | undefined): number[] {
  const startDate = createdAt ? format(new Date(createdAt), "yyyy-MM-dd") : "";
  const today = format(new Date(), "yyyy-MM-dd");

  const daily = useQuery({
    queryKey: ["dashboard", "daily-summary", null, startDate, today],
    queryFn: () => getDashboardDailySummary({ startDate, endDate: today }),
    enabled: Boolean(startDate),
  });

  if (!daily.data) return [];
  let total = 0;
  return [...daily.data]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => (total += d.profitDay));
}
