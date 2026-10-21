import { useMemo, useState } from "react";
import { eachDayOfInterval, eachMonthOfInterval, endOfMonth, format, getDay, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import { performanceColor, type DashboardPreferences } from "@/lib/dashboard-preferences";
import { formatDayMonth, formatInt, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DashboardCard } from "./DashboardCard";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const iso = (date: Date) => format(date, "yyyy-MM-dd");

// Valor curto, como no desenho: "+900", "−9", "+1,2k". Zero vira "R$ 0".
function shortMoney(value: number) {
  if (value === 0) return "R$ 0";
  const abs = Math.abs(value);
  const text = abs >= 1000 ? `${(abs / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k` : formatInt(Math.round(abs));
  return `${value > 0 ? "+" : "−"}${text}`;
}

// Mais forte quanto maior o resultado do dia perto do maior do mês. O vermelho
// fica num teto bem mais baixo: dia ruim é pra ser visto, não pra gritar.
function tint(token: string, strength: number, positive: boolean) {
  const pct = Math.round(positive ? 12 + 30 * strength : 10 + 12 * strength);
  return {
    background: `color-mix(in srgb, ${token} ${pct}%, transparent)`,
    borderColor: `color-mix(in srgb, ${token} ${Math.min(100, pct + 15)}%, transparent)`,
  };
}

/**
 * Mês em grade, cada dia pintado pelo resultado, como num diário de trader.
 * Abre no último mês do período; as setas voltam só dentro dele. Dia com
 * aposta é clicável e abre o detalhe do dia.
 */
export function ResultsCalendar({
  dailyData,
  startDate,
  endDate,
  colors,
  selected,
  onSelect,
  compact = false,
  fluid = false,
  className,
  style,
}: {
  dailyData: DailySummaryPoint[];
  startDate: string;
  endDate: string;
  colors: DashboardPreferences["performanceColors"];
  /** Dia aberto no detalhe ("2026-09-18"), marcado com o anel azul. */
  selected?: string | null;
  onSelect?: (day: string) => void;
  /** Celular: célula mais baixa e texto menor. */
  compact?: boolean;
  /** Células dividem a largura do card em qualquer tela (vitrine da landing, num card estreito). */
  fluid?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const today = iso(new Date());
  // Mês atual vai até o fim do mês, mas o calendário não abre num mês futuro.
  const lastDay = endDate > today && startDate <= today ? today : endDate;
  const months = useMemo(
    () => eachMonthOfInterval({ start: parseISO(startDate), end: parseISO(lastDay) }),
    [startDate, lastDay],
  );
  // O mês escolhido nas setas vale só pro período em que foi escolhido: trocou
  // o filtro, volta pro mês mais recente dele (em "Tudo", o mês atual) — sem
  // um quadro intermediário no mês antigo.
  const periodKey = `${startDate}|${endDate}`;
  const [picked, setPicked] = useState<{ key: string; index: number } | null>(null);
  const index = picked?.key === periodKey ? picked.index : months.length - 1;
  const setIndex = (next: (i: number) => number) => setPicked({ key: periodKey, index: next(index) });
  const month = months[Math.min(Math.max(index, 0), months.length - 1)];

  const byDay = useMemo(() => new Map(dailyData.map((d) => [d.date, d])), [dailyData]);
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = (getDay(days[0]) + 6) % 7; // semana começa na segunda
  const weeks = Math.ceil((lead + days.length) / 7);
  // Desktop: o card estica até a altura dos vizinhos da linha (acerto, esportes)
  // e as semanas dividem essa altura — com célula fixa de 44px sobrava um vão
  // morto embaixo. 44px continua sendo o mínimo.
  const stretch = !compact && !fluid;
  const inMonth = days.map((d) => byDay.get(iso(d))).filter((d): d is DailySummaryPoint => !!d);
  const max = Math.max(1, ...inMonth.map((d) => Math.abs(d.profitDay)));
  const ups = inMonth.filter((d) => d.profitDay > 0).length;
  const downs = inMonth.filter((d) => d.profitDay < 0).length;
  const flats = inMonth.filter((d) => d.profitDay === 0).length;

  // Cores desligadas em Preferências: os dias com aposta ficam todos no cinza.
  const pos = colors.enabled ? performanceColor(1, colors) : null;
  const neg = colors.enabled ? performanceColor(-1, colors) : null;

  const legend = [
    { n: ups, label: ups === 1 ? "verde" : "verdes", color: pos ?? "var(--color-text)" },
    { n: downs, label: downs === 1 ? "vermelho" : "vermelhos", color: neg ?? "var(--color-text)" },
    { n: flats, label: flats === 1 ? "zerado" : "zerados", color: "color-mix(in srgb, var(--color-text) 30%, transparent)" },
  ].filter((item) => item.n > 0);

  // Período de um mês só: o nome do mês já está no filtro, não repete aqui.
  const multi = months.length > 1;
  const navButton =
    "press flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-30 disabled:pointer-events-none";

  return (
    <DashboardCard
      className={className}
      style={style}
      title={
        <div className="flex items-center gap-2">
          <h3 className="text-sm text-zinc-400">
            Calendário
            {multi && <span className="capitalize text-zinc-200"> · {format(month, "MMMM yyyy", { locale: ptBR })}</span>}
          </h3>
          {multi && (
            <div className="flex items-center">
              <button type="button" aria-label="Mês anterior" disabled={index <= 0} onClick={() => setIndex((i) => Math.max(0, i - 1))} className={navButton}>
                <CaretLeft size={13} />
              </button>
              <button type="button" aria-label="Próximo mês" disabled={index >= months.length - 1} onClick={() => setIndex((i) => Math.min(months.length - 1, i + 1))} className={navButton}>
                <CaretRight size={13} />
              </button>
              {/* Deixa claro que é um mês dentro do período do filtro, não o período todo. */}
              {!compact && (
                <span className="ml-1 text-xs text-zinc-600 tabular-nums">
                  mês {index + 1} de {months.length} do período
                </span>
              )}
            </div>
          )}
        </div>
      }
      right={
        legend.length > 0 &&
        (compact ? (
          <span className="text-xs text-zinc-500">{legend.slice(0, 2).map((item) => `${item.n} ${item.label}`).join(" · ")}</span>
        ) : (
          <div className="flex items-center gap-3.5 text-xs text-zinc-500">
            {legend.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: item.color }} aria-hidden="true" />
                {item.n} {item.label}
              </span>
            ))}
          </div>
        ))
      }
    >
      {/* A partir do xl a célula tem largura fixa (80px, a do desenho) e o
          card encolhe até a grade; esticada na largura, virava retângulo comprido. */}
      <div
        className={cn("grid grid-cols-7", compact ? "gap-1" : "gap-[5px]", stretch && "flex-1 xl:grid-cols-[repeat(7,80px)]")}
        style={stretch ? { gridTemplateRows: `auto repeat(${weeks}, minmax(44px, 1fr))` } : undefined}
      >
        {WEEKDAYS.map((w) => (
          <div key={w} className={cn("pb-0.5 text-zinc-600", compact ? "text-center text-[10px]" : "px-0.5 text-xs")}>
            {w}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => <div key={`lead-${i}`} />)}
        {days.map((date) => {
          const day = iso(date);
          const point = byDay.get(day);
          const inPeriod = day >= startDate && day <= endDate;
          const value = point?.profitDay ?? 0;
          const token = value > 0 ? pos : value < 0 ? neg : null;
          const clickable = !!point && inPeriod && !!onSelect;
          const bets = point?.totalBets ?? 0;
          const label = point
            ? `${formatDayMonth(day)} · ${formatInt(bets)} aposta${bets === 1 ? "" : "s"} · ${formatMoney(value, { signed: true })}`
            : formatDayMonth(day);
          const Cell = clickable ? "button" : "div";
          return (
            <Cell
              key={day}
              {...(clickable ? { type: "button" as const, onClick: () => onSelect!(day) } : {})}
              aria-label={label}
              aria-pressed={clickable ? selected === day : undefined}
              className={cn(
                "group relative flex min-w-0 flex-col justify-between rounded-lg border text-left",
                compact ? "h-[38px] rounded-md px-[5px] py-1" : cn("px-2 py-[5px]", !stretch && "h-11"),
                !inPeriod
                  ? "border-transparent opacity-30"
                  : point
                    ? !token && "border-foreground/[0.11] bg-foreground/[0.08]"
                    : "border-foreground/[0.05] bg-foreground/[0.03]",
                // Resto do mês atual: ainda vai acontecer, não é dia sem aposta.
                inPeriod && day > today && "opacity-40",
                clickable && "cursor-pointer transition-[filter] hover:brightness-125",
                selected === day && "ring-2 ring-accent ring-offset-0",
              )}
              style={point && token ? tint(token, Math.abs(value) / max, value > 0) : undefined}
            >
              {/* Dia, resultado e quantas apostas: o que não cabe na célula
                  aparece no hover. No celular o toque já abre o detalhe. */}
              {point && !compact && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-foreground/10 bg-[rgb(var(--rgb-surface-2))] px-3 py-2 text-left shadow-[0_8px_24px_rgba(0,0,0,0.35)] group-hover:block"
                >
                  <span className="block text-xs text-zinc-400">{format(date, "d 'de' MMMM", { locale: ptBR })}</span>
                  <span className="block text-[13px] font-semibold tabular-nums" style={{ color: token ?? undefined }}>
                    {formatMoney(value, { signed: true })}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {formatInt(bets)} aposta{bets === 1 ? "" : "s"}
                  </span>
                </span>
              )}
              <span
                className={cn(
                  "tabular-nums leading-none",
                  compact ? "text-[10px]" : "text-[11px]",
                  day === today ? "font-semibold text-accent" : point ? "text-zinc-200" : "text-zinc-600",
                )}
              >
                {date.getDate()}
              </span>
              {point && (
                <span
                  className={cn(
                    "truncate font-semibold leading-none tabular-nums",
                    compact ? "text-[10px]" : "text-xs",
                    token ? "text-foreground" : "text-zinc-400",
                  )}
                >
                  {shortMoney(value)}
                </span>
              )}
            </Cell>
          );
        })}
      </div>
    </DashboardCard>
  );
}
