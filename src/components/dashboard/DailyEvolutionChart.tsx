import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { TooltipProps } from "recharts";
import { format, parseISO, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Segmented } from "@/components/ui/segmented";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartBar } from "@phosphor-icons/react";

interface DailyData {
  date: string;
  profitDay: number;
}

interface DailyEvolutionChartProps {
  data: DailyData[];
  className?: string;
}

type Grouping = "day" | "week" | "month";

function groupData(data: DailyData[], grouping: Grouping) {
  if (grouping === "day") return data;

  const buckets = new Map<string, number>();
  for (const point of data) {
    const d = parseISO(point.date);
    const key =
      grouping === "week"
        ? format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")
        : format(startOfMonth(d), "yyyy-MM-dd");
    buckets.set(key, (buckets.get(key) ?? 0) + point.profitDay);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, profitDay]) => ({ date, profitDay }));
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length && label) {
    const value = Number(payload[0].value);
    const isPositive = value >= 0;
    return (
      <div className="rounded-md border border-border bg-card p-[8px_10px] shadow-md text-xs">
        <p className="opacity-70 mb-1">
          {parseISO(label).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
        <span className={isPositive ? "text-positive font-medium" : "text-negative font-medium"}>
          {isPositive ? "+" : ""}R$ {value.toFixed(2)}
        </span>
      </div>
    );
  }
  return null;
};

const formatAxisValue = (value: number) => {
  if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
  return `R$ ${value.toFixed(0)}`;
};

export const DailyEvolutionChart = ({ data, className = "" }: DailyEvolutionChartProps) => {
  // Agrupamento nulo = ainda no automatico. Semana era o padrao fixo, entao um
  // periodo de poucos dias virava uma ou duas barras soltas num grafico de
  // 400px. Assim que o usuario escolhe, a escolha dele manda.
  const [chosenGrouping, setChosenGrouping] = useState<Grouping | null>(null);
  const isMobile = useIsMobile();
  const grouping = chosenGrouping ?? (data.length <= 14 ? "day" : "week");
  const grouped = useMemo(() => groupData(data, grouping), [data, grouping]);
  const isEmpty = data.length === 0;

  const totalProfit = data.reduce((sum, item) => sum + item.profitDay, 0);
  const positiveCount = grouped.filter((d) => d.profitDay > 0).length;

  return (
    <div className={`card elev-sm bg-card rounded-md p-[14px_16px] ${className}`}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-medium">Resultado diário</h3>
          <p className="text-xs opacity-55">Lucro líquido por período selecionado</p>
        </div>
        {!isEmpty && <Segmented
          options={[
            { value: "day", label: "Dia" },
            { value: "week", label: "Semana" },
            { value: "month", label: "Mês" },
          ]}
          value={grouping}
          onChange={(v) => setChosenGrouping(v as Grouping)}
        />}
      </div>

      {isEmpty ? (
        <EmptyState
          bare
          icon={<ChartBar size={28} />}
          title="Sem resultados no período"
          description="Nenhuma aposta liquidada nas datas selecionadas. Amplie o período para ver a evolução."
          className="py-14"
        />
      ) : (
      <div style={{ height: isMobile ? 180 : 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={grouped} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap={isMobile ? 4 : 8}>
            <XAxis
              dataKey="date"
              stroke="var(--color-text)"
              opacity={0.45}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) =>
                format(parseISO(value), grouping === "month" ? "MMM" : "dd/MM", { locale: ptBR })
              }
            />
            <YAxis
              stroke="var(--color-text)"
              opacity={0.45}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatAxisValue}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "color-mix(in srgb, var(--color-text) 6%, transparent)" }} />
            <ReferenceLine y={0} stroke="var(--color-divider)" strokeWidth={1} />
            <Bar dataKey="profitDay" radius={[3, 3, 0, 0]}>
              {grouped.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.profitDay >= 0 ? "#4ade9e" : "#f0797e"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      )}

      {!isEmpty && <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-[6px]">
            <span className="w-2 h-2 rounded-sm bg-positive inline-block" /> Período positivo
          </span>
          <span className="flex items-center gap-[6px]">
            <span className="w-2 h-2 rounded-sm bg-negative inline-block" /> Período negativo
          </span>
        </div>
        <span className={totalProfit >= 0 ? "text-positive font-medium" : "text-negative font-medium"}>
          {totalProfit >= 0 ? "+" : ""}R$ {totalProfit.toFixed(2)} · {positiveCount}/{grouped.length} positivos
        </span>
      </div>}
    </div>
  );
};
