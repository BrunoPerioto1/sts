import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { PeriodPopover } from "@/components/dashboard/PeriodPopover";
import { HouseMultiSelect } from "@/components/house/HouseMultiSelect";
import { StatusMultiSelect } from "./StatusMultiSelect";
import { useSports } from "@/hooks/queries/use-sports";
import { ORIGIN_OPTIONS } from "@/lib/bet-origin";
import { Buildings, CalendarBlank, CircleHalf, MagnifyingGlass, PaperPlaneTilt, SoccerBall, X } from "@phosphor-icons/react";
import { TOOLBAR_BOX, TOOLBAR_BUTTON, TOOLBAR_BUTTON_ACTIVE } from "@/components/ui/toolbar";
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

// "01 – 21 out" no mesmo mês, "28 set – 05 out" entre meses.
function rangeLabel(from: string, to: string): string {
  const day = (d: string) => format(parseISO(d), "dd", { locale: ptBR });
  const dayMonth = (d: string) => format(parseISO(d), "dd MMM", { locale: ptBR });
  if (from && to) return from.slice(0, 7) === to.slice(0, 7) ? `${day(from)} – ${dayMonth(to)}` : `${dayMonth(from)} – ${dayMonth(to)}`;
  return from ? `De ${dayMonth(from)}` : `Até ${dayMonth(to)}`;
}

// Desenho do Claude Design (Apostas Header v2): cada filtro na própria caixa,
// "Rótulo Valor ▾", e o que estiver fora do padrão ganha o tom do accent. O
// valor escolhido já aparece no gatilho, então não há mais a fileira de
// "Filtros ativos" embaixo — "Limpar filtros" zera tudo de uma vez.
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
  const hasRange = !!(dateFrom || dateTo);
  const hasFilters =
    !!searchTerm || hasRange || status.length > 0 || houseIds.length > 0 || sportIds.length > 0 || origins.length > 0 || unmatched;

  const trigger = (active: boolean) => cn(TOOLBAR_BUTTON, active && TOOLBAR_BUTTON_ACTIVE);

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
    <div className={cn("flex w-full flex-wrap items-center gap-2", className)}>
      <label className={cn(TOOLBAR_BOX, "flex w-[300px] max-w-full items-center gap-2 px-3 transition-colors focus-within:border-foreground/25")}>
        <MagnifyingGlass size={15} className="shrink-0 text-zinc-500" />
        <Input
          placeholder="Buscar evento, mercado…"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); onSearch(e.target.value); }}
          disabled={isLoading}
          className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-[13px] text-foreground placeholder:text-zinc-500 hover:border-0 focus-visible:border-0 focus-visible:outline-none"
        />
      </label>

      <PeriodPopover
        preset={presetFor(dateFrom, dateTo)}
        firstBetDate={null}
        from={dateFrom}
        to={dateTo}
        onSelect={(preset) => {
          if (preset !== "custom") applyRange(rangeFor(preset as SheetPreset));
        }}
        onCustomRange={(from, to) => applyRange({ from, to })}
        // Com recorte mostra as datas ("01 – 21 out"); sem, o padrão "Período Tudo".
        icon={<CalendarBlank size={15} className={hasRange ? "text-accent-text" : "text-zinc-400"} />}
        label={
          hasRange ? (
            rangeLabel(dateFrom, dateTo)
          ) : (
            <>
              <span className="text-zinc-500">Período</span>
              <span>Tudo</span>
            </>
          )
        }
        align="start"
        disabled={isLoading}
        className={cn(trigger(hasRange), hasRange ? "text-foreground" : "text-zinc-300")}
      />

      <StatusMultiSelect
        icon={CircleHalf}
        selected={status}
        onChange={(next) => { setStatus(next); onFilterStatus?.(next); }}
        disabled={isLoading}
        className={trigger(status.length > 0)}
      />

      <HouseMultiSelect
        icon={Buildings}
        houses={houses}
        selected={houseIds}
        onChange={(next) => { setHouseIds(next); onFilterHouses?.(next); }}
        disabled={isLoading}
        label="Casas"
        className={cn(trigger(houseIds.length > 0), "max-w-[240px]")}
      />

      <HouseMultiSelect
        icon={SoccerBall}
        houses={sports}
        selected={sportIds}
        onChange={(next) => { setSportIds(next); onFilterSports?.(next); }}
        disabled={isLoading}
        label="Esporte"
        noun={["esporte", "esportes"]}
        allLabel="Todos"
        className={cn(trigger(sportIds.length > 0), "max-w-[240px]")}
      />

      <StatusMultiSelect
        icon={PaperPlaneTilt}
        label="Origem"
        options={ORIGIN_OPTIONS}
        selected={origins}
        onChange={(next) => { setOrigins(next); onFilterOrigins?.(next); }}
        disabled={isLoading}
        className={trigger(origins.length > 0 || unmatched)}
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

      {hasFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="press ml-auto flex h-9 items-center gap-1.5 px-2.5 text-[13px] font-medium text-zinc-400 transition-colors hover:text-foreground"
        >
          <X size={14} /> Limpar filtros
        </button>
      )}
    </div>
  );
}
