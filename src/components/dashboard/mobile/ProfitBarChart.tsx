import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, XAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";

interface ProfitBarChartProps {
  data: DailySummaryPoint[];
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
