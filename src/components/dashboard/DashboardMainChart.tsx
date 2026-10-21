import { useMemo, useState } from "react";
import { format, parseISO, startOfWeek } from "date-fns";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/use-dashboard-filters";
import { Segmented } from "@/components/ui/segmented";
import { formatMoney } from "@/lib/format";
import { DashboardCard } from "./DashboardCard";
import { CumulativeProfitChart } from "./CumulativeProfitChart";
import { BankrollChart, type BankrollPoint } from "./BankrollChart";
import { ProfitBarChart } from "./ProfitBarChart";

type Tab = "acumulado" | "banca" | "dia";

// Até um mês cabe uma barra por dia; acima disso a leitura só funciona por semana.
function groupByWeek(data: DailySummaryPoint[]) {
  if (data.length <= 31) return data.map(({ date, profitDay }) => ({ date, profitDay }));
  const buckets = new Map<string, number>();
  for (const point of data) {
    const key = format(startOfWeek(parseISO(point.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
    buckets.set(key, (buckets.get(key) ?? 0) + point.profitDay);
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, profitDay]) => ({ date, profitDay }));
}

function Empty({ children, height }: { children: React.ReactNode; height: number }) {
  return (
    <div className="flex flex-col items-start justify-center gap-2" style={{ height }}>
      {children}
    </div>
  );
}

/**
 * O gráfico largo do dashboard. Abas em vez de três cards: lucro acumulado
 * (abre nele), a banca somada das casas e o resultado de cada dia. No desktop a
 * leitura é tooltip; no celular, uma faixa junto do gráfico (toque).
 */
export function DashboardMainChart({
  dailyData,
  bankroll,
  filtered,
  preset,
  onPresetChange,
  height = 300,
  compact = false,
  className,
  style,
}: {
  dailyData: DailySummaryPoint[];
  bankroll: BankrollPoint[];
  /** Recorte por casa/esporte ligado: a banca segue sendo o total. */
  filtered: boolean;
  preset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  height?: number;
  compact?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [tab, setTab] = useState<Tab>("acumulado");
  const weekly = dailyData.length > 31;
  const bars = useMemo(() => groupByWeek(dailyData), [dailyData]);
  const options = [
    { value: "acumulado", label: compact ? "Acumulado" : "Lucro acumulado" },
    { value: "banca", label: "Banca" },
    { value: "dia", label: weekly ? "Por semana" : "Por dia" },
  ] as const;

  const first = bankroll[0];
  const last = bankroll[bankroll.length - 1];
  // Encaixe à direita das abas, um por aba (no celular as abas ocupam a linha).
  const right = compact
    ? undefined
    : tab === "banca" && first
      ? (
          <span className="text-[13px] text-zinc-400 tabular-nums">
            {filtered && "Todas as casas · "}
            {formatMoney(first.balance, { cents: false })} <span className="text-zinc-600">→</span>{" "}
            <span className="text-zinc-200">{formatMoney(last.balance, { cents: false })}</span>
          </span>
        )
      : dailyData.length > 0 && <span className="text-[13px] text-zinc-500">passe o mouse no gráfico</span>;

  const noBets = (
    <Empty height={height}>
      <p className="text-[13px] text-zinc-400">Nenhuma aposta liquidada no período. Experimente ampliar as datas.</p>
      {preset !== "60d" && preset !== "allTime" && (
        <button type="button" onClick={() => onPresetChange("60d")} className="press text-[13px] font-medium text-accent">
          Ampliar para 60 dias
        </button>
      )}
    </Empty>
  );

  return (
    <DashboardCard
      className={className}
      style={style}
      title={
        <Segmented
          label="Gráfico"
          value={tab}
          options={options}
          onChange={setTab}
          className={compact ? "flex w-full" : undefined}
        />
      }
      right={right}
    >
      {tab === "banca" ? (
        bankroll.length > 0 ? (
          <BankrollChart data={bankroll} height={height} />
        ) : (
          <Empty height={height}>
            <p className="text-[13px] text-zinc-400">Sem movimentação nas casas no período.</p>
          </Empty>
        )
      ) : dailyData.length === 0 ? (
        noBets
      ) : tab === "acumulado" ? (
        <CumulativeProfitChart data={dailyData} height={height} compact={compact} />
      ) : (
        <ProfitBarChart data={bars} height={height} semanal={weekly} tooltip={!compact} />
      )}
    </DashboardCard>
  );
}
