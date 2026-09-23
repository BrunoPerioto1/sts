import { useInfiniteQuery } from "@tanstack/react-query";
import { getBets, type BetFilterDto, type PaginatedBetsResponseDto } from "@/api/routes/get-bets";

export const PER_PAGE = 30;
// A lista agrupada soma o array inteiro pros totais de mes/semana/dia — com
// paginacao de 30 eles batiam so com o que ja estava na tela. Busca tudo do
// filtro.
const GROUPED_PER_PAGE = 1000;

export interface BetsQueryFilters {
  statusFilter: string[];
  houseIds: number[];
  sportIds: number[];
  startDate: string;
  endDate: string;
  searchTerm: string;
  // Pagina inicial. Desktop troca de pagina mexendo aqui (cada pagina vira uma
  // query propria, cacheada); mobile mantem em 1 e vai empilhando com
  // fetchNextPage no "Carregar mais".
  pageStart: number;
}

function paramsFrom(f: BetsQueryFilters): BetFilterDto {
  const params: BetFilterDto = {};
  if (f.statusFilter.length > 0) params.resultIds = f.statusFilter.map(Number);
  if (f.houseIds.length > 0) params.houseIds = f.houseIds;
  if (f.sportIds.length > 0) params.sportIds = f.sportIds;
  if (f.startDate) params.startDate = f.startDate;
  if (f.endDate) params.endDate = f.endDate;
  if (f.searchTerm) params.q = f.searchTerm;
  return params;
}

// Chave montada a partir dos VALORES do filtro (nao do objeto) — assim voltar
// pra tela com os mesmos filtros reconhece a mesma query e serve do cache, sem
// o "reload" de sempre. Mesma ideia do useDashboardData.
export function betsQueryKey(f: BetsQueryFilters) {
  return [
    "bets",
    "list",
    f.pageStart,
    f.statusFilter.join(","),
    f.houseIds.join(","),
    f.sportIds.join(","),
    f.startDate,
    f.endDate,
    f.searchTerm,
  ] as const;
}

export function useBetsQuery(filters: BetsQueryFilters) {
  return useInfiniteQuery({
    queryKey: betsQueryKey(filters),
    initialPageParam: filters.pageStart,
    queryFn: async ({ pageParam }): Promise<PaginatedBetsResponseDto> => {
      const base = paramsFrom(filters);
      const first = await getBets({ ...base, page: 1, perPage: GROUPED_PER_PAGE });
      let data = Array.isArray(first?.data) ? first.data : [];
      const pagesTotal = first?.totalPages ?? 1;
      if (pagesTotal > 1) {
        const rest = await Promise.all(
          Array.from({ length: pagesTotal - 1 }, (_, i) =>
            getBets({ ...base, page: i + 2, perPage: GROUPED_PER_PAGE })
          )
        );
        for (const r of rest) data = data.concat(Array.isArray(r?.data) ? r.data : []);
      }
      // Uma "pagina" so: o agrupado ja recebeu tudo.
      return { data, total: first?.total ?? data.length, totalPages: 1 };
    },
    // A lista agrupada vem inteira numa pagina so — nao ha proxima.
    getNextPageParam: () => undefined,
  });
}
