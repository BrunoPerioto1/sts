import { SlidersHorizontal } from "@phosphor-icons/react";
import { MobileSearchToggle } from "./MobileSearchHeader";

interface ApostasMobileHeaderProps {
  searchExpanded: boolean;
  onToggleSearch: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
}

export function ApostasMobileHeader({ searchExpanded, onToggleSearch, onOpenFilters, activeFilterCount }: ApostasMobileHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight truncate">Apostas</h1>
      </div>
      {/* Seleção múltipla entra por toque longo/swipe no card e o refresh
          por pull-to-refresh — os dois ícones saíram daqui pra deixar só
          busca e filtro visíveis. */}
      <div className="flex items-center gap-2">
        <MobileSearchToggle expanded={searchExpanded} onToggle={onToggleSearch} />
        <button
          type="button"
          onClick={onOpenFilters}
          aria-label="Abrir filtros"
          className="press relative h-11 w-11 flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 hover:text-white"
        >
          <SlidersHorizontal size={19} />
          {activeFilterCount > 0 && (
            <span className="absolute top-0.5 right-0.5 h-[15px] min-w-[15px] px-[3px] rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
