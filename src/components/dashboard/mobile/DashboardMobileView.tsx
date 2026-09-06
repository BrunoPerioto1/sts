import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CaretDown, ChartLine } from "@phosphor-icons/react";
import { getBets, ResultIdEnum, type BetItem } from "@/api/routes/get-bets";
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
  const [bets, setBets] = useState<BetItem[]>([]);
  const invalidate = useInvalidateBetData();
  // A busca de apostas abaixo é um fetch solto (não passa pelo react-query),
  // então o pull-to-refresh precisa mexer nela por fora: o nonce entra nas
  // deps do efeito e o invalidate cuida do resto do dashboard.
  const [refreshNonce, setRefreshNonce] = useState(0);
  const pull = usePullToRefresh(async () => {
    setRefreshNonce((n) => n + 1);
    await invalidate();
  });

  // A maior sequência de ganhas ainda depende da lista de apostas do período.
  useEffect(() => {
    let cancelled = false;
    getBets({ startDate: filters.startDate, endDate: filters.endDate, perPage: 1000 })
      .then((res) => {
        if (!cancelled) setBets(Array.isArray(res?.data) ? res.data : []);
      })
      .catch(() => {
        if (!cancelled) setBets([]);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.startDate, filters.endDate, refreshNonce]);

  const longestStreak = useMemo(() => {
    const settled = [...bets]
      .filter((b) => b.resultId !== ResultIdEnum.PENDING)
      .sort((a, b) => new Date(a.betTime).getTime() - new Date(b.betTime).getTime());

    let best = 0;
    let run = 0;
    for (const bet of settled) {
      if (Number(bet.profit ?? 0) > 0) {
        run += 1;
        best = Math.max(best, run);
      } else {
        run = 0;
      }
    }

    return best;
  }, [bets]);

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
    { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, valueTone: signedTone(roi) },
    { label: "Taxa de acerto", value: `${hitRate.toFixed(1)}%` },
    { label: "Apostas", value: String(totalBets) },
    { label: "Pendentes", value: String(Number(metrics.pendingBets)) },
    { label: "Total apostado", value: formatCurrencyCompact(Number(metrics.totalStaked)) },
    { label: "Stake médio", value: formatCurrencyCompact(avgStake) },
    { label: "Odd média", value: avgOdd.toFixed(2) },
    { label: "Maior sequência", value: longestStreak > 0 ? `${longestStreak} ganha${longestStreak === 1 ? "" : "s"}` : "—" },
  ];

  return (
    <>
      <PullToRefreshIndicator distance={pull.distance} refreshing={pull.refreshing} />
      {/* Ocupa a altura útil da tela (viewport menos a bottom nav) e distribui
          os blocos na vertical, em vez de amontoar tudo no topo. */}
      <div className="min-h-[calc(100dvh-96px)] px-4 pt-4 flex flex-col">
        <div className="flex items-start justify-between gap-3 shrink-0 animate-rise stagger" style={stagger(0)}>
          <div className="min-w-0">
            <h2 className="text-2xl font-semibold tracking-tight">Resultado</h2>
            <p className="text-sm text-zinc-400 truncate">
              {shortDate(filters.startDate)} – {shortDate(filters.endDate)} · {rangeSuffix}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="press shrink-0 flex items-center gap-1.5 h-11 px-3 rounded-lg border border-white/10 text-sm text-zinc-300"
          >
            {PRESET_LABEL[preset]} <CaretDown size={12} />
          </button>
        </div>

        <div className="mt-6 shrink-0 animate-rise stagger" style={stagger(1)}>
          <p className="text-xs uppercase tracking-wide opacity-75 mb-1">Lucro líquido</p>
          {/* Numero-heroi da tela: conta ate o valor final. O `key` no periodo
              faz a contagem recomecar quando o usuario troca o filtro — sem
              ele o hook so interpolaria do valor antigo pro novo. */}
          <p className={cn("text-3xl font-semibold tabular-nums leading-tight", toneClass[signedTone(profit)])}>
            <AnimatedNumber
              key={`${filters.startDate}-${filters.endDate}`}
              value={profit}
              format={formatSignedCurrency}
            />
          </p>
          <p className="text-sm text-zinc-400 mt-0.5">{daysSummary}</p>
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

        <div className="grid grid-cols-2 auto-rows-fr gap-x-6 mt-4 flex-1">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className={cn(
                "flex flex-col justify-center py-3 animate-rise stagger",
                i >= 2 && "border-t border-white/[0.06]"
              )}
              style={stagger(3 + i)}
            >
              <p className="text-[11px] uppercase tracking-wide text-zinc-400 mb-1">{tile.label}</p>
              <p className={cn("text-xl font-semibold tabular-nums", tile.valueTone && toneClass[tile.valueTone])}>
                {tile.value}
              </p>

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
