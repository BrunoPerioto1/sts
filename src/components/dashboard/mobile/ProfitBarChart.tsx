import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import { formatSignedCurrency } from "@/lib/format";

interface ProfitBarChartProps {
  data: DailySummaryPoint[];
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-md border border-border bg-card p-[8px_10px] shadow-md text-[12px]">
      <p className="opacity-70 mb-1">{format(parseISO(label), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      <span className={value >= 0 ? "text-positive font-medium" : "text-negative font-medium"}>
        {formatSignedCurrency(value)}
      </span>
    </div>
  );
}

// Gráfico enxuto do card mobile: sem eixo Y, sem tooltip, só as barras e as
// datas das pontas — a leitura fina fica na tela de apostas.
export function ProfitBarChart({ data }: ProfitBarChartProps) {
  const ticks =
    data.length > 2
      ? [data[0].date, data[Math.floor(data.length / 2)].date, data[data.length - 1].date]
      : data.map((d) => d.date);

  return (
    <div className="h-[220px] -mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap={3}>
          <XAxis
            dataKey="date"
            ticks={ticks}
            stroke="var(--color-text)"
            opacity={0.45}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => format(parseISO(value), "d MMM", { locale: ptBR })}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in srgb, var(--color-text) 6%, transparent)" }} />
          <ReferenceLine y={0} stroke="var(--color-divider)" strokeWidth={1} />
          <Bar dataKey="profitDay" radius={[2, 2, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.date} fill={entry.profitDay >= 0 ? "#4ade9e" : "#f0797e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
