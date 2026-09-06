import { useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarBlank, CaretDown, ChartLine, TrendUp, Target, Database, Clock, CreditCard, ChartBar, Coins } from "@phosphor-icons/react";
import { useMe } from "@/hooks/queries/use-me";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { DailySummaryPoint } from "@/api/routes/get-dashboard-daily";
import type { DatePreset } from "@/hooks/dashboard/useDashboardFilters";
import { formatCurrencyCompact, formatSignedCurrency } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullToRefreshIndicator } from "@/components/ui/pull-to-refresh";
import { PeriodSheet } from "./PeriodSheet";
import { ProfitBarChart } from "./ProfitBarChart";

const PRESET_LABEL: Record<DatePreset, string> = {
  "7d": "7 dias",
  "14d": "14 dias",
  currentMonth: "Mês atual",
  lastMonth: "Mês passado",
  "60d": "60 dias",
  "90d": "90 dias",
  allTime: "Tudo",
  custom: "Personalizado",
};

// Barras também representam um único dia; vazio só quando não há dados.
const MIN_DAYS_FOR_CHART = 1;

type Tone = "positive" | "negative" | "muted";

interface Tile {
  label: string;
  value: string;
  valueTone?: Tone;
  icon: typeof TrendUp;
}

const toneClass: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-zinc-400",
};

function signedTone(value: number): Tone {
  return value >= 0 ? "positive" : "negative";
}

interface DashboardMobileViewProps {
  filters: { startDate: string; endDate: string };
  preset: DatePreset;
  firstBetDate: string | null;
  metrics: DashboardMetrics;
  previousMetrics: DashboardMetrics;
  dailyData: DailySummaryPoint[];
  onPresetChange: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
}

export function DashboardMobileView({
  filters,
  preset,
  firstBetDate,
  metrics,
  dailyData,
  onPresetChange,
  onCustomRange,
}: DashboardMobileViewProps) {
  const [periodOpen, setPeriodOpen] = useState(false);
  const { me } = useMe();
  const invalidate = useInvalidateBetData();
  const pull = usePullToRefresh(invalidate);
  const bankroll = Number(me?.stake ?? 0);
  const unitValue = Number.isFinite(bankroll) && bankroll > 0 ? bankroll / 100 : null;

  const profit = Number(metrics.totalProfit);
  const totalBets = Number(metrics.totalBets);
  const roi = Number(metrics.roi) * 100;
  const hitRate = Number(metrics.hitRate) * 100;
  const avgOdd = Number(metrics.averageOdd);
  const avgStake = Number(metrics.averageStake);

  const days = differenceInCalendarDays(parseISO(filters.endDate), parseISO(filters.startDate)) + 1;
  const shortDate = (iso: string) => format(parseISO(iso), "d MMM", { locale: ptBR });
  const rangeSuffix = preset === "custom" ? `${days} dias` : PRESET_LABEL[preset].toLowerCase();

  const positives = dailyData.filter((d) => d.profitDay > 0).length;
  const negatives = dailyData.filter((d) => d.profitDay < 0).length;
  const neutrals = dailyData.filter((d) => d.profitDay === 0).length;

  const daysSummary =
    dailyData.length === 0
      ? "Nenhum dia com resultado"
      : dailyData.length === 1
        ? `1 dia com resultado · ${shortDate(dailyData[0].date)}`
        : [
            `${positives} dia${positives === 1 ? "" : "s"} positivo${positives === 1 ? "" : "s"}`,
            `${negatives} negativo${negatives === 1 ? "" : "s"}`,
            neutrals > 0 ? `${neutrals} neutro${neutrals === 1 ? "" : "s"}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

  const tiles: Tile[] = [
    { label: "ROI", icon: TrendUp, value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, valueTone: signedTone(roi) },
    { label: "Unidades", icon: Coins, valueTone: "positive", value: unitValue != null ? `${(profit / unitValue).toLocaleString("pt-BR", { maximumFractionDigits: 2, signDisplay: "exceptZero" })} U` : "—" },
    { label: "Apostas", icon: Database, value: String(totalBets) },
    { label: "Pendentes", icon: Clock, value: String(Number(metrics.pendingBets)) },
    { label: "Total apostado", icon: CreditCard, value: formatCurrencyCompact(Number(metrics.totalStaked)) },
    { label: "Stake médio", icon: ChartBar, value: formatCurrencyCompact(avgStake) },
    { label: "Odd média", icon: TrendUp, value: avgOdd.toFixed(2) },
    { label: "Taxa de acerto", icon: Target, value: `${hitRate.toFixed(1)}%` },
  ];

  return (
    <>
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      <div className="min-h-[calc(100dvh-96px)] px-4 pt-5 pb-6 flex flex-col">
        <div className="flex items-start justify-between gap-3 shrink-0 animate-rise stagger" style={stagger(0)}>
          <div className="min-w-0">
            <h2 className="text-[28px] leading-tight font-semibold tracking-tight">Dashboard</h2>
            <p className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
              <CalendarBlank size={17} className="shrink-0" aria-hidden="true" />
              <span>
              {shortDate(filters.startDate)} – {shortDate(filters.endDate)} · {rangeSuffix}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="press shrink-0 flex items-center gap-1.5 h-11 px-3 rounded-xl border border-white/10 text-sm text-zinc-300"
          >
            {PRESET_LABEL[preset]} <CaretDown size={12} />
          </button>
        </div>

        <div className="mt-8 shrink-0 animate-rise stagger" style={stagger(1)}>
          <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Lucro líquido</p>
          {/* Numero-heroi da tela: conta ate o valor final. O `key` no periodo
              faz a contagem recomecar quando o usuario troca o filtro — sem
              ele o hook so interpolaria do valor antigo pro novo. */}
          <p className={cn("text-[clamp(1.75rem,9vw,2.5rem)] font-semibold tabular-nums leading-tight tracking-tight", toneClass[signedTone(profit)])}>
            <AnimatedNumber
              key={`${filters.startDate}-${filters.endDate}`}
              value={profit}
              format={formatSignedCurrency}
            />
          </p>
          <p className="text-sm text-zinc-400 mt-1">{daysSummary}</p>
        </div>

        <div className="mt-5 animate-rise stagger" style={stagger(2)}>
          {dailyData.length >= MIN_DAYS_FOR_CHART ? (
            <ProfitBarChart data={dailyData} />
          ) : (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="flex items-start gap-2">
                <ChartLine size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-400 leading-snug">
                  Nenhuma aposta no período. Experimente ampliar as datas.
                </p>
              </div>
              {preset !== "60d" && preset !== "allTime" && (
                <button
                  type="button"
                  onClick={() => onPresetChange("60d")}
                  className="press text-sm text-accent font-medium mt-2 ml-6"
                >
                  Ampliar para 60 dias
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 auto-rows-fr gap-2.5 mt-6">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className={cn(
                "min-w-0 flex items-center gap-2 min-h-[76px] rounded-xl border border-white/[0.07] bg-white/[0.015] p-3 animate-rise stagger"
              )}
              style={stagger(3 + i)}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 max-[359px]:h-7 max-[359px]:w-7" aria-hidden="true"><tile.icon size={21} /></span>
              <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">{tile.label}</p>
              <p className={cn("text-lg leading-tight font-semibold tabular-nums break-words", tile.valueTone && toneClass[tile.valueTone])}>
                {tile.value}
              </p>
              </div>

            </div>
          ))}
        </div>

      </div>

      <PeriodSheet
        open={periodOpen}
        onOpenChange={setPeriodOpen}
        preset={preset}
        firstBetDate={firstBetDate}
        from={filters.startDate}
        to={filters.endDate}
        onSelect={onPresetChange}
        onCustomRange={onCustomRange}
      />
    </>
  );
}
