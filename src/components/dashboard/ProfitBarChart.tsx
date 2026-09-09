import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatSignedCurrency } from "@/lib/format";

interface ProfitBarChartProps {
  data: { date: string; profitDay: number }[];
  height?: number;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length || !label) return null;
  const value = payload[0].value;
  return (
    <div className="rounded-md border border-border bg-card p-[8px_10px] shadow-md text-xs">
      <p className="opacity-70 mb-1">{format(parseISO(label), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      <span className={value >= 0 ? "text-positive font-medium" : "text-negative font-medium"}>
        {formatSignedCurrency(value)}
      </span>
    </div>
  );
}

// Escala automática mantém os valores reais do período, inclusive dias negativos.
export function ProfitBarChart({ data, height = 180 }: ProfitBarChartProps) {
  // Tela larga cabe mais rótulos: deixa o recharts escolher. Na estreita, três
  // marcas fixas (início/meio/fim) evitam rótulo espremido.
  const ticks =
    height > 220
      ? undefined
      : data.length > 2
        ? [data[0].date, data[Math.floor(data.length / 2)].date, data[data.length - 1].date]
        : data.map((d) => d.date);

  return (
    <div className="-mx-1" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }} barCategoryGap="20%" accessibilityLayer>
          <CartesianGrid vertical={false} stroke="var(--color-divider)" strokeOpacity={0.5} strokeDasharray="3 4" />
          <YAxis width={height > 220 ? 48 : 36} tickCount={height > 220 ? 3 : 4} axisLine={false} tickLine={false} tick={{ fill: "var(--color-text)", opacity: 0.6, fontSize: height > 220 ? 11 : 10 }} tickFormatter={(value: number) => value.toLocaleString("pt-BR", { notation: "compact", maximumFractionDigits: 1 })} />
          <XAxis
            dataKey="date"
            ticks={ticks}
            stroke="var(--color-text)"
            opacity={0.6}
            fontSize={height > 220 ? 11 : 10}
            minTickGap={24}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => format(parseISO(value), "d MMM", { locale: ptBR })}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "color-mix(in srgb, var(--color-text) 6%, transparent)" }} />
          <ReferenceLine y={0} stroke="color-mix(in srgb, var(--color-text) 22%, transparent)" strokeWidth={1} />
          {/* As barras crescem a partir da linha do zero. 650ms e o ponto em
              que da pra ver a curva se formar sem atrasar a leitura; o padrao
              do recharts (1500ms) parece lento numa tela pequena. */}
          <Bar dataKey="profitDay" maxBarSize={40} radius={[2, 2, 0, 0]} animationDuration={650} animationEasing="ease-out">
            {data.map((entry) => (
              <Cell key={entry.date} fill={entry.profitDay >= 0 ? "#4ade9e" : "#f0797e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
