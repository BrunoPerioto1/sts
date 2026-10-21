import { useEffect, useId, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDayMonth, formatMoney } from "@/lib/format";
import { AXIS_TICK, GRID_PROPS, compactAxis } from "@/lib/chart-style";
import { ChartTooltipBox } from "./ChartTooltipBox";

// Variavel do tema: no claro o verde/vermelho escurecem pra ler no branco.
const POS = "var(--color-success)";
const NEG = "var(--color-danger)";

type Ponto = { date: string; dia: number; acum: number };

function Leitura({ ponto }: { ponto: Ponto }) {
  return (
    <ChartTooltipBox
      label={`${formatDayMonth(ponto.date)} · dia ${formatMoney(ponto.dia, { signed: true })}`}
      value={`${formatMoney(ponto.acum, { signed: true })} no período`}
    />
  );
}

/**
 * Lucro acumulado dia a dia, em curva suave com preenchimento até o zero. No
 * desktop a leitura é um tooltip que segue o ponteiro; no celular (`compact`)
 * fica numa linha embaixo do gráfico, que o toque atualiza.
 */
export function CumulativeProfitChart({
  data,
  height = 200,
  compact = false,
}: {
  data: { date: string; profitDay: number }[];
  height?: number;
  compact?: boolean;
}) {
  const fillId = useId();
  const pontos = useMemo(() => {
    let acc = 0;
    return data.map((d) => ({ date: d.date, dia: d.profitDay, acum: (acc += d.profitDay) }));
  }, [data]);
  const [sel, setSel] = useState(pontos.length - 1);
  useEffect(() => setSel(pontos.length - 1), [pontos]);

  if (!pontos.length) return null;
  const atual = pontos[Math.min(sel, pontos.length - 1)];
  const linha = pontos[pontos.length - 1].acum >= 0 ? POS : NEG;
  const n = pontos.length;
  // Cinco marcas no desktop, três no celular, sempre com a primeira e a última.
  const marks = compact ? 3 : 5;
  const ticks = n > marks ? Array.from({ length: marks }, (_, i) => pontos[Math.round((i * (n - 1)) / (marks - 1))].date) : pontos.map((p) => p.date);
  const mover = (e: { activeTooltipIndex?: number } | null) =>
    e?.activeTooltipIndex != null && setSel(e.activeTooltipIndex);

  return (
    <div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={pontos}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            onMouseMove={mover}
            onClick={mover}
            onMouseLeave={() => setSel(n - 1)}
          >
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={linha} stopOpacity={0.28} />
                <stop offset="100%" stopColor={linha} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid {...GRID_PROPS} />
            <YAxis width={40} tickCount={5} axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={compactAxis} />
            <XAxis
              dataKey="date"
              ticks={ticks}
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              tickMargin={8}
              tickFormatter={(v) => format(parseISO(v), "d MMM", { locale: ptBR })}
            />
            <ReferenceLine y={0} stroke="var(--color-text)" strokeOpacity={0.18} />
            {!compact && (
              <Tooltip
                cursor={false}
                isAnimationActive={false}
                content={({ active, payload }) =>
                  active && payload?.length ? <Leitura ponto={payload[0].payload as Ponto} /> : null
                }
              />
            )}
            <ReferenceLine x={atual.date} stroke="var(--color-text)" strokeOpacity={0.22} />
            <Area
              type="monotone"
              dataKey="acum"
              stroke={linha}
              strokeWidth={2.5}
              strokeLinecap="round"
              fill={`url(#${fillId})`}
              baseValue={0}
              activeDot={false}
              animationDuration={650}
            />
            {/* Halo + ponto: o dia lido fica marcado mesmo sem o tooltip. */}
            <ReferenceDot x={atual.date} y={atual.acum} r={9} fill={linha} fillOpacity={0.22} stroke="none" />
            <ReferenceDot x={atual.date} y={atual.acum} r={4.5} fill={linha} stroke="rgb(var(--rgb-panel))" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {compact && (
        <div className="mt-2 flex items-center justify-between gap-3 border-t border-dashed border-foreground/10 pt-2.5 text-[13px]">
          <span className="truncate text-zinc-400">
            {formatDayMonth(atual.date)} · dia {formatMoney(atual.dia, { signed: true })}
          </span>
          <span className="shrink-0 font-medium tabular-nums text-foreground">{formatMoney(atual.acum, { signed: true })}</span>
        </div>
      )}
    </div>
  );
}
