import { Buildings, MagnifyingGlass } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { SortSelect, type SortOption } from "@/components/ui/sort-select";
import { TOOLBAR_BOX, TOOLBAR_BUTTON, TOOLBAR_BUTTON_ACTIVE } from "@/components/ui/toolbar";
import { cn } from "@/lib/utils";
import { HouseMultiSelect } from "./HouseMultiSelect";
import type { HouseOption } from "@/hooks/queries/use-houses";

export type HouseSort = "balance" | "name" | "profit" | "bets" | "idle";

/** Recorte da lista: um só por vez (ligar um desliga o outro). */
export type HouseSegment = "all" | "withBalance" | "stopped" | "shortfall";

export interface HouseSegmentOption {
  value: HouseSegment;
  label: string;
  count: number;
}

interface HousesSearchProps {
  searchTerm: string;
  onChange: (val: string) => void;
  segments: HouseSegmentOption[];
  segment: HouseSegment;
  onSegmentChange: (val: HouseSegment) => void;
  houses: HouseOption[];
  houseIds: number[];
  onHouseIdsChange: (ids: number[]) => void;
  sort: HouseSort;
  onSortChange: (val: HouseSort) => void;
  isLoading?: boolean;
}

const SORT_OPTIONS: SortOption<HouseSort>[] = [
  { value: "balance", label: "Saldo", hint: "maior saldo primeiro" },
  { value: "name", label: "Nome", hint: "A → Z" },
  { value: "profit", label: "Lucro", hint: "melhor desempenho primeiro" },
  { value: "bets", label: "Apostas", hint: "mais movimentadas primeiro" },
  { value: "idle", label: "Parada há mais tempo", hint: "mais dias sem apostar primeiro" },
];

// Desenho do Claude Design (Casas Header v2): busca e recortes à esquerda;
// Casas e Ordenar juntos na ponta direita, porque os dois mexem na lista
// inteira e não num recorte.
export function HousesSearch({
  searchTerm,
  onChange,
  segments,
  segment,
  onSegmentChange,
  houses,
  houseIds,
  onHouseIdsChange,
  sort,
  onSortChange,
  isLoading = false,
}: HousesSearchProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className={cn(TOOLBAR_BOX, "flex w-[300px] max-w-full items-center gap-2 px-3 transition-colors focus-within:border-foreground/25")}>
        <MagnifyingGlass size={15} className="shrink-0 text-zinc-500" />
        <Input
          placeholder="Buscar casa"
          value={searchTerm}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading}
          className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-[13px] text-foreground placeholder:text-zinc-500 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
        />
      </label>

      <div role="group" aria-label="Recorte da lista" className="flex gap-0.5 rounded-[9px] border border-foreground/[0.08] bg-[rgb(var(--rgb-panel))] p-[3px]">
        {segments.map((s) => {
          const active = s.value === segment;
          return (
            <button
              key={s.value}
              type="button"
              aria-pressed={active}
              disabled={isLoading}
              onClick={() => onSegmentChange(s.value)}
              className={cn(
                "press flex h-7 items-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors disabled:opacity-50",
                active ? "bg-foreground/[0.08] text-foreground" : "text-zinc-400 hover:text-foreground",
              )}
            >
              {s.label}
              <span className="text-[11px] tabular-nums text-zinc-500">{s.count}</span>
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <HouseMultiSelect
          houses={houses}
          selected={houseIds}
          onChange={onHouseIdsChange}
          disabled={isLoading}
          label="Casas"
          icon={Buildings}
          align="end"
          className={cn(TOOLBAR_BUTTON, "max-w-[240px]", houseIds.length > 0 && TOOLBAR_BUTTON_ACTIVE)}
        />
        <SortSelect
          options={SORT_OPTIONS}
          value={sort}
          onChange={onSortChange}
          disabled={isLoading}
          label="Ordenar"
          className={cn(TOOLBAR_BUTTON, "mx-0")}
        />
      </div>
    </div>
  );
}
