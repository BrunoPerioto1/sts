import { useQueries, useQuery } from "@tanstack/react-query";
import { endOfMonth, format } from "date-fns";
import { getAllBets, getBetMonths, getBetTotals, type BetFilterDto, type BetItem } from "@/api/routes/get-bets";

export interface BetsQueryFilters {
  statusFilter: string[];
  houseIds: number[];
  sportIds: number[];
  origins: string[];
  unmatched: boolean;
  startDate: string;
  endDate: string;
  searchTerm: string;
}

export function paramsFrom(f: BetsQueryFilters): BetFilterDto {
  const params: BetFilterDto = {};
  if (f.statusFilter.length > 0) params.resultIds = f.statusFilter.map(Number);
  if (f.houseIds.length > 0) params.houseIds = f.houseIds;
  if (f.sportIds.length > 0) params.sportIds = f.sportIds;
  if (f.startDate) params.startDate = f.startDate;
  if (f.endDate) params.endDate = f.endDate;
  if (f.origins.length > 0) params.origins = f.origins;
  if (f.unmatched) params.unmatched = true;
  if (f.searchTerm) params.q = f.searchTerm;
  return params;
}

// Chave montada a partir dos VALORES do filtro (nao do objeto) — assim voltar
// pra tela com os mesmos filtros reconhece a mesma query e serve do cache, sem
// o "reload" de sempre. Mesma ideia do useDashboardData.
function filterKey(f: BetsQueryFilters) {
  return [f.statusFilter.join(","), f.houseIds.join(","), f.sportIds.join(","), f.origins.join(","), f.unmatched, f.startDate, f.endDate, f.searchTerm] as const;
}

export const betMonthsQueryKey = (f: BetsQueryFilters) => ["bets", "months", ...filterKey(f)] as const;
export const monthBetsQueryKey = (f: BetsQueryFilters, month: string) => ["bets", "month", month, ...filterKey(f)] as const;

/**
 * Meses do filtro com quantidade e lucro, calculados no banco. A lista baixava
 * todas as apostas do filtro (milhares, a cada troca de filtro) só pra somar
 * esses totais; agora as linhas vêm só do mês aberto (useMonthBets).
 */
export function useBetMonths(filters: BetsQueryFilters) {
  return useQuery({
    queryKey: betMonthsQueryKey(filters),
    queryFn: () => getBetMonths(paramsFrom(filters)),
  });
}

/** Totais do filtro inteiro (apostado, lucro, ROI, acerto) pra faixa do topo. */
export function useBetTotals(filters: BetsQueryFilters) {
  return useQuery({
    queryKey: ["bets", "totals", ...filterKey(filters)],
    queryFn: () => getBetTotals(paramsFrom(filters)),
  });
}

// O período de um mês ("2026-09") recortado pelo período do filtro. Datas em
// "yyyy-MM-dd", como o filtro: comparar a string basta.
export function monthPeriod(month: string, f: BetsQueryFilters) {
  const first = `${month}-01`;
  const last = format(endOfMonth(new Date(`${first}T12:00:00`)), "yyyy-MM-dd");
  return {
    startDate: f.startDate && f.startDate > first ? f.startDate : first,
    endDate: f.endDate && f.endDate < last ? f.endDate : last,
  };
}

/** Linhas dos meses abertos: uma query por mês, cada uma cacheada. */
export function useMonthBets(filters: BetsQueryFilters, months: string[]) {
  const results = useQueries({
    queries: months.map((month) => ({
      queryKey: monthBetsQueryKey(filters, month),
      queryFn: () => getAllBets({ ...paramsFrom(filters), ...monthPeriod(month, filters) }),
    })),
  });
  const byMonth = new Map<string, { bets: BetItem[]; loading: boolean }>();
  months.forEach((month, i) => {
    byMonth.set(month, { bets: results[i]?.data ?? [], loading: !!results[i]?.isPending });
  });
  return byMonth;
}
