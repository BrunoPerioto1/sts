import { format, getISOWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { BetItem } from "@/api/routes/get-bets";
import { settledProfit } from "./bet-status";

export interface DayGroup {
  key: string;
  label: string;
  total: number;
  bets: BetItem[];
}
export interface WeekGroup {
  key: string;
  label: string;
  total: number;
  days: DayGroup[];
}
export interface MonthGroup {
  key: string;
  label: string;
  count: number;
  total: number;
  weeks: WeekGroup[];
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

// Mês > semana ISO > dia, do mais recente pro mais antigo, com o lucro
// liquidado somado em cada nível.
export function groupBets(apostas: BetItem[]): MonthGroup[] {
  const sorted = [...apostas].sort((a, b) => new Date(b.betTime).getTime() - new Date(a.betTime).getTime());

  const months = new Map<string, MonthGroup>();
  for (const bet of sorted) {
    const date = new Date(bet.betTime);
    const monthKey = format(date, "yyyy-MM");
    const weekKey = `${format(date, "yyyy")}-W${getISOWeek(date)}`;
    const dayKey = format(date, "yyyy-MM-dd");

    if (!months.has(monthKey)) {
      months.set(monthKey, { key: monthKey, label: capitalize(format(date, "MMMM yyyy", { locale: ptBR })), count: 0, total: 0, weeks: [] });
    }
    const month = months.get(monthKey)!;
    month.count += 1;
    month.total += settledProfit(bet);

    let week = month.weeks.find((w) => w.key === weekKey);
    if (!week) {
      week = { key: weekKey, label: `Semana ${getISOWeek(date)}`, total: 0, days: [] };
      month.weeks.push(week);
    }
    week.total += settledProfit(bet);

    let day = week.days.find((d) => d.key === dayKey);
    if (!day) {
      day = { key: dayKey, label: capitalize(format(date, "EEEE dd", { locale: ptBR })), total: 0, bets: [] };
      week.days.push(day);
    }
    day.total += settledProfit(bet);
    day.bets.push(bet);
  }

  return Array.from(months.values());
}

export function betIdsOfMonth(month: MonthGroup): number[] {
  return month.weeks.flatMap((w) => w.days.flatMap((d) => d.bets.map((b) => b.id)));
}

export function groupCheckState(ids: number[], selected: Set<number>): boolean | "indeterminate" {
  if (ids.length === 0) return false;
  const selectedCount = ids.filter((id) => selected.has(id)).length;
  if (selectedCount === 0) return false;
  if (selectedCount === ids.length) return true;
  return "indeterminate";
}
