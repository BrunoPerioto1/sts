import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDayMonth, formatMoney } from "@/lib/format";
import { AXIS_TICK, GRID_PROPS, compactAxis } from "@/lib/chart-style";
import { ChartTooltipBox } from "./ChartTooltipBox";

export interface BankrollPoint {
  date: string;
  balance: number;
}

const LINE = "var(--color-accent-2)";

/** Banca somada das casas dia a dia: curva suave no azul, preenchimento que some até a base. */
export function BankrollChart({ data, height = 260 }: { data: BankrollPoint[]; height?: number }) {
  const fillId = useId();
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={LINE} stopOpacity={0.14} />
              <stop offset="100%" stopColor={LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_PROPS} />
          <YAxis
            width={44}
            tickCount={4}
            axisLine={false}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
            tick={AXIS_TICK}
            tickFormatter={compactAxis}
          />
          <XAxis
            dataKey="date"
            minTickGap={40}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickMargin={8}
            tickFormatter={(value) => format(parseISO(value), "d MMM", { locale: ptBR })}
          />
          <Tooltip
            isAnimationActive={false}
            cursor={{ stroke: "var(--color-text)", strokeOpacity: 0.22 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltipBox
                  title={formatDayMonth((payload[0].payload as BankrollPoint).date)}
                  rows={[{ label: "Banca", value: formatMoney((payload[0].payload as BankrollPoint).balance) }]}
                />
              ) : null
            }
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke={LINE}
            strokeWidth={2.25}
            strokeLinecap="round"
            fill={`url(#${fillId})`}
            baseValue="dataMin"
            activeDot={{ r: 4.5, fill: LINE, stroke: "rgb(var(--rgb-panel))", strokeWidth: 2 }}
            animationDuration={650}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
