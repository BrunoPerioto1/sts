import { useQuery } from "@tanstack/react-query";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { getDashboardDailySummary } from "@/api/routes/get-dashboard-daily";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";
import { useHouseMetrics } from "@/hooks/queries/use-houses";
import type { BankrollPoint } from "@/components/dashboard/BankrollChart";

// Mesmo sinal do saldo real da casa (house.service): saque sempre sai,
// ajuste vale com o sinal que foi lançado.
function flow(tx: TransactionDto): number {
  const value = Number(tx.value);
  if (tx.transactionType === "DEPOSIT") return Math.abs(value);
  if (tx.transactionType === "WITHDRAWAL") return -Math.abs(value);
  return value;
}

/**
 * Banca ao fim de cada dia do período, reconstruída de trás pra frente a
 * partir do saldo atual das casas: desfaz o lucro das apostas E os depósitos,
 * saques e ajustes de cada dia. Sem as movimentações, um saque grande fazia a
 * curva começar negativa.
 *
 * Vai até hoje (não só até o fim do período): o saldo atual já inclui o que
 * aconteceu depois, então isso também precisa ser desfeito.
 */
export function useBankrollSeries(startDate: string, endDate: string) {
  const today = format(new Date(), "yyyy-MM-dd");
  const until = endDate > today ? endDate : today;
  const houseMetrics = useHouseMetrics();

  const daily = useQuery({
    queryKey: ["dashboard", "daily-summary", null, startDate, until],
    queryFn: () => getDashboardDailySummary({ startDate, endDate: until }),
    enabled: Boolean(startDate && endDate),
  });
  const transactions = useQuery({
    queryKey: ["transactions", "all", startDate, until],
    queryFn: () => getTransactions({ startDate, endDate: until }),
    enabled: Boolean(startDate && endDate),
  });

  if (!daily.data || !transactions.data || !houseMetrics.data || startDate > today) return [];

  const change = new Map<string, number>();
  for (const d of daily.data) change.set(d.date, (change.get(d.date) ?? 0) + d.profitDay);
  for (const tx of transactions.data) {
    const day = format(parseISO(tx.createdAt), "yyyy-MM-dd");
    change.set(day, (change.get(day) ?? 0) + flow(tx));
  }

  // Saldo real: casas negativas entram com o sinal, como no servidor.
  let balance = Number(houseMetrics.data.totalBalance) + Number(houseMetrics.data.negativeAmount ?? 0);
  const points: BankrollPoint[] = [];
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(today) });
  for (let i = days.length - 1; i >= 0; i--) {
    const day = format(days[i], "yyyy-MM-dd");
    if (day <= endDate) points.unshift({ date: day, balance });
    balance -= change.get(day) ?? 0;
  }
  return points;
}
