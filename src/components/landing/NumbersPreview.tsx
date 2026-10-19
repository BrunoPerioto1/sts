import { format, subDays } from "date-fns";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import { DashboardKpiGrid } from "@/components/dashboard/DashboardKpiGrid";
import { HouseProfitBars } from "@/components/dashboard/HouseProfitBars";
import { ProfitBarChart } from "@/components/dashboard/ProfitBarChart";
import { normalizeDashboardPreferences } from "@/lib/dashboard-preferences";
import { formatMoney } from "@/lib/format";

/**
 * Os componentes de verdade do Dashboard, alimentados com um mês inventado.
 * Fica num chunk à parte (o Recharts só baixa quando a landing chega aqui).
 * Os números são modestos de propósito: a página vende controle, não lucro.
 */

const PROFITS = [12.5, -50, 0, 41, -20, 0, 63.5, -50, 18, 0, -30, 55, 0, -10, 24, 47.5, -50, 0, 0, 36, -20, 15, 0, -40, 52, 0, 21.3, -25, 30, 0];
const today = new Date();
const DAILY = PROFITS.map((profitDay, i) => ({ date: format(subDays(today, PROFITS.length - 1 - i), "yyyy-MM-dd"), profitDay }));
const PROFIT = PROFITS.reduce((sum, v) => sum + v, 0);
const UP_DAYS = PROFITS.filter((v) => v > 0).length;
const DOWN_DAYS = PROFITS.filter((v) => v < 0).length;

const METRICS: DashboardMetrics = {
  totalBets: 55,
  settledBets: 48,
  wonBets: 25,
  lostBets: 21,
  pendingBets: 5,
  canceledBets: 2,
  totalStaked: 2650,
  settledStake: 2400,
  averageStake: 50,
  averageOdd: 2.08,
  totalProfit: PROFIT,
  roi: PROFIT / 2400,
  hitRate: 25 / 46,
  biggestWin: 63.5,
  biggestLoss: -50,
  streak: 2,
  maxDrawdown: 67.5,
};

const PREVIOUS: DashboardMetrics = {
  ...METRICS,
  totalBets: 49,
  settledBets: 44,
  wonBets: 21,
  lostBets: 21,
  totalStaked: 2380,
  settledStake: 2200,
  averageOdd: 2.01,
  totalProfit: 63.8,
  roi: 63.8 / 2200,
  hitRate: 21 / 42,
};

const HOUSES = [
  { house: "Betano", profit: 88.4 },
  { house: "Bet365", profit: 52.1 },
  { house: "Superbet", profit: 17.3 },
  { house: "KTO", profit: -12 },
  { house: "Sportingbet", profit: -25 },
];

const PREFERENCES = normalizeDashboardPreferences(null);

export default function NumbersPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/[0.012] shadow-card">
      <div className="grid lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
        <div className="border-b border-foreground/[0.06] p-6 lg:border-b-0 lg:border-r">
          <p className="text-[13px] text-zinc-400">Lucro líquido nos últimos 30 dias</p>
          <p className="landing-display mt-2 text-[40px] tabular-nums text-success">{formatMoney(PROFIT, { signed: true })}</p>
          <p className="mt-2 text-[13px] text-zinc-400">
            {UP_DAYS} dias positivos e {DOWN_DAYS} negativos
          </p>
          <div className="mt-6 border-t border-foreground/[0.06] pt-5">
            <p className="mb-4 text-[13px] text-zinc-400">Por casa</p>
            <HouseProfitBars rows={HOUSES} />
          </div>
        </div>
        <div className="p-6">
          <p className="mb-3 text-[13px] text-zinc-400">Resultado por dia (toque numa barra)</p>
          <ProfitBarChart data={DAILY} height={260} />
        </div>
      </div>
      <div className="border-t border-foreground/[0.06]">
        {/* `stake` aqui é a banca: a unidade é 1% dela, R$ 50 como nas cenas de cima. */}
        <DashboardKpiGrid metrics={METRICS} previous={PREVIOUS} stake={5000} preferences={PREFERENCES} desktop />
      </div>
    </div>
  );
}
