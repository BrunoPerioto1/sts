import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { PeriodPopover } from "@/components/dashboard/PeriodPopover";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { useSports } from "@/hooks/queries/use-sports";
import { STATUS_OPTIONS } from "@/lib/bet-status";
import { ORIGIN_LABEL, ORIGIN_OPTIONS } from "@/lib/bet-origin";
import { MagnifyingGlass, DownloadSimple, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { PERIOD_OPTIONS, presetRange, type SheetPreset } from "@/lib/dashboard-periods";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";

interface ApostasFilterProps {
  houses: { id: number; name: string }[];
  onSearch: (term: string) => void;
  onFilterStatus?: (status: string[]) => void;
  onFilterHouses?: (houseIds: number[]) => void;
  onFilterSports?: (sportIds: number[]) => void;
  onFilterOrigins?: (origins: string[]) => void;
  onFilterUnmatched?: (unmatched: boolean) => void;
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
  initialOrigins?: string[];
  initialUnmatched?: boolean;
}

const statusLabels: Record<string, string> = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]));

// Na lista de apostas "Tudo" é sem recorte de data (inclui jogo futuro), não
// "da primeira aposta até hoje" como no dashboard.
function rangeFor(preset: SheetPreset): { from: string; to: string } {
  return preset === "allTime" ? { from: "", to: "" } : presetRange(preset, null);
}

// A tela guarda só as datas; o preset marcado no popover é o que bate com elas.
function presetFor(from: string, to: string): DatePreset {
  const match = PERIOD_OPTIONS.find((opt) => {
    const r = rangeFor(opt.value);
    return r.from === from && r.to === to;
  });
  return match?.value ?? "custom";
}

const divider = <div className="h-5 w-px bg-foreground/10 shrink-0" />;

export function ApostasFilter({
  houses,
  onSearch,
  onFilterStatus,
  onFilterHouses,
  onFilterSports,
  onFilterOrigins,
  onFilterUnmatched,
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
  initialOrigins = [],
  initialUnmatched = false,
}: ApostasFilterProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [status, setStatus] = useState<string[]>(initialStatus);
  const [houseIds, setHouseIds] = useState<number[]>(initialHouseIds);
  const [sportIds, setSportIds] = useState<number[]>(initialSportIds);
  const [origins, setOrigins] = useState<string[]>(initialOrigins);
  const [unmatched, setUnmatched] = useState(initialUnmatched);
  const sports = useSports();

  const applyRange = ({ from, to }: { from: string; to: string }) => {
    setDateFrom(from);
    setDateTo(to);
    onDateRangeChange?.(from, to);
  };
  const periodPreset = presetFor(dateFrom, dateTo);
  const fromLabel = dateFrom ? format(parseISO(dateFrom), "dd MMM", { locale: ptBR }) : null;
  const toLabel = dateTo ? format(parseISO(dateTo), "dd MMM", { locale: ptBR }) : null;
  const rangeLabel = fromLabel && toLabel ? `${fromLabel} – ${toLabel}` : fromLabel ? `De ${fromLabel}` : `Até ${toLabel}`;

  const activeChips: { key: string; label: string; clear: () => void; solid?: boolean }[] = [];
  if (searchTerm) activeChips.push({ key: "q", label: `Busca: "${searchTerm}"`, clear: () => { setSearchTerm(""); onSearch(""); } });
  if (dateFrom || dateTo) {
    activeChips.push({
      key: "range",
      label: rangeLabel,
      clear: () => applyRange({ from: "", to: "" }),
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

  for (const id of sportIds) {
    activeChips.push({
      key: `sport-${id}`,
      label: sports.find((s) => s.id === id)?.name ?? String(id),
      clear: () => {
        const next = sportIds.filter((v) => v !== id);
        setSportIds(next);
        onFilterSports?.(next);
      },
    });
  }

  for (const o of origins) {
    activeChips.push({
      key: `origin-${o}`,
      label: ORIGIN_LABEL[o] ?? o,
      clear: () => {
        const next = origins.filter((v) => v !== o);
        setOrigins(next);
        onFilterOrigins?.(next);
      },
    });
  }
  if (unmatched) {
    activeChips.push({
      key: "unmatched",
      label: "Sem jogo identificado",
      clear: () => { setUnmatched(false); onFilterUnmatched?.(false); },
    });
  }

  const handleClear = () => {
    setSearchTerm("");
    setDateFrom("");
    setDateTo("");
    setStatus([]);
    setHouseIds([]);
    setSportIds([]);
    setOrigins([]);
    setUnmatched(false);
    onClearFilters?.();
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="h-11 rounded-xl border border-foreground/10 bg-foreground/[0.02] flex items-center overflow-x-auto">
        <div className="flex items-center gap-2 px-3.5 flex-1 min-w-0">
          <MagnifyingGlass className="h-4 w-4 text-zinc-500 shrink-0" />
          <Input
            placeholder="Buscar apostas..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
            disabled={isLoading}
            className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-base text-foreground placeholder:text-zinc-500 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <PeriodPopover
            preset={periodPreset}
            firstBetDate={null}
            from={dateFrom}
            to={dateTo}
            onSelect={(preset) => {
              if (preset !== "custom") applyRange(rangeFor(preset as SheetPreset));
            }}
            onCustomRange={(from, to) => applyRange({ from, to })}
            // Intervalo solto mostra as datas; "Personalizado" não diz nada.
            label={periodPreset === "custom" ? rangeLabel : undefined}
            align="start"
            disabled={isLoading}
            className="h-auto border-0 px-0 text-sm text-foreground hover:border-0"
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
          <HouseMultiSelect
            houses={houses}
            selected={houseIds}
            onChange={(next) => { setHouseIds(next); onFilterHouses?.(next); }}
            disabled={isLoading}
            label="Casas"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <HouseMultiSelect
            houses={sports}
            selected={sportIds}
            onChange={(next) => { setSportIds(next); onFilterSports?.(next); }}
            disabled={isLoading}
            label="Esportes"
            noun={["esporte", "esportes"]}
            allLabel="Todos"
          />
        </div>

        {divider}

        <div className="px-3.5 shrink-0">
          <StatusMultiSelect
            label="Origem"
            options={ORIGIN_OPTIONS}
            selected={origins}
            onChange={(next) => { setOrigins(next); onFilterOrigins?.(next); }}
            disabled={isLoading}
            className="min-h-0 text-sm"
            noun={["origem", "origens"]}
            allLabel="Todas"
            // Aposta sem jogo casado não tem horário nem placar automático:
            // é a que a conferência não resolve sozinha.
            extra={{
              section: "Jogo",
              label: "Sem jogo identificado",
              checked: unmatched,
              onToggle: () => { setUnmatched(!unmatched); onFilterUnmatched?.(!unmatched); },
            }}
          />
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
              <DownloadSimple className="h-4 w-4" /> Exportar CSV
            </button>
          </>
        )}
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted">Filtros ativos</span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className={cn(
                "h-7 inline-flex items-center gap-1 rounded-full px-3 text-xs",
                chip.solid ? "bg-accent text-white" : "border border-foreground/10 bg-foreground/[0.03] text-zinc-300"
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
