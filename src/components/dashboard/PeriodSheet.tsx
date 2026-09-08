import { useState } from "react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { OptionRow } from "@/components/apostas/OptionRow";
import { PeriodCalendarSheet } from "@/components/apostas/PeriodCalendarSheet";
import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { PERIOD_OPTIONS, presetRangeLabel } from "@/lib/dashboard-periods";

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
        {PERIOD_OPTIONS.map((opt) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            subtitle={presetRangeLabel(opt.value, firstBetDate)}
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
