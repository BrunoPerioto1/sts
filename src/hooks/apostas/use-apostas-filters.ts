import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { format, startOfMonth } from "date-fns";
import type { ApostasFilterState, PeriodPreset } from "@/types/apostas-filters";
import { PER_PAGE, type BetsQueryFilters } from "./use-bets-query";

export type ViewMode = "agrupado" | "tabela";

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
  const [houseIds, setHouseIds] = useState<number[]>(() => {
    const fromUrl = searchParams.get("houseId");
    return fromUrl ? [Number(fromUrl)] : [];
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("agrupado");
  const [startDate, setStartDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(() => searchParams.get("period") === "tudo" ? "" : format(new Date(), "yyyy-MM-dd"));
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>(() => searchParams.get("period") === "tudo" ? "tudo" : "mes");
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
    viewMode,
    pageStart,
  };

  const setSearch = (term: string) => { setSearchTerm(term); setPageStart(1); };
  const setStatus = (status: string[]) => { setStatusFilter(status); setPageStart(1); };
  // ApostasFilter (desktop) continua single-select — ponte pro houseIds[] interno.
  const setHouseFromSelect = (id: string) => { setHouseIds(id === "0" ? [] : [Number(id)]); setPageStart(1); };
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
  const changeViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    // Agrupado não pagina; voltar pra ele vindo da página 3 da Tabela deixaria
    // o rodapé contando "61–90 de N" sem nada pra paginar.
    setPageStart(1);
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

  const activeMobileFilterCount = [periodPreset !== "mes", statusFilter.length > 0, houseIds.length > 0].filter(Boolean).length;

  return {
    statusFilter,
    houseIds,
    startDate,
    endDate,
    searchTerm,
    viewMode,
    pageStart,
    debouncedSearch,
    perPage: PER_PAGE,
    queryFilters,
    hasFilters,
    mobileFilterValue,
    activeMobileFilterCount,
    setSearch,
    setStatus,
    setHouseFromSelect,
    setDateRange,
    applyMobileFilters,
    clearFilters,
    changeViewMode,
    setPageStart,
  };
}
