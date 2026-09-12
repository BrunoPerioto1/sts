import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { DateRangeField } from "@/components/ui/date-range-field";
import { OptionMultiSelect } from "@/components/ui/option-multi-select";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { STATUS_OPTIONS } from "@/lib/bet-status";
import { MagnifyingGlass, DownloadSimple, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface ApostasFilterProps {
  houses: { id: number; name: string }[];
  sports: { id: number; name: string }[];
  onSearch: (term: string) => void;
  onFilterStatus?: (status: string[]) => void;
  onFilterHouses?: (houseIds: number[]) => void;
  onFilterSports?: (sportIds: number[]) => void;
  onDateRangeChange?: (startDate: string, endDate: string) => void;
  onClearFilters?: () => void;
  onExportCsv?: () => void;
  className?: string;
  isLoading?: boolean;
  initialDateFrom?: string;
  initialDateTo?: string;
  initialSearchTerm?: string;
  initialStatus?: string[];
  initialHouseIds?: number[];
  initialSportIds?: number[];
}

const statusLabels: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

const divider = <div className="h-5 w-px bg-white/10 shrink-0" />;

export function ApostasFilter({
  houses,
  sports,
  onSearch,
  onFilterStatus,
  onFilterHouses,
  onFilterSports,
  onDateRangeChange,
  onClearFilters,
  onExportCsv,
  className,
  isLoading = false,
  initialDateFrom = "",
  initialDateTo = "",
  initialSearchTerm = "",
  initialStatus = [],
  initialHouseIds = [],
  initialSportIds = [],
}: ApostasFilterProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [status, setStatus] = useState<string[]>(initialStatus);
  const [houseIds, setHouseIds] = useState<number[]>(initialHouseIds);
  const [sportIds, setSportIds] = useState<number[]>(initialSportIds);

  const activeChips: { key: string; label: string; clear: () => void; solid?: boolean }[] = [];
  if (searchTerm) activeChips.push({ key: "q", label: `Busca: "${searchTerm}"`, clear: () => { setSearchTerm(""); onSearch(""); } });
  if (dateFrom || dateTo) {
    const fromLabel = dateFrom ? format(parseISO(dateFrom), "dd MMM", { locale: ptBR }) : null;
    const toLabel = dateTo ? format(parseISO(dateTo), "dd MMM", { locale: ptBR }) : null;
    activeChips.push({
      key: "range",
      label: fromLabel && toLabel ? `${fromLabel} – ${toLabel}` : fromLabel ? `De ${fromLabel}` : `Até ${toLabel}`,
      clear: () => { setDateFrom(""); setDateTo(""); onDateRangeChange?.("", ""); },
    });
  }
  // Chips de status vêm sólidas (é a seleção multi-select em si); as demais
  // ficam com contorno — mesma distinção da referência de design.
  for (const s of status) {
    activeChips.push({
      key: `status-${s}`,
      label: statusLabels[s] ?? s,
      solid: true,
      clear: () => {
        const next = status.filter((v) => v !== s);
        setStatus(next);
        onFilterStatus?.(next);
      },
    });
  }
  for (const id of sportIds) {
    const sportName = sports.find((sp) => sp.id === id)?.name ?? String(id);
    activeChips.push({
      key: `sport-${id}`,
      label: sportName,
      clear: () => {
        const next = sportIds.filter((v) => v !== id);
        setSportIds(next);
        onFilterSports?.(next);
      },
    });
  }
  for (const id of houseIds) {
    const houseName = houses.find((h) => h.id === id)?.name ?? String(id);
    activeChips.push({
      key: `house-${id}`,
      label: houseName,
      clear: () => {
        const next = houseIds.filter((v) => v !== id);
        setHouseIds(next);
        onFilterHouses?.(next);
      },
    });
  }

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setStatus([]);
    setHouseIds([]);
    setSportIds([]);
    onClearFilters?.();
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="h-11 rounded-xl border border-white/10 bg-white/[0.02] flex items-center overflow-x-auto">
        <div className="flex items-center gap-2 px-3.5 flex-1 min-w-0">
          <MagnifyingGlass className="h-4 w-4 text-zinc-500 shrink-0" />
          <Input
            placeholder="Buscar apostas..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
            disabled={isLoading}
            className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-base text-white placeholder:text-zinc-500 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <DateRangeField
            startDate={dateFrom}
            endDate={dateTo}
            onChange={(from, to) => { setDateFrom(from); setDateTo(to); onDateRangeChange?.(from, to); }}
            placeholder="Período"
            disabled={isLoading}
            className="h-auto min-h-0 w-auto border-transparent bg-transparent hover:bg-transparent hover:border-transparent p-0 gap-1.5 text-sm text-white"
            iconClassName="h-4 w-4 text-zinc-500 shrink-0"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <StatusMultiSelect
            selected={status}
            onChange={(next) => { setStatus(next); onFilterStatus?.(next); }}
            disabled={isLoading}
            className="min-h-0 text-sm"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <OptionMultiSelect
            options={houses}
            selected={houseIds}
            onChange={(next) => { setHouseIds(next); onFilterHouses?.(next); }}
            disabled={isLoading}
            label="Casas"
            countLabel="casas"
            searchPlaceholder="Buscar casa"
            emptyLabel="Nenhuma casa encontrada."
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <OptionMultiSelect
            options={sports}
            selected={sportIds}
            onChange={(next) => { setSportIds(next); onFilterSports?.(next); }}
            disabled={isLoading}
            label="Esporte"
            countLabel="esportes"
            searchPlaceholder="Buscar esporte"
            emptyLabel="Nenhum esporte encontrado."
          />
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
              <DownloadSimple className="h-4 w-4" /> Exportar CSV
            </button>
          </>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Filtros ativos</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className={cn(
                "h-7 inline-flex items-center gap-1 rounded-full px-3 text-xs",
                chip.solid ? "bg-accent text-white" : "border border-white/10 bg-white/[0.03] text-zinc-300"
              )}
            >
              {chip.label}
              <button onClick={chip.clear} aria-label="Remover filtro">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button onClick={handleClear} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            Limpar tudo
          </button>
        </div>
      )}
    </div>
  );
}
