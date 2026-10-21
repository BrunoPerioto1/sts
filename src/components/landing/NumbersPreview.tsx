import { addDays, endOfMonth, format, getDaysInMonth, startOfMonth, subMonths } from "date-fns";
import type { DashboardMetrics } from "@/api/routes/get-dashboard-metrics";
import type { SportBreakdown } from "@/api/routes/get-dashboard-by-sport";
import { DashboardKpiCards } from "@/components/dashboard/DashboardKpiCards";
import { DashboardMainChart } from "@/components/dashboard/DashboardMainChart";
import { HitRateCard } from "@/components/dashboard/HitRateCard";
import { ResultsCalendar } from "@/components/dashboard/ResultsCalendar";
import { SportsCard } from "@/components/dashboard/SportsCard";
import { normalizeDashboardPreferences } from "@/lib/dashboard-preferences";

/**
 * Os componentes de verdade do Dashboard, alimentados com um mês inventado: o
 * mês passado inteiro, pra o calendário fechar. Fica num chunk à parte (o
 * Recharts só baixa quando a landing chega aqui). Os números são modestos de
 * propósito: a página vende controle, não lucro. Lucro, apostas, acerto e os
 * esportes batem entre si.
 */

// Resultado de cada dia do mês; zero = dia sem aposta.
const PROFITS = [12.5, -50, 0, 41, -20, 0, 63.5, -50, 18, 0, -30, 55, 0, -10, 24, 47.5, -50, 0, 0, 36, -20, 15, 0, -40, 52, 0, 21.3, -25, 30, 0];
const MONTH = startOfMonth(subMonths(new Date(), 1));
const START = format(MONTH, "yyyy-MM-dd");
const END = format(endOfMonth(MONTH), "yyyy-MM-dd");
const DAYS = PROFITS.slice(0, getDaysInMonth(MONTH));

const DAILY = DAYS.flatMap((profitDay, i) =>
  profitDay === 0 ? [] : [{ date: format(addDays(MONTH, i), "yyyy-MM-dd"), totalBets: 1 + (i % 3), profitDay }],
);
const PROFIT = DAYS.reduce((sum, v) => sum + v, 0);

// Banca de R$ 5.000 no começo do mês, andando com o resultado de cada dia.
let saldo = 5000;
const BANKROLL = DAYS.map((profit, i) => ({ date: format(addDays(MONTH, i), "yyyy-MM-dd"), balance: (saldo += profit) }));

const METRICS: DashboardMetrics = {
  totalBets: 55,
  settledBets: 48,
  wonBets: 25,
  lostBets: 21,
  pendingBets: 5,
  canceledBets: 2,
  totalStaked: 2650,
  settledStake: 2300,
  averageStake: 50,
  averageOdd: 2.08,
  totalProfit: PROFIT,
  roi: PROFIT / 2300,
  hitRate: 25 / 46,
  biggestWin: 63.5,
  biggestLoss: -50,
  streak: 2,
  maxDrawdown: 67.5,
};

// Somam as 55 apostas, as 25 ganhas e as 21 perdidas acima. O vôlei só tem
// pendentes, pra mostrar o "pendente" no lugar de R$ 0.
const SPORTS: SportBreakdown[] = [
  { sport: "Futebol", bets: 33, pendingBets: 2, wonBets: 16, lostBets: 12, settledStake: 1400, profit: 100.3 },
  { sport: "Basquete", bets: 10, pendingBets: 1, wonBets: 6, lostBets: 3, settledStake: 450, profit: 32.5 },
  // O que sobra do lucro do mês: um esporte no vermelho, pequeno.
  { sport: "Tênis", bets: 10, pendingBets: 0, wonBets: 3, lostBets: 6, settledStake: 450, profit: PROFIT - 132.8 },
  { sport: "Vôlei", bets: 2, pendingBets: 2, wonBets: 0, lostBets: 0, settledStake: 0, profit: 0 },
];

// Padrão do dashboard: Lucro, ROI, Banca e Apostas. `stake` é a banca do
// perfil (a unidade é 1% dela).
const PREFERENCES = normalizeDashboardPreferences(null);
const COLORS = PREFERENCES.performanceColors;
const INPUT = { metrics: METRICS, stake: 5000, bankroll: BANKROLL[BANKROLL.length - 1].balance };
const noop = () => {};

export default function NumbersPreview() {
  return (
    <div className="space-y-3 rounded-2xl border border-foreground/10 bg-background p-3 shadow-card sm:p-4">
      <DashboardKpiCards compact className="sm:hidden" input={INPUT} preferences={PREFERENCES} />
      <DashboardKpiCards className="hidden sm:grid" input={INPUT} preferences={PREFERENCES} />

      <DashboardMainChart dailyData={DAILY} bankroll={BANKROLL} filtered={false} preset="lastMonth" onPresetChange={noop} height={240} />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <ResultsCalendar compact className="sm:hidden" dailyData={DAILY} startDate={START} endDate={END} colors={COLORS} />
        <ResultsCalendar
          fluid
          className="hidden sm:flex md:col-span-2 lg:col-span-1"
          dailyData={DAILY}
          startDate={START}
          endDate={END}
          colors={COLORS}
        />
        <HitRateCard metrics={METRICS} />
        <SportsCard sample={SPORTS} colors={COLORS} className="md:self-start" />
      </div>
    </div>
  );
}
