import type { HouseBalanceDto, HouseMetricsDto } from "@/api/routes/get-houses";

// Mesma redução do GET /house/metrics (house.service.getHouseMetrics), só que
// sobre as linhas que sobraram do filtro: com casas selecionadas os totais têm
// que falar da seleção, e o endpoint só sabe somar todas. Os campos somados
// são os mesmos, então o número bate com o do servidor quando nada é filtrado.
export function metricsFromBalances(rows: HouseBalanceDto[]): HouseMetricsDto {
  return rows.reduce<HouseMetricsDto>(
    (acc, h) => {
      const balance = Number(h.realHouseBalance);
      return {
        totalBalance: acc.totalBalance + balance,
        totalDeposit: acc.totalDeposit + Number(h.totalDeposit),
        totalWithdrawal: acc.totalWithdrawal + Number(h.totalWithdrawal),
        consolidatedProfit: acc.consolidatedProfit + Number(h.totalBetProfit),
        negativeHouses: acc.negativeHouses + (balance < 0 ? 1 : 0),
        totalHousesUsed: acc.totalHousesUsed + 1,
      };
    },
    {
      totalBalance: 0,
      totalDeposit: 0,
      totalWithdrawal: 0,
      consolidatedProfit: 0,
      negativeHouses: 0,
      totalHousesUsed: 0,
    },
  );
}
