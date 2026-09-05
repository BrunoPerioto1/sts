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

// O gráfico só conta uma história a partir de três dias liquidados; abaixo
// disso o card mostra o aviso no lugar da curva.
const MIN_DAYS_FOR_CHART = 3;

type Tone = "positive" | "negative" | "muted";

interface Tile {
  label: string;
  value: string;
  valueTone?: Tone;
  sub?: string;
  subTone?: Tone;
}

const toneClass: Record<Tone, string> = {
  positive: "text-positive",
  negative: "text-negative",
  muted: "text-zinc-500",
};

function signedTone(value: number): Tone {
  return value >= 0 ? "positive" : "negative";
}

function ppDelta(current: number, previous: number) {
  const diff = current - previous;
  return { label: `${diff >= 0 ? "+" : "−"}${Math.abs(diff).toFixed(1)} p.p.`, tone: signedTone(diff) };
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
  previousMetrics,
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

  // Uma busca só por período: dela saem as pendentes (contagem + valor em
  // risco) e a maior sequência de ganhas, que não vêm nas métricas da API.
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

  const { pendingCount, longestStreak } = useMemo(() => {
    const pending = bets.filter((b) => b.resultId === ResultIdEnum.PENDING);
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

    return { pendingCount: pending.length, longestStreak: best };
  }, [bets]);

  const profit = Number(metrics.totalProfit);
  const totalBets = Number(metrics.totalBets);
  const wonBets = Number(metrics.wonBets);
  const roi = Number(metrics.roi) * 100;
  const hitRate = Number(metrics.hitRate) * 100;
  const avgOdd = Number(metrics.averageOdd);
  const avgStake = Number(metrics.averageStake);

  const prevTotalBets = Number(previousMetrics.totalBets);
  const hasPrevious = prevTotalBets > 0;
  const prevRoi = Number(previousMetrics.roi) * 100;
  const prevHitRate = Number(previousMetrics.hitRate) * 100;
  const prevAvgOdd = Number(previousMetrics.averageOdd);
  const prevAvgStake = Number(previousMetrics.averageStake);

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

  const oddDelta = avgOdd - prevAvgOdd;
  const betsDelta = totalBets - prevTotalBets;
  const stakeDelta = avgStake - prevAvgStake;
  const stakeStable = prevAvgStake > 0 && Math.abs(stakeDelta) / prevAvgStake < 0.05;

  const tiles: Tile[] = [
    {
      label: "ROI",
      value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`,
      valueTone: signedTone(roi),
      ...(hasPrevious
        ? { sub: ppDelta(roi, prevRoi).label, subTone: ppDelta(roi, prevRoi).tone }
        : { sub: totalBets === 1 ? "1 aposta só" : `${totalBets} apostas`, subTone: "muted" as Tone }),
    },
    {
      label: "Odd média",
      value: avgOdd.toFixed(2),
      ...(hasPrevious
        ? { sub: `${oddDelta >= 0 ? "+" : "−"}${Math.abs(oddDelta).toFixed(2)}`, subTone: signedTone(oddDelta) }
        : totalBets > 0 && totalBets < 5
          ? { sub: "amostra baixa", subTone: "negative" as Tone }
          : {}),
    },
    {
      label: "Apostas",
      value: String(totalBets),
      ...(hasPrevious
        ? { sub: `${betsDelta >= 0 ? "+" : "−"}${Math.abs(betsDelta)} vs. anterior`, subTone: signedTone(betsDelta) }
        : { sub: `${pendingCount} pendente${pendingCount === 1 ? "" : "s"}`, subTone: "muted" as Tone }),
    },
    {
      label: "Taxa de acerto",
      value: `${hitRate.toFixed(1)}%`,
      ...(hasPrevious
        ? { sub: ppDelta(hitRate, prevHitRate).label, subTone: ppDelta(hitRate, prevHitRate).tone }
        : { sub: `${wonBets} de ${totalBets}`, subTone: "muted" as Tone }),
    },
    {
      label: "Stake médio",
      value: formatCurrencyCompact(avgStake),
      ...(hasPrevious
        ? stakeStable
          ? { sub: "estável", subTone: "muted" as Tone }
          : { sub: `${stakeDelta >= 0 ? "+" : "−"}${formatCurrencyCompact(Math.abs(stakeDelta))}`, subTone: signedTone(stakeDelta) }
        : {}),
    },
    {
      label: "Maior sequência",
      value: longestStreak > 0 ? `${longestStreak} ganha${longestStreak === 1 ? "" : "s"}` : "—",
      sub: "no período",
      subTone: "muted",
    },
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
            <p className="text-sm text-zinc-500 truncate">
              {shortDate(filters.startDate)} – {shortDate(filters.endDate)} · {rangeSuffix}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPeriodOpen(true)}
            className="press shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/10 text-sm text-zinc-300"
          >
            {PRESET_LABEL[preset]} <CaretDown size={12} />
          </button>
        </div>

        <div className="mt-6 shrink-0 animate-rise stagger" style={stagger(1)}>
          <p className="text-xs uppercase tracking-wide opacity-55 mb-1">Lucro líquido</p>
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
          <p className="text-sm text-zinc-500 mt-0.5">{daysSummary}</p>
        </div>

        <div className="mt-6 flex-1 animate-rise stagger" style={stagger(2)}>
          {dailyData.length >= MIN_DAYS_FOR_CHART ? (
            <ProfitBarChart data={dailyData} />
          ) : (
            <div className="rounded-lg bg-white/[0.03] p-3">
              <div className="flex items-start gap-2">
                <ChartLine size={16} className="text-zinc-500 shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-400 leading-snug">
                  {dailyData.length === 0
                    ? "Nenhum dia com resultado no período."
                    : dailyData.length === 1
                      ? "Um único dia com resultado não forma curva."
                      : "Dois dias com resultado ainda não formam curva."}{" "}
                  O gráfico aparece a partir de três dias liquidados no período.
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

        <div className="grid grid-cols-2 mt-6 shrink-0">
          {tiles.map((tile, i) => (
            <div
              key={tile.label}
              className={cn(
                "py-5 animate-rise stagger",
                i % 2 === 1 && "border-l border-border pl-4",
                i >= 2 && "border-t border-border"
              )}
              style={stagger(3 + i)}
            >
              <p className="text-xs uppercase tracking-wide opacity-55 mb-1">{tile.label}</p>
              <p className={cn("text-lg font-medium tabular-nums", tile.valueTone && toneClass[tile.valueTone])}>
                {tile.value}
              </p>
              {tile.sub && (
                <p className={cn("text-xs tabular-nums mt-0.5", toneClass[tile.subTone ?? "muted"])}>{tile.sub}</p>
              )}
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
