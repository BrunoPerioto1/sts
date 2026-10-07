import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { ArrowRight, CaretLeft, CaretRight } from "@phosphor-icons/react";
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

// Grade do calendário esticada na largura do sheet (o Calendar base tem células
// fixas de 36px, pensadas pro popover do desktop — aqui sobrava um vão à
// direita). Só sobrescreve classNames: o Calendar compartilhado não muda.
// A pintura do intervalo (círculos sólidos no início/fim + faixa suave no
// miolo, arredondada nas pontas de cada semana) mora no index.css, em
// .period-range-cal — são camadas que classe utilitária não expressa bem.
// Aqui só vão os marcadores que aquele CSS procura.
const ACCENT_FAINT = "bg-accent/[0.08]";

const rangeCalendarClassNames = {
  months: "flex flex-col",
  month: "w-full space-y-2",
  caption: "relative flex h-10 items-center justify-center",
  caption_label: "text-[15px] font-semibold capitalize",
  nav: "flex items-center",
  nav_button:
    "h-10 w-10 flex items-center justify-center rounded-full text-zinc-300 hover:text-foreground hover:bg-foreground/[0.06] transition-colors",
  nav_button_previous: "absolute left-0",
  nav_button_next: "absolute right-0",
  table: "w-full border-collapse",
  head_row: "grid grid-cols-7",
  head_cell: "h-8 flex items-center justify-center text-[11px] font-medium uppercase tracking-wider text-zinc-500",
  // Respiro entre as semanas: cada uma vira uma pílula, não um bloco único.
  row: "grid grid-cols-7 mt-1.5",
  cell: "relative p-0 text-center text-sm",
  day: "h-9 w-full p-0 text-sm font-normal text-foreground/85 rounded-full hover:bg-foreground/[0.06] transition-colors",
  day_selected: "day-selected",
  day_range_start: "day-range-start",
  day_range_end: "day-range-end",
  day_range_middle: "day-range-middle",
  day_outside: "day-outside text-zinc-500 opacity-40 aria-selected:opacity-60",
};

const fullDate = (date: Date) => format(date, "dd MMM yyyy", { locale: ptBR });

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
        <div className="flex flex-col gap-3.5">
          <p className="text-sm text-zinc-500 truncate" aria-live="polite">
            {range?.from && range?.to ? (
              <>
                <span className="font-medium text-foreground">
                  {fullDate(range.from)} – {fullDate(range.to)}
                </span>
                {` · ${days} dia${days > 1 ? "s" : ""}`}
              </>
            ) : range?.from ? (
              "Selecione a data final"
            ) : (
              "Selecione a data inicial"
            )}
          </p>
          <Button className="w-full min-h-[44px]" disabled={!range?.from || !range?.to} onClick={handleApply}>
            Aplicar período
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pt-1 pb-4">
        {(["from", "to"] as const).map((field, i) => {
          const date = field === "from" ? range?.from : range?.to;
          const isActive = activeField === field;
          // Azul só enquanto essa ponta está sendo escolhida; com o intervalo
          // completo o campo ativo fica só um tom acima do outro.
          const isPicking = isActive && !(range?.from && range?.to);
          return (
            <button
              key={field}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleFieldClick(field)}
              className={cn(
                "min-h-[56px] rounded-lg border px-3 py-2 text-left transition-colors",
                i === 1 && "col-start-3",
                isPicking ? `border-accent ${ACCENT_FAINT}` : isActive ? "border-foreground/25 bg-card" : "border-input bg-card"
              )}
            >
              <span className={cn("block text-[11px] font-medium uppercase tracking-wider", isPicking ? "text-accent" : "text-zinc-500")}>
                {field === "from" ? "De" : "Até"}
              </span>
              <span className={cn("mt-0.5 block text-[15px] truncate", date ? "font-medium text-foreground" : "text-zinc-500")}>
                {date ? fullDate(date) : "Selecionar"}
              </span>
            </button>
          );
        })}
        <ArrowRight size={14} className="col-start-2 row-start-1 text-zinc-500" aria-hidden="true" />
      </div>

      <div className="border-t border-foreground/10 pt-3 pb-2">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(next) => {
            setRange(next);
            if (next?.from && !next?.to) setActiveField("to");
          }}
          initialFocus
          className="period-range-cal p-0"
          classNames={rangeCalendarClassNames}
          components={{
            IconLeft: () => <CaretLeft size={16} />,
            IconRight: () => <CaretRight size={16} />,
          }}
        />
      </div>
    </BottomSheet>
  );
}
