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
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-3",
        caption: "flex justify-center items-center relative pb-3 mb-1 border-b border-border",
        caption_label: "text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        nav_button:
          "h-6 w-6 flex items-center justify-center rounded-md opacity-55 hover:opacity-100 hover:bg-foreground/[0.08] transition-colors",
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "text-muted-foreground w-9 font-normal text-xs uppercase tracking-wide opacity-45 pb-1",
        row: "flex w-full",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 text-sm font-normal text-foreground/85 rounded-md hover:bg-foreground/[0.08] transition-colors aria-selected:opacity-100",
        day_range_start: "day-range-start !rounded-r-none",
        day_range_end: "day-range-end !rounded-l-none",
        day_selected:
          "bg-accent/[0.22] text-accent font-medium hover:bg-accent/[0.28] hover:text-accent focus:bg-accent/[0.28] focus:text-accent",
        // "Hoje" NAO usa accent: o azul e a linguagem da selecao/intervalo, e
        // marcar o dia atual com a mesma cor confundia o que da pra escolher.
        // Fica so um ponto discreto sob o numero.
        day_today:
          "relative font-semibold after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-[3px] after:w-[3px] after:rounded-full after:bg-foreground after:opacity-40 aria-selected:after:hidden",
        day_outside: "day-outside text-muted-foreground opacity-30 aria-selected:opacity-40",
        day_disabled: "text-muted-foreground opacity-30",
        day_range_middle:
          "!rounded-none !bg-accent/[0.12] !text-foreground/85 font-normal hover:!bg-accent/[0.18]",
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
