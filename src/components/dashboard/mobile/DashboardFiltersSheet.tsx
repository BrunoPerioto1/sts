import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { SheetSelectField } from "@/components/apostas/SheetSelectField";
import { CasaSheet } from "@/components/apostas/CasaSheet";
import { SportSheet } from "@/components/apostas/SportSheet";
import { SportIcon } from "@/components/apostas/SportIcon";
import { PeriodCalendarSheet } from "@/components/apostas/PeriodCalendarSheet";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chips";
import { SectionLabel } from "@/components/ui/section-label";
import { houseDisplayName } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { PRESET_LABEL, presetRange } from "@/lib/dashboard-periods";

// Poucos atalhos, numa linha só (cabe até em 320px). Os outros presets
// (7/14/60 dias) seguem valendo se já estiverem salvos — só não têm chip;
// qualquer outro recorte sai pelo "Período personalizado".
const PERIOD_CHIPS = ["currentMonth", "lastMonth", "allTime"] as const;

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

// Mesma altura/raio/padding do campo "Período personalizado".
const selectField = "min-h-[48px] rounded-lg px-3";

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

  const isDefault = countActiveDashboardFilters(draft) === 0;

  const casaSummary =
    draft.houseIds.length === 0
      ? "Todas as casas"
      : draft.houseIds.length === 1
        ? houseDisplayName(houses.find((h) => h.id === draft.houseIds[0])?.name ?? "1 casa")
        : `${draft.houseIds.length} casas`;

  const sportSummary =
    draft.sportIds.length === 0
      ? "Todos os esportes"
      : draft.sportIds.length === 1
        ? (sports.find((s) => s.id === draft.sportIds[0])?.name ?? "1 esporte")
        : `${draft.sportIds.length} esportes`;

  const isCustom = draft.preset === "custom";
  const customLabel = `${format(parseISO(draft.startDate), "dd MMM", { locale: ptBR })} – ${format(parseISO(draft.endDate), "dd MMM", { locale: ptBR })}`;
  const customDays = differenceInCalendarDays(parseISO(draft.endDate), parseISO(draft.startDate)) + 1;

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
      footer={
        <div className="flex items-center gap-2">
          <Button variant="secondary" className="min-h-[44px] px-5" onClick={handleClear} disabled={isDefault}>
            Limpar
          </Button>
          <Button className="flex-1 min-h-[44px]" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      }
    >
      <div className="pt-1 pb-4 space-y-6">
        <section className="space-y-2.5">
          <SectionLabel as="h3">Período</SectionLabel>
          {/* Período personalizado não acende nenhum chip: um só estado de período ativo. */}
          <div className="flex flex-wrap gap-2">
            {PERIOD_CHIPS.map((preset) => (
              <FilterChip key={preset} active={draft.preset === preset} onClick={() => selectPreset(preset)}>
                {PRESET_LABEL[preset]}
              </FilterChip>
            ))}
          </div>
        </section>

        <section className="space-y-2.5">
          <SectionLabel as="h3">Casas</SectionLabel>
          <SheetSelectField className={selectField} summary={casaSummary} onOpen={() => setCasaOpen(true)} />
        </section>

        <section className="space-y-2.5">
          <SectionLabel as="h3">Esportes</SectionLabel>
          <SheetSelectField
            className={selectField}
            summary={sportSummary}
            onOpen={() => setSportOpen(true)}
            leading={
              draft.sportIds.length === 1 && (
                <SportIcon name={sports.find((s) => s.id === draft.sportIds[0])?.name} className="text-zinc-400 shrink-0" />
              )
            }
          />
        </section>

        <section className="space-y-2.5">
          <SectionLabel as="h3">Período personalizado</SectionLabel>
          {/* Ativo, ganha o mesmo tratamento de seleção do campo "De/Até" do
              calendário; os chips acima apagam — um único estado de período. */}
          <button
            type="button"
            aria-pressed={isCustom}
            onClick={() => setCalendarOpen(true)}
            className={cn(
              "press-sm flex w-full items-center gap-2.5 min-h-[48px] rounded-lg border px-3 text-left transition-colors",
              isCustom ? "border-accent bg-accent/[0.08]" : "border-input bg-card hover:border-foreground/45"
            )}
          >
            <CalendarBlank size={18} className={cn("shrink-0", isCustom ? "text-accent" : "text-zinc-500")} />
            <span className="flex-1 min-w-0 truncate text-sm">
              {isCustom ? (
                <>
                  <span className="font-medium text-foreground">{customLabel}</span>
                  <span className="text-zinc-500"> · {customDays} dia{customDays > 1 ? "s" : ""}</span>
                </>
              ) : (
                <span className="text-zinc-400">Escolher datas</span>
              )}
            </span>
            <CaretRight size={14} className="text-zinc-500 shrink-0" />
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
