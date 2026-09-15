import { MagnifyingGlass, DownloadSimple } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HouseMultiSelect } from "./HouseMultiSelect";
import type { HouseOption } from "@/hooks/queries/use-houses";

export type HouseSort = "balance" | "name" | "profit";

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

const divider = <div className="h-5 w-px bg-white/10 shrink-0" />;

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
    <div className="h-11 rounded-xl border border-white/10 bg-white/[0.02] flex items-center overflow-x-auto">
      <div className="flex items-center gap-2 px-3.5 flex-1 min-w-0">
        <MagnifyingGlass className="h-4 w-4 text-zinc-500 shrink-0" />
        <Input
          placeholder="Buscar casa"
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-base text-white placeholder:text-zinc-500 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
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
        <Select value={sort} onValueChange={(v) => onSortChange(v as HouseSort)} disabled={isLoading}>
          <SelectTrigger className="w-auto min-h-0 h-auto gap-1.5 border-transparent bg-transparent hover:border-transparent hover:bg-transparent px-0 text-sm text-white">
            <span className="text-zinc-500 shrink-0">Ordenar</span>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Saldo</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="profit">Lucro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {onExportCsv && (
        <>
          {divider}
          <button
            type="button"
            onClick={onExportCsv}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3.5 text-sm text-zinc-300 hover:text-white transition-colors shrink-0 disabled:opacity-45 disabled:pointer-events-none"
          >
            <DownloadSimple className="h-4 w-4" /> CSV
          </button>
        </>
      )}
    </div>
  );
}
