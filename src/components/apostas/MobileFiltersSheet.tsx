import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { BottomSheet } from "./BottomSheet";
import { SheetSelectField } from "./SheetSelectField";
import { StatusSheet } from "./StatusSheet";
import { CasaSheet } from "./CasaSheet";
import { PeriodCalendarSheet } from "./PeriodCalendarSheet";
import { STATUS_OPTIONS } from "./StatusMultiSelect";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { defaultPeriod, periodRangeFor, type ApostasFilterState, type PeriodPreset } from "@/types/apostas-filters";

const PERIOD_CHIPS: { value: Exclude<PeriodPreset, "custom">; label: string }[] = [
  { value: "mes", label: "Mês atual" },
  { value: "60d", label: "60 dias" },
  { value: "ano", label: "Ano" },
  { value: "tudo", label: "Tudo" },
];

const sectionLabel = "text-xs font-medium uppercase tracking-wider text-zinc-500";

interface MobileFiltersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ApostasFilterState;
  onApply: (next: ApostasFilterState) => void;
  houses: { id: number; name: string }[];
}

// Rascunho local: nada é aplicado no app real até tocar em "Aplicar" aqui.
// Status/Casa/Período personalizado editam esse mesmo rascunho por baixo —
// seus próprios botões "Aplicar" só fecham o sheet filho e voltam pra cá.
export function MobileFiltersSheet({ open, onOpenChange, value, onApply, houses }: MobileFiltersSheetProps) {
  const [draft, setDraft] = useState<ApostasFilterState>(value);
  const [statusOpen, setStatusOpen] = useState(false);
  const [casaOpen, setCasaOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const activeCount = [draft.period.preset !== "mes", draft.status.length > 0, draft.houseIds.length > 0].filter(Boolean).length;

  const statusSummary =
    draft.status.length === 0
      ? "Todas"
      : draft.status.length === 1
        ? (STATUS_OPTIONS.find((o) => o.value === draft.status[0])?.label ?? "1 status")
        : `${draft.status.length} status`;

  const casaSummary =
    draft.houseIds.length === 0
      ? "Todas as casas"
      : draft.houseIds.length === 1
        ? (houses.find((h) => h.id === draft.houseIds[0])?.name ?? "1 casa")
        : `${draft.houseIds.length} casas`;

  const periodLabel =
    draft.period.from && draft.period.to
      ? `${format(parseISO(draft.period.from), "dd MMM", { locale: ptBR })} – ${format(parseISO(draft.period.to), "dd MMM", { locale: ptBR })}`
      : "Selecionar período";

  const handleClear = () => setDraft({ period: defaultPeriod(), status: [], houseIds: [] });

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
            {PERIOD_CHIPS.map((chip) => {
              const isActive = draft.period.preset === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, period: { preset: chip.value, ...periodRangeFor(chip.value) } }))}
                  className={cn(
                    "h-9 px-3.5 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center",
                    isActive ? "bg-accent text-white" : "border border-white/10 text-zinc-400"
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Status</p>
          <SheetSelectField summary={statusSummary} onOpen={() => setStatusOpen(true)} />
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Casa</p>
          <SheetSelectField summary={casaSummary} onOpen={() => setCasaOpen(true)} />
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Período personalizado</p>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex w-full items-center gap-2.5 min-h-[44px] rounded-md border border-input bg-card px-[10px] py-[8px] text-left"
          >
            <CalendarBlank className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="flex-1 text-sm text-white truncate">{periodLabel}</span>
            <CaretRight className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          </button>
        </section>
      </div>

      <StatusSheet
        open={statusOpen}
        onOpenChange={setStatusOpen}
        selected={draft.status}
        onChange={(status) => setDraft((d) => ({ ...d, status }))}
      />
      <CasaSheet
        open={casaOpen}
        onOpenChange={setCasaOpen}
        houses={houses}
        houseIds={draft.houseIds}
        onChange={(houseIds) => setDraft((d) => ({ ...d, houseIds }))}
      />
      <PeriodCalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        from={draft.period.from}
        to={draft.period.to}
        onApply={(from, to) => setDraft((d) => ({ ...d, period: { preset: "custom", from, to } }))}
      />
    </BottomSheet>
  );
}
