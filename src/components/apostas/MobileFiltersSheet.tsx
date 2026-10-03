import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretRight } from "@phosphor-icons/react";
import { BottomSheet } from "./BottomSheet";
import { SheetSelectField } from "./SheetSelectField";
import { StatusSheet } from "./StatusSheet";
import { CasaSheet } from "./CasaSheet";
import { SportSheet } from "./SportSheet";
import { SportIcon } from "./SportIcon";
import { useSports } from "@/hooks/queries/use-sports";
import { PeriodCalendarSheet } from "./PeriodCalendarSheet";
import { STATUS_OPTIONS } from "@/lib/bet-status";
import { ORIGIN_OPTIONS } from "@/lib/bet-origin";
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
  const [sportOpen, setSportOpen] = useState(false);
  const sports = useSports();
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (open) setDraft(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Mesma regra do contador no botao de filtros (use-apostas-filters): periodo
  // so conta quando sai do padrao dia 1 -> hoje. Antes o sheet dizia 2 e o
  // botao 1 com os mesmos filtros.
  const dflt = defaultPeriod();
  const periodChanged = draft.period.from !== dflt.from || draft.period.to !== dflt.to;
  const activeCount = [
    periodChanged,
    draft.status.length > 0,
    draft.houseIds.length > 0,
    draft.sportIds.length > 0,
    draft.origins.length > 0 || draft.unmatched,
  ].filter(Boolean).length;

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

  const sportSummary =
    draft.sportIds.length === 0
      ? "Todos os esportes"
      : draft.sportIds.length === 1
        ? (sports.find((s) => s.id === draft.sportIds[0])?.name ?? "1 esporte")
        : `${draft.sportIds.length} esportes`;

  const periodLabel =
    draft.period.from && draft.period.to
      ? `${format(parseISO(draft.period.from), "dd MMM", { locale: ptBR })} – ${format(parseISO(draft.period.to), "dd MMM", { locale: ptBR })}`
      : "Selecionar período";

  const handleClear = () =>
    setDraft({ period: defaultPeriod(), status: [], houseIds: [], sportIds: [], origins: [], unmatched: false });

  const toggleOrigin = (value: string) =>
    setDraft((d) => ({
      ...d,
      origins: d.origins.includes(value) ? d.origins.filter((v) => v !== value) : [...d.origins, value],
    }));

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
                    "press h-9 px-3.5 rounded-full text-sm font-medium min-h-[44px] flex items-center",
                    isActive ? "bg-accent text-white" : "border border-foreground/10 text-zinc-400"
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
          <p className={sectionLabel}>Esporte</p>
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

        <section className="space-y-2">
          <p className={sectionLabel}>Origem</p>
          <div className="flex flex-wrap gap-2">
            {[
              ...ORIGIN_OPTIONS.map((o) => ({ key: o.value, label: o.label, active: draft.origins.includes(o.value), toggle: () => toggleOrigin(o.value) })),
              {
                key: "unmatched",
                label: "Sem jogo identificado",
                active: draft.unmatched,
                toggle: () => setDraft((d) => ({ ...d, unmatched: !d.unmatched })),
              },
            ].map((chip) => (
              <button
                key={chip.key}
                type="button"
                aria-pressed={chip.active}
                onClick={chip.toggle}
                className={cn(
                  "press h-9 px-3.5 rounded-full text-sm font-medium min-h-[44px] flex items-center",
                  chip.active ? "bg-accent text-white" : "border border-foreground/10 text-zinc-400"
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-1.5">
          <p className={sectionLabel}>Período personalizado</p>
          <button
            type="button"
            onClick={() => setCalendarOpen(true)}
            className="flex w-full items-center gap-2.5 min-h-[44px] rounded-md border border-input bg-card px-[10px] py-[8px] text-left"
          >
            <CalendarBlank className="h-4 w-4 text-zinc-500 shrink-0" />
            <span className="flex-1 text-sm text-foreground truncate">{periodLabel}</span>
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
        from={draft.period.from}
        to={draft.period.to}
        onApply={(from, to) => setDraft((d) => ({ ...d, period: { preset: "custom", from, to } }))}
      />
    </BottomSheet>
  );
}
