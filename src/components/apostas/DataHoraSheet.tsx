import { useEffect, useRef, useState } from "react";
import { CalendarBlank } from "@phosphor-icons/react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BottomSheet } from "./BottomSheet";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const pad = (n: number) => String(n).padStart(2, "0");
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
// Altura de cada item da roleta. VISIBLE ímpar pro item selecionado cair
// exatamente no meio, com dois vizinhos esmaecidos de cada lado.
const ITEM_H = 44;
const VISIBLE = 5;

// Formata o "YYYY-MM-DDTHH:mm" (mesmo formato do datetime-local que o
// useApostaForm guarda) pro rótulo curto do campo.
export function formatDataHora(value: string) {
  if (!value) return "Selecionar";
  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? "Selecionar" : format(date, "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
}

// Uma coluna da roleta. A seleção vem do próprio scroll (scroll-snap +
// arredondamento do scrollTop), não de clique — é o que dá a sensação de
// picker nativo. Clicar num vizinho também funciona: só rola até ele.
function WheelColumn({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Centraliza o valor atual na abertura. scrollTop direto (e não
  // scrollIntoView) porque este scroll vive dentro do sheet — scrollIntoView
  // arrastaria o corpo do sheet junto.
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = selected * ITEM_H;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      onScroll={(e) => {
        const next = values[Math.round(e.currentTarget.scrollTop / ITEM_H)];
        if (next !== undefined && next !== selected) onSelect(next);
      }}
      style={{ height: ITEM_H * VISIBLE, paddingBlock: ITEM_H * ((VISIBLE - 1) / 2) }}
      className="min-w-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
        {values.map((v) => {
          const distance = Math.abs(v - selected);
          return (
            <button
              key={v}
              type="button"
              onClick={() => ref.current?.scrollTo({ top: v * ITEM_H, behavior: "smooth" })}
              style={{ height: ITEM_H }}
              className={cn(
                "flex w-full snap-center items-center justify-center tabular-nums transition-all",
                distance === 0
                  ? "text-2xl font-semibold text-white"
                  : distance === 1
                    ? "text-xl text-white/45"
                    : "text-xl text-white/20"
              )}
            >
              {pad(v)}
            </button>
          );
        })}
    </div>
  );
}

interface DataHoraSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // "YYYY-MM-DDTHH:mm" (local), igual ao value do datetime-local.
  value: string;
  onApply: (value: string) => void;
  nested?: boolean;
}

// Sheet de data + hora da aposta — substitui o <input type="datetime-local">,
// que abria o picker nativo do sistema e destoava do resto do app.
export function DataHoraSheet({ open, onOpenChange, value, onApply, nested = true }: DataHoraSheetProps) {
  const [date, setDate] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!open) return;
    const parsed = value ? parseISO(value) : new Date();
    setDate(Number.isNaN(parsed.getTime()) ? new Date() : parsed);
  }, [open, value]);

  const setTime = (hours: number, minutes: number) => {
    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    setDate(next);
  };

  const handleApply = () => {
    onApply(format(date, "yyyy-MM-dd'T'HH:mm"));
    onOpenChange(false);
  };

  return (
    <BottomSheet
      nested={nested}
      open={open}
      onOpenChange={onOpenChange}
      title="Data e hora"
      footer={
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-base font-semibold text-white">
            <CalendarBlank size={18} weight="bold" className="shrink-0 text-zinc-400" />
            {format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <Button className="w-full min-h-[44px] bg-accent text-white hover:bg-accent/90" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      }
    >
      <Calendar
        mode="single"
        selected={date}
        defaultMonth={date}
        onSelect={(next) => {
          if (!next) return;
          next.setHours(date.getHours(), date.getMinutes(), 0, 0);
          setDate(next);
        }}
        initialFocus
        className="p-0"
        classNames={{
          // Calendário ocupa a largura do sheet: célula maior, texto maior.
          // O padrão do Calendar é dimensionado pro popover do desktop e fica
          // apertado no meio da tela do celular.
          months: "w-full",
          month: "w-full space-y-3",
          caption: "flex justify-center items-center relative pb-3 mb-1",
          caption_label: "text-base font-semibold capitalize",
          nav_button:
            "h-9 w-9 flex items-center justify-center rounded-full opacity-55 hover:opacity-100 hover:bg-foreground/[0.08] transition-colors",
          table: "w-full border-collapse",
          head_row: "flex justify-between",
          head_cell: "w-11 text-muted-foreground font-normal text-[11px] uppercase tracking-wide opacity-45 pb-1",
          row: "flex w-full justify-between mt-1",
          cell: "h-11 w-11 text-center p-0 relative",
          day: "h-11 w-11 p-0 text-base font-normal text-foreground/85 rounded-full hover:bg-foreground/[0.08] transition-colors",
          // Dia escolhido como bolinha cheia — no picker o azul chapado é a
          // âncora visual da roleta logo abaixo.
          day_selected: "bg-accent font-semibold text-white hover:bg-accent focus:bg-accent",
        }}
      />

      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="flex gap-2 pb-2 text-center text-xs uppercase tracking-wider text-zinc-500">
          <span className="flex-1">Hora</span>
          <span className="flex-1">Minuto</span>
        </div>
        <div className="relative flex gap-2">
          {/* Faixa da seleção, atrás das colunas. */}
          <div
            aria-hidden
            style={{ height: ITEM_H }}
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-xl bg-white/[0.06]"
          />
          <WheelColumn values={HOURS} selected={date.getHours()} onSelect={(h) => setTime(h, date.getMinutes())} />
          <div aria-hidden className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/10" />
          <WheelColumn values={MINUTES} selected={date.getMinutes()} onSelect={(m) => setTime(date.getHours(), m)} />
        </div>
      </div>
    </BottomSheet>
  );
}
