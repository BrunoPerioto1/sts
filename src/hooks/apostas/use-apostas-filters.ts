import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import { defaultPeriod, type ApostasFilterState, type PeriodPreset } from "@/types/apostas-filters";
import { PER_PAGE, type BetsQueryFilters } from "./use-bets-query";


// Todo o estado de filtro da tela de apostas: valores, sementes vindas da URL,
// debounce da busca e as ações que mexem em mais de um campo ao mesmo tempo.
// A página só consome — quem decide "trocar filtro volta pra página 1" é aqui.
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
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(startOfMonth(new Date()), "yyyy-MM-dd"));
  // Padrao: dia 1 ate hoje. O chip "Mes atual" continua indo ate o fim do mes.
  const [endDate, setEndDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(new Date(), "yyyy-MM-dd"));
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(() => searchParams.get("period") === "tudo" ? "tudo" : "custom");
  const [pageStart, setPageStart] = useState(1);

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
    startDate,
    endDate,
    searchTerm: debouncedSearch,
    pageStart,
  };

  const setSearch = (term: string) => { setSearchTerm(term); setPageStart(1); };
  const setStatus = (status: string[]) => { setStatusFilter(status); setPageStart(1); };
  const setHouses = (ids: number[]) => { setHouseIds(ids); setPageStart(1); };
  const setDateRange = (from: string, to: string) => {
    setStartDate(from); setEndDate(to); setPeriodPreset("custom"); setPageStart(1);
  };
  const applyMobileFilters = (next: ApostasFilterState) => {
    setPeriodPreset(next.period.preset);
    setStartDate(next.period.from);
    setEndDate(next.period.to);
    setStatusFilter(next.status);
    setHouseIds(next.houseIds);
    setPageStart(1);
  };
  const clearFilters = () => {
    setStartDate(""); setEndDate(""); setPeriodPreset("tudo");
    setStatusFilter([]); setHouseIds([]); setSearchTerm(""); setPageStart(1);
  };
  // Filtro ativo = qualquer coisa fora do estado inicial; o vazio da lista usa
  // isso pra decidir entre "limpe os filtros" e "registre a primeira aposta".
  const hasFilters =
    statusFilter.length > 0 || houseIds.length > 0 || searchTerm !== "" || periodPreset !== "tudo";

  const mobileFilterValue: ApostasFilterState = {
    period: { preset: periodPreset, from: startDate, to: endDate },
    status: statusFilter,
    houseIds,
  };

  // Periodo so conta como filtro ativo quando difere do padrao (dia 1 -> hoje).
  const dflt = defaultPeriod();
  const periodChanged = startDate !== dflt.from || endDate !== dflt.to;
  const activeMobileFilterCount = [periodChanged, statusFilter.length > 0, houseIds.length > 0].filter(Boolean).length;

  return {
    statusFilter,
    houseIds,
    startDate,
    endDate,
    searchTerm,
    pageStart,
    debouncedSearch,
    perPage: PER_PAGE,
    queryFilters,
    hasFilters,
    mobileFilterValue,
    activeMobileFilterCount,
    setSearch,
    setStatus,
    setHouses,
    setDateRange,
    applyMobileFilters,
    clearFilters,
    setPageStart,
  };
}
