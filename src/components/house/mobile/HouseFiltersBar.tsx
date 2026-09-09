import { ArrowsDownUp, MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { stagger } from "@/lib/motion";
import type { HouseSortMobile } from "./SortSheet";

const SORT_LABEL: Record<HouseSortMobile, string> = {
  balance: "Saldo",
  profit: "Lucro",
  name: "Nome",
  bets: "Apostas",
  lastMovement: "Última mov.",
};

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
  onOpenSort: () => void;
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
  onOpenSort,
}: HouseFiltersBarProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-hidden="true">
        <div className="skeleton h-11 rounded-md" style={{ animationDelay: "140ms" }} />
        <div className="flex items-center gap-2">
          <div className="skeleton h-11 w-28 rounded-full" style={{ animationDelay: "200ms" }} />
          <div className="skeleton h-11 w-24 rounded-full" style={{ animationDelay: "260ms" }} />
          <div className="skeleton h-11 w-24 rounded-full ml-auto" style={{ animationDelay: "320ms" }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative animate-rise stagger" style={stagger(1)}>
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input placeholder="Buscar casa" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-9 min-h-[44px]" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 animate-rise stagger [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" style={stagger(2)}>
        <button type="button" aria-pressed={onlyWithBalance} onClick={onToggleWithBalance} className={cn("press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium", onlyWithBalance ? "bg-accent text-white" : "border border-white/10 bg-transparent text-zinc-400")}>
          Com saldo {withBalanceCount}
        </button>
        <button type="button" aria-pressed={onlyNegative} onClick={onToggleNegative} className={cn("press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium", onlyNegative ? "bg-accent text-white" : "border border-white/10 bg-transparent text-zinc-400")}>
          Negativas
        </button>
        <button type="button" onClick={onOpenSort} className="press shrink-0 h-11 px-3.5 rounded-full text-sm font-medium border border-white/10 bg-transparent text-zinc-400 flex items-center gap-1.5 ml-auto">
          <ArrowsDownUp size={13} /> {SORT_LABEL[sort]}
        </button>
      </div>
    </>
  );
}
