import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CaretDown, Check } from "@phosphor-icons/react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { PERIOD_OPTIONS, PRESET_LABEL, presetRangeLabel } from "@/lib/dashboard-periods";

interface PeriodPopoverProps {
  preset: DatePreset;
  firstBetDate: string | null;
  from: string;
  to: string;
  onSelect: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
  /** Texto do gatilho; padrão é o nome do preset. */
  label?: string;
  className?: string;
  align?: "start" | "center" | "end";
  disabled?: boolean;
}

/**
 * Seletor de período do desktop: presets à esquerda, calendário à direita, tudo
 * no mesmo popover — sem a folha que sobe da base, que é gesto de mobile.
 */
export function PeriodPopover({
  preset,
  firstBetDate,
  from,
  to,
  onSelect,
  onCustomRange,
  label,
  className,
  align = "end",
  disabled,
}: PeriodPopoverProps) {
  const [open, setOpen] = useState(false);
  const committed = (): DateRange | undefined =>
    from ? { from: parseISO(from), to: to ? parseISO(to) : undefined } : undefined;
  const [pending, setPending] = useState<DateRange | undefined>(committed);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        // O período pode ter mudado por fora (chip removido, "Limpar tudo").
        if (next) setPending(committed());
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "press flex items-center gap-1.5 h-9 px-3 rounded-lg border border-foreground/10 text-[13px] text-zinc-200 hover:border-foreground/20 disabled:opacity-45 disabled:pointer-events-none",
            className
          )}
        >
          {label ?? PRESET_LABEL[preset]} <CaretDown size={12} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 flex" align={align}>
        <div className="flex flex-col gap-0.5 p-2 min-w-[190px] border-r border-border">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-foreground/[0.05]",
                preset === opt.value && "bg-foreground/[0.06]"
              )}
            >
              <span className="min-w-0">
                <span className="block text-[13px] text-zinc-100">{opt.label}</span>
                <span className="block text-[11px] text-zinc-400">
                  {presetRangeLabel(opt.value, firstBetDate)}
                </span>
              </span>
              {preset === opt.value && <Check size={14} className="shrink-0 text-accent" />}
            </button>
          ))}
        </div>

        <Calendar
          mode="range"
          selected={pending}
          defaultMonth={from ? parseISO(from) : undefined}
          onSelect={(next) => {
            setPending(next);
            if (next?.from && next?.to) {
              onCustomRange(format(next.from, "yyyy-MM-dd"), format(next.to, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
