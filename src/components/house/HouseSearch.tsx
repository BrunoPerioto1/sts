import { MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type HouseSort = "balance" | "name" | "profit";

interface HousesSearchProps {
  searchTerm: string;
  onChange: (val: string) => void;
  onlyWithBalance: boolean;
  onOnlyWithBalanceChange: (val: boolean) => void;
  sort: HouseSort;
  onSortChange: (val: HouseSort) => void;
  isLoading?: boolean;
}

export function HousesSearch({
  searchTerm,
  onChange,
  onlyWithBalance,
  onOnlyWithBalanceChange,
  sort,
  onSortChange,
  isLoading = false,
}: HousesSearchProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-[240px]">
        <MagnifyingGlass size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 opacity-50" />
        <Input placeholder="Buscar casa" value={searchTerm} onChange={(e) => onChange(e.target.value)} className="pl-8" disabled={isLoading} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={onlyWithBalance} onCheckedChange={(v) => onOnlyWithBalanceChange(!!v)} disabled={isLoading} />
        Só com saldo
      </label>

      <div className="flex items-center gap-2 text-sm opacity-70">
        <span>Ordenar:</span>
        <Select value={sort} onValueChange={(v) => onSortChange(v as HouseSort)} disabled={isLoading}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">Saldo</SelectItem>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="profit">Lucro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
