import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { SheetSelectField } from "@/components/apostas/SheetSelectField";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { SportSheet } from "@/components/apostas/SportSheet";
import { SportIcon } from "@/components/apostas/SportIcon";
import { PeriodCalendarSheet } from "@/components/apostas/PeriodCalendarSheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { PERIOD_OPTIONS, PRESET_LABEL, presetRange } from "@/lib/dashboard-periods";

export interface DashboardFiltersDraft {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  houseIds: number[];
  sportIds: number[];
}

// Padrão do "Limpar" e do contador: mesmo preset inicial do useDashboardFilters.
export const DEFAULT_DASHBOARD_PRESET: DatePreset = "currentMonth";

export function countActiveDashboardFilters(f: Pick<DashboardFiltersDraft, "preset" | "houseIds" | "sportIds">) {
  return [f.preset !== DEFAULT_DASHBOARD_PRESET, f.houseIds.length > 0, f.sportIds.length > 0].filter(Boolean).length;
}

const sectionLabel = "text-xs font-medium uppercase tracking-wider text-zinc-500";

interface DashboardFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DashboardFiltersDraft;
  onApply: (next: DashboardFiltersDraft) => void;
  firstBetDate: string | null;
  houses: { id: number; name: string }[];
  sports: { id: number; name: string }[];
}

// Mesmo desenho do MobileFiltersSheet de Apostas: tudo edita um rascunho local
// e só "Aplicar" repassa pro useDashboardFilters — nenhuma query dispara
// enquanto o sheet está aberto, e o X descarta o rascunho.
export function DashboardFiltersSheet({
  open,
  onOpenChange,
  value,
  onApply,
  firstBetDate,
  houses,
  sports,
}: DashboardFiltersSheetProps) {
  const [draft, setDraft] = useState<DashboardFiltersDraft>(value);
  const [casaOpen, setCasaOpen] = useState(false);
  const [sportOpen, setSportOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeCount = countActiveDashboardFilters(draft);

  const casaSummary =
    draft.houseIds.length === 0
      ? "Todas as casas"
      : draft.houseIds.length === 1
        ? (houses.find((h) => h.id === draft.houseIds[0])?.name ?? "1 casa")
        : `${draft.houseIds.length} casas`;

  const sportSummary =
    draft.sportIds.length === 0
      ? "Todos os esportes"
      : draft.sportIds.length === 1
        ? (sports.find((s) => s.id === draft.sportIds[0])?.name ?? "1 esporte")
        : `${draft.sportIds.length} esportes`;

  const periodLabel = `${format(parseISO(draft.startDate), "dd MMM", { locale: ptBR })} – ${format(parseISO(draft.endDate), "dd MMM", { locale: ptBR })}`;

  const selectPreset = (preset: Exclude<DatePreset, "custom">) => {
    const { from, to } = presetRange(preset, firstBetDate);
    setDraft((d) => ({ ...d, preset, startDate: from, endDate: to }));
  };

  const handleClear = () => {
    const { from, to } = presetRange(DEFAULT_DASHBOARD_PRESET as Exclude<DatePreset, "custom">, firstBetDate);
    setDraft({ preset: DEFAULT_DASHBOARD_PRESET, startDate: from, endDate: to, houseIds: [], sportIds: [] });
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      titleExtra={
        activeCount > 0 && (
          <span className="h-5 min-w-[20px] px-1 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
            {activeCount}
          </span>
        )
      }
      footer={
        <div className="flex items-center gap-2">
          <Button variant="outline" className="min-h-[44px] px-4" onClick={handleClear}>
            Limpar
          </Button>
          <Button className="flex-1 min-h-[44px]" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      }
    >
      <div className="py-3 space-y-5">
        <section className="space-y-2">
          <p className={sectionLabel}>Período</p>
          <div className="flex flex-wrap gap-2">
            {PERIOD_OPTIONS.map(({ value: preset }) => {
              // Período personalizado não acende nenhum chip: um só estado de período ativo.
              const isActive = draft.preset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => selectPreset(preset)}
                  className={cn(
                    "press h-9 px-3.5 rounded-full text-sm font-medium min-h-[44px] flex items-center",
                    isActive ? "bg-accent text-white" : "border border-foreground/10 text-zinc-400"
                  )}
                >
                  {PRESET_LABEL[preset]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Casas</p>
          <SheetSelectField summary={casaSummary} onOpen={() => setCasaOpen(true)} />
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Esportes</p>
          <SheetSelectField
            summary={sportSummary}
            onOpen={() => setSportOpen(true)}
            leading={
              draft.sportIds.length === 1 && (
                <SportIcon name={sports.find((s) => s.id === draft.sportIds[0])?.name} className="text-zinc-400 shrink-0" />
              )
            }
          />
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Período personalizado</p>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className={cn(
              "flex w-full items-center gap-2.5 min-h-[44px] rounded-md border bg-card px-[10px] py-[8px] text-left",
              draft.preset === "custom" ? "border-accent" : "border-input"
            )}
          >
            <CalendarBlank className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="flex-1 text-sm text-foreground truncate">{periodLabel}</span>
            <CaretRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          </button>
        </section>
      </div>

      <CasaSheet
        open={casaOpen}
        onOpenChange={setCasaOpen}
        houses={houses}
        houseIds={draft.houseIds}
        onChange={(houseIds) => setDraft((d) => ({ ...d, houseIds }))}
      />
      <SportSheet
        open={sportOpen}
        onOpenChange={setSportOpen}
        sports={sports}
        selected={draft.sportIds}
        onChange={(sportIds) => setDraft((d) => ({ ...d, sportIds }))}
      />
      <PeriodCalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        from={draft.startDate}
        to={draft.endDate}
        onApply={(startDate, endDate) => setDraft((d) => ({ ...d, preset: "custom", startDate, endDate }))}
      />
    </BottomSheet>
  );
}
