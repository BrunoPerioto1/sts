import { MagnifyingGlass, DownloadSimple } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SortSelect, type SortOption } from "@/components/ui/sort-select";
import { HouseMultiSelect } from "./HouseMultiSelect";
import type { HouseOption } from "@/hooks/queries/use-houses";

export type HouseSort = "balance" | "name" | "profit" | "bets" | "idle";

interface HousesSearchProps {
  searchTerm: string;
  onChange: (val: string) => void;
  houses: HouseOption[];
  houseIds: number[];
  onHouseIdsChange: (ids: number[]) => void;
  onlyWithBalance: boolean;
  onOnlyWithBalanceChange: (val: boolean) => void;
  sort: HouseSort;
  onSortChange: (val: HouseSort) => void;
  onExportCsv?: () => void;
  isLoading?: boolean;
}

const divider = <div className="h-5 w-px bg-foreground/10 shrink-0" />;

const SORT_OPTIONS: SortOption<HouseSort>[] = [
  { value: "balance", label: "Saldo", hint: "maior saldo primeiro" },
  { value: "name", label: "Nome", hint: "A → Z" },
  { value: "profit", label: "Lucro", hint: "melhor desempenho primeiro" },
  { value: "bets", label: "Apostas", hint: "mais movimentadas primeiro" },
  { value: "idle", label: "Parada há mais tempo", hint: "mais dias sem apostar primeiro" },
];

// Mesma barra única da tela de apostas — antes eram três controles soltos
// flutuando com alturas diferentes.
export function HousesSearch({
  searchTerm,
  onChange,
  houses,
  houseIds,
  onHouseIdsChange,
  onlyWithBalance,
  onOnlyWithBalanceChange,
  sort,
  onSortChange,
  onExportCsv,
  isLoading = false,
}: HousesSearchProps) {
  return (
    <div className="h-11 rounded-xl border border-foreground/10 bg-foreground/[0.02] flex items-center overflow-x-auto">
      <div className="flex items-center gap-2 px-3.5 flex-1 min-w-0">
        <MagnifyingGlass className="h-4 w-4 text-zinc-500 shrink-0" />
        <Input
          placeholder="Buscar casa"
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-base text-foreground placeholder:text-zinc-600 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
        />
      </div>

      {divider}

      <div className="px-3.5 shrink-0">
        <HouseMultiSelect
          houses={houses}
          selected={houseIds}
          onChange={onHouseIdsChange}
          disabled={isLoading}
          label="Casas"
        />
      </div>

      {divider}

      <label className="flex items-center gap-2 px-3.5 text-sm shrink-0 cursor-pointer">
        <Checkbox checked={onlyWithBalance} onCheckedChange={(v) => onOnlyWithBalanceChange(!!v)} disabled={isLoading} />
        Só com saldo
      </label>

      {divider}

      <div className="px-3.5 shrink-0">
        <SortSelect options={SORT_OPTIONS} value={sort} onChange={onSortChange} disabled={isLoading} />
      </div>

      {onExportCsv && (
        <>
          {divider}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 text-sm text-zinc-300 hover:text-foreground transition-colors shrink-0 disabled:opacity-45 disabled:pointer-events-none"
          >
            <DownloadSimple className="h-4 w-4" /> CSV
          </button>
        </>
      )}
    </div>
  );
}
