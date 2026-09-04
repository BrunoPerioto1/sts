import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank } from "@phosphor-icons/react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeFieldProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  className?: string;
  iconClassName?: string;
  disabled?: boolean;
  iconOnly?: boolean;
}

export function DateRangeField({
  startDate,
  endDate,
  onChange,
  placeholder = "Selecionar período",
  className,
  iconClassName = "h-4 w-4 opacity-70 shrink-0",
  disabled,
  iconOnly = false,
}: DateRangeFieldProps) {
  const committedRange: DateRange | undefined = startDate
    ? { from: parseISO(startDate), to: endDate ? parseISO(endDate) : undefined }
    : undefined;

  // Estado à parte pro que está sendo escolhido no popover — só vira o range
  // "de verdade" (vidadaa onChange) quando as duas pontas existirem; clicar só o
  // início não pode propagar um endDate vazio pro resto do app.
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<DateRange | undefined>(committedRange);

  useEffect(() => {
    setPending(committedRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const label = committedRange?.from
    ? committedRange.to
      ? `${format(committedRange.from, "dd MMM", { locale: ptBR })} – ${format(committedRange.to, "dd MMM", { locale: ptBR })}`
      : format(committedRange.from, "dd MMM", { locale: ptBR })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={iconOnly ? "Selecionar período" : undefined}
          title={iconOnly ? label : undefined}
          className={cn(
            "min-h-[32px] sm:min-h-[36px] justify-start gap-2 border-input bg-card font-normal text-foreground hover:border-foreground/45 hover:bg-card",
            iconOnly ? "px-0 w-9 sm:w-10 justify-center" : "w-full px-[10px]",
            !committedRange && !iconOnly && "text-muted-foreground",
            className
          )}
        >
          <CalendarBlank className={iconClassName} />
          {!iconOnly && label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={pending}
          onSelect={(next) => {
            setPending(next);
            if (next?.from && next?.to) {
              onChange(format(next.from, "yyyy-MM-dd"), format(next.to, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
