import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { BottomSheet } from "./BottomSheet";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PeriodCalendarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  // true (default) = aberto de dentro de outro sheet (MobileFiltersSheet),
  // usa Drawer.NestedRoot. Passe false quando for o sheet raiz (ex.: aberto
  // direto de um botão no header, sem nenhum drawer por baixo).
  nested?: boolean;
}

// Sheet do período personalizado — sem chips de atalho (Mês atual/60 dias/90
// dias), esse sheet já É o "personalizado".
export function PeriodCalendarSheet({ open, onOpenChange, from, to, onApply, nested = true }: PeriodCalendarSheetProps) {
  const [range, setRange] = useState<DateRange | undefined>(undefined);
  const [activeField, setActiveField] = useState<"from" | "to">("from");

  useEffect(() => {
    if (!open) return;
    setRange(from ? { from: parseISO(from), to: to ? parseISO(to) : undefined } : undefined);
    setActiveField("from");
  }, [open, from, to]);

  const days = range?.from && range?.to ? differenceInCalendarDays(range.to, range.from) + 1 : 0;

  const fieldLabel = (date: Date | undefined) => (date ? format(date, "dd MMM yyyy", { locale: ptBR }) : "Selecionar");

  const handleFieldClick = (field: "from" | "to") => {
    setActiveField(field);
    if (field === "from" && range?.from && range?.to) setRange({ from: undefined, to: undefined });
    else if (field === "to" && range?.from) setRange({ from: range.from, to: undefined });
  };

  const handleApply = () => {
    if (!range?.from || !range?.to) return;
    onApply(format(range.from, "yyyy-MM-dd"), format(range.to, "yyyy-MM-dd"));
    onOpenChange(false);
  };

  return (
    <BottomSheet
      nested={nested}
      open={open}
      onOpenChange={onOpenChange}
      title="Período"
      footer={
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-zinc-500">
            {days > 0 ? `${days} dia${days > 1 ? "s" : ""}` : "Selecione o período"}
          </p>
          <Button className="w-full min-h-[44px]" disabled={!range?.from || !range?.to} onClick={handleApply}>
            Aplicar período
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2 py-3">
        {(["from", "to"] as const).map((field) => (
          <button
            key={field}
            type="button"
            onClick={() => handleFieldClick(field)}
            className={cn(
              "min-h-[44px] rounded-md border px-3 py-2 text-left transition-colors",
              activeField === field ? "border-accent bg-accent/[0.1]" : "border-input bg-card"
            )}
          >
            <span className="block text-[10px] uppercase tracking-wide text-zinc-500">{field === "from" ? "De" : "Até"}</span>
            <span className="block text-[13px] text-white truncate">{fieldLabel(field === "from" ? range?.from : range?.to)}</span>
          </button>
        ))}
      </div>

      <Calendar
        mode="range"
        selected={range}
        onSelect={(next) => {
          setRange(next);
          if (next?.from && !next?.to) setActiveField("to");
        }}
        initialFocus
        className="p-0"
      />
    </BottomSheet>
  );
}
