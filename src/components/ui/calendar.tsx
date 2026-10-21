import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "date-fns/locale";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = ptBR,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-6 sm:space-y-0",
        month: "space-y-2",
        // Mês à esquerda e as duas setas juntas à direita, sem linha embaixo:
        // a grade começa logo abaixo do título.
        caption: "flex items-center justify-between pl-1.5 pb-2",
        caption_label: "text-sm font-semibold capitalize",
        nav: "flex items-center gap-0.5",
        nav_button:
          "h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-foreground/[0.08] transition-colors",
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "w-10 pb-1 text-[11px] font-medium uppercase tracking-wide text-zinc-500",
        // Respiro entre as semanas: no intervalo cada uma vira uma faixa
        // própria, em vez de um bloco colado.
        row: "flex w-full mt-1.5",
        // A faixa do intervalo mora na célula (contínua de um dia pro outro) e
        // arredonda nas pontas de cada semana e nas do intervalo. O dia de
        // início/fim fica por cima, sólido. Dia único não ganha faixa.
        cell: cn(
          "relative h-9 w-10 p-0 text-center text-sm first:rounded-l-lg last:rounded-r-lg",
          "[&:has(.day-range-middle)]:bg-accent/[0.14]",
          "[&:has(.day-range-start:not(.day-range-end))]:bg-accent/[0.14] [&:has(.day-range-start)]:rounded-l-lg",
          "[&:has(.day-range-end:not(.day-range-start))]:bg-accent/[0.14] [&:has(.day-range-end)]:rounded-r-lg",
        ),
        day: "h-9 w-10 p-0 text-sm font-normal text-foreground/85 rounded-lg hover:bg-foreground/[0.08] transition-colors aria-selected:opacity-100",
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-accent text-white font-semibold hover:bg-accent hover:text-white focus:bg-accent focus:text-white",
        // "Hoje" NAO usa accent: o azul e a linguagem da selecao/intervalo, e
        // marcar o dia atual com a mesma cor confundia o que da pra escolher.
        // Fica so um ponto discreto sob o numero.
        day_today:
          "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-[3px] after:rounded-full after:bg-foreground after:opacity-40 aria-selected:after:hidden",
        day_outside: "day-outside text-muted-foreground opacity-30 aria-selected:opacity-40",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle:
          "day-range-middle !bg-transparent !text-foreground/90 !font-normal hover:!bg-accent/[0.14]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <CaretLeft size={13} />,
        IconRight: () => <CaretRight size={13} />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
