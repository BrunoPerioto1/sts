import { useState } from "react";
import { endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { OptionRow } from "@/components/apostas/OptionRow";
import { PeriodCalendarSheet } from "@/components/apostas/PeriodCalendarSheet";
import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";

type SheetPreset = Extract<DatePreset, "7d" | "14d" | "currentMonth" | "lastMonth" | "60d" | "allTime">;

const shortDate = (date: Date) => format(date, "d MMM", { locale: ptBR });

// Mesma conta do applyPreset em useDashboardFilters — aqui só pra mostrar o
// intervalo embaixo de cada opção antes do usuário escolher.
function rangeLabel(preset: SheetPreset, firstBetDate: string | null): string {
  const today = new Date();
  switch (preset) {
    case "7d":
      return `${shortDate(subDays(today, 6))} – ${shortDate(today)}`;
    case "14d":
      return `${shortDate(subDays(today, 13))} – ${shortDate(today)}`;
    case "currentMonth":
      return `${shortDate(startOfMonth(today))} – ${shortDate(today)}`;
    case "lastMonth": {
      const lastMonth = subMonths(today, 1);
      return `${shortDate(startOfMonth(lastMonth))} – ${shortDate(endOfMonth(lastMonth))}`;
    }
    case "60d":
      return `${shortDate(subDays(today, 60))} – ${shortDate(today)}`;
    case "allTime":
      return firstBetDate ? `desde ${shortDate(parseISO(firstBetDate))}` : "todo o histórico";
  }
}

const OPTIONS: { value: SheetPreset; label: string }[] = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "14d", label: "Últimos 14 dias" },
  { value: "currentMonth", label: "Mês atual" },
  { value: "lastMonth", label: "Mês passado" },
  { value: "60d", label: "Últimos 60 dias" },
  { value: "allTime", label: "Tudo" },
];

interface PeriodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset: DatePreset;
  firstBetDate: string | null;
  from: string;
  to: string;
  onSelect: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
}

export function PeriodSheet({ open, onOpenChange, preset, firstBetDate, from, to, onSelect, onCustomRange }: PeriodSheetProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Período"
      footer={
        <Button variant="outline" className="w-full min-h-[44px]" onClick={() => setCalendarOpen(true)}>
          Escolher datas…
        </Button>
      }
    >
      <div className="flex flex-col gap-1 py-2">
        {OPTIONS.map((opt) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            subtitle={rangeLabel(opt.value, firstBetDate)}
            selected={preset === opt.value}
            onToggle={() => {
              onSelect(opt.value);
              onOpenChange(false);
            }}
          />
        ))}
      </div>

      {/* Nested dentro deste sheet (padrão do MobileFiltersSheet): o vaul
          precisa do Root pai montado pra empilhar o calendário por cima. */}
      <PeriodCalendarSheet
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        from={from}
        to={to}
        onApply={(nextFrom, nextTo) => {
          onCustomRange(nextFrom, nextTo);
          onOpenChange(false);
        }}
      />
    </BottomSheet>
  );
}
