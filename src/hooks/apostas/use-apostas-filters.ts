import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import { defaultPeriod, type ApostasFilterState, type PeriodPreset } from "@/types/apostas-filters";
import type { BetsQueryFilters } from "./use-bets-query";


// Todo o estado de filtro da tela de apostas: valores, sementes vindas da URL,
// debounce da busca e as ações que mexem em mais de um campo ao mesmo tempo.
// A página só consome.
export function useApostasFilters() {
  const [searchParams] = useSearchParams();

  // ?status=9 — usado pelo card do dashboard pra cair já filtrado nas pendentes.
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const fromUrl = searchParams.get("status");
    return fromUrl ? fromUrl.split(",") : [];
  });
  // ?houseId=3 (card do dashboard / "ver apostas" da casa) ou ?houseId=3,7.
  const [houseIds, setHouseIds] = useState<number[]>(() => {
    const fromUrl = searchParams.get("houseId");
    if (!fromUrl) return [];
    return fromUrl.split(",").map(Number).filter((n) => Number.isFinite(n));
  });
  const [sportIds, setSportIds] = useState<number[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  // ?semJogo=1 — atalho pras apostas que a conferência automática não alcança.
  const [unmatched, setUnmatched] = useState(() => searchParams.get("semJogo") === "1");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("q") ?? "");
  const [startDate, setStartDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(startOfMonth(new Date()), "yyyy-MM-dd"));
  // Padrao: dia 1 ate hoje. O chip "Mes atual" continua indo ate o fim do mes.
  const [endDate, setEndDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(new Date(), "yyyy-MM-dd"));
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(() => searchParams.get("period") === "tudo" ? "tudo" : "custom");

  // Só o texto da busca é debounced — os outros filtros (chip, sheet, período)
  // são um toque só e podem bater na hora. Como o valor inicial já entra na
  // chave, montar a tela não espera 250 ms pra começar a buscar.
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 250);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const queryFilters: BetsQueryFilters = {
    statusFilter,
    houseIds,
    sportIds,
    origins,
    unmatched,
    startDate,
    endDate,
    searchTerm: debouncedSearch,
  };

  const setSearch = (term: string) => setSearchTerm(term);
  const setStatus = (status: string[]) => setStatusFilter(status);
  const setHouses = (ids: number[]) => setHouseIds(ids);
  const setSports = (ids: number[]) => setSportIds(ids);
  const setOriginsFilter = (next: string[]) => setOrigins(next);
  const setUnmatchedFilter = (next: boolean) => setUnmatched(next);
  const setDateRange = (from: string, to: string) => {
    setStartDate(from); setEndDate(to); setPeriodPreset("custom");
  };
  const applyMobileFilters = (next: ApostasFilterState) => {
    setPeriodPreset(next.period.preset);
    setStartDate(next.period.from);
    setEndDate(next.period.to);
    setStatusFilter(next.status);
    setHouseIds(next.houseIds);
    setSportIds(next.sportIds);
    setOrigins(next.origins);
    setUnmatched(next.unmatched);
  };
  const clearFilters = () => {
    setStartDate(""); setEndDate(""); setPeriodPreset("tudo");
    setStatusFilter([]); setHouseIds([]); setSportIds([]); setOrigins([]); setUnmatched(false); setSearchTerm("");
  };
  // Filtro ativo = qualquer coisa fora do estado inicial; o vazio da lista usa
  // isso pra decidir entre "limpe os filtros" e "registre a primeira aposta".
  const hasFilters =
    statusFilter.length > 0 || houseIds.length > 0 || sportIds.length > 0 || origins.length > 0 || unmatched ||
    searchTerm !== "" || periodPreset !== "tudo";

  const mobileFilterValue: ApostasFilterState = {
    period: { preset: periodPreset, from: startDate, to: endDate },
    status: statusFilter,
    houseIds,
    sportIds,
    origins,
    unmatched,
  };

  // Periodo so conta como filtro ativo quando difere do padrao (dia 1 -> hoje).
  const dflt = defaultPeriod();
  const periodChanged = startDate !== dflt.from || endDate !== dflt.to;
  const activeMobileFilterCount = [periodChanged, statusFilter.length > 0, houseIds.length > 0, sportIds.length > 0, origins.length > 0 || unmatched].filter(Boolean).length;

  return {
    statusFilter,
    houseIds,
    sportIds,
    origins,
    unmatched,
    startDate,
    endDate,
    searchTerm,
    debouncedSearch,
    queryFilters,
    hasFilters,
    mobileFilterValue,
    activeMobileFilterCount,
    setSearch,
    setStatus,
    setHouses,
    setSports,
    setOrigins: setOriginsFilter,
    setUnmatched: setUnmatchedFilter,
    setDateRange,
    applyMobileFilters,
    clearFilters,
  };
}
