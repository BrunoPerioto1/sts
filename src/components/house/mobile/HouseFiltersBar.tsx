import { Buildings } from "@phosphor-icons/react";
import { SearchField } from "@/components/ui/search-field";
import { FilterChip, FilterChipRow } from "@/components/ui/filter-chips";
import { SortSelect, type SortOption } from "@/components/ui/sort-select";
import { stagger } from "@/lib/motion";

export type HouseSortMobile = "balance" | "profit" | "name" | "bets" | "idle" | "lastMovement";

const SORT_OPTIONS: SortOption<HouseSortMobile>[] = [
  { value: "balance", label: "Saldo", hint: "maior saldo primeiro" },
  { value: "profit", label: "Lucro", hint: "melhor desempenho primeiro" },
  { value: "name", label: "Nome", hint: "A → Z" },
  { value: "bets", label: "Apostas", hint: "mais movimentadas primeiro" },
  { value: "idle", label: "Parada", hint: "mais dias sem apostar primeiro" },
  { value: "lastMovement", label: "Última mov.", hint: "mais recente primeiro" },
];

interface HouseFiltersBarProps {
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  withBalanceCount: number;
  onlyWithBalance: boolean;
  onToggleWithBalance: () => void;
  onlyNegative: boolean;
  onToggleNegative: () => void;
  sort: HouseSortMobile;
  onSortChange: (sort: HouseSortMobile) => void;
  selectedHousesCount: number;
  onOpenCasas: () => void;
}

export function HouseFiltersBar({
  loading,
  searchTerm,
  onSearchChange,
  withBalanceCount,
  onlyWithBalance,
  onToggleWithBalance,
  onlyNegative,
  onToggleNegative,
  sort,
  onSortChange,
  selectedHousesCount,
  onOpenCasas,
}: HouseFiltersBarProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="skeleton h-11 rounded-xl" style={{ animationDelay: "140ms" }} />
        <div className="flex items-center gap-2">
          <div className="skeleton h-9 w-28 rounded-full" style={{ animationDelay: "200ms" }} />
          <div className="skeleton h-9 w-24 rounded-full" style={{ animationDelay: "260ms" }} />
          <div className="skeleton h-9 w-20 rounded-full ml-auto" style={{ animationDelay: "320ms" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Buscar é a ação principal da tela: campo aberto, não ícone no header. */}
      <div className="animate-rise stagger" style={stagger(1)}>
        <SearchField value={searchTerm} onChange={onSearchChange} placeholder="Buscar casa" />
      </div>

      <FilterChipRow className="animate-rise stagger">
        <FilterChip active={onlyWithBalance} count={withBalanceCount} onClick={onToggleWithBalance}>
          Com saldo
        </FilterChip>
        <FilterChip active={onlyNegative} onClick={onToggleNegative}>
          Negativas
        </FilterChip>
        <FilterChip
          opensSheet
          icon={Buildings}
          active={selectedHousesCount > 0}
          count={selectedHousesCount > 0 ? selectedHousesCount : undefined}
          onClick={onOpenCasas}
        >
          Casas
        </FilterChip>
        {/* Ordenar não é filtro: fica separado, à direita, sem cara de chip. */}
        <div className="ml-auto shrink-0 pl-1">
          <SortSelect options={SORT_OPTIONS} value={sort} onChange={onSortChange} />
        </div>
      </FilterChipRow>
    </div>
  );
}
