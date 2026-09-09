import { useQuery } from "@tanstack/react-query";
import { getBets } from "@/api/routes/get-bets";

export interface HouseProfit {
  house: string;
  profit: number;
}

/**
 * Lucro por casa dentro do período. O backend só expõe saldo por casa sem
 * recorte de data (/house/balances), então a soma é feita aqui a partir das
 * apostas do período.
 *
 * ponytail: uma página de 500 apostas cobre qualquer período usável hoje; se
 * passar disso, o certo é um /dashboard/by-house agregando no banco.
 */
export function useHouseProfit(startDate: string, endDate: string) {
  const { data } = useQuery({
    queryKey: ["dashboard", "by-house", startDate, endDate],
    queryFn: () => getBets({ startDate, endDate, perPage: 500 }),
    enabled: Boolean(startDate && endDate),
    select: (page): HouseProfit[] => {
      const totals = new Map<string, number>();
      for (const bet of page.data ?? []) {
        const profit = Number(bet.profit ?? 0);
        if (!profit) continue;
        const house = bet.houseName ?? "Sem casa";
        totals.set(house, (totals.get(house) ?? 0) + profit);
      }
      return Array.from(totals, ([house, profit]) => ({ house, profit })).sort(
        (a, b) => b.profit - a.profit
      );
    },
  });
  return data ?? [];
}
