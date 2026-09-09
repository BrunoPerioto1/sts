import { getBets, type BetItem } from "@/api/routes/get-bets";
import { getTransactions } from "@/api/routes/get-transaction";
import { type HouseBalanceDto } from "@/api/routes/get-houses";
import { getDashboardMonthlySummary } from "@/api/routes/get-dashboard-monthly";
import { downloadCsv } from "./csv";
import { formatDate, formatTime } from "./format";
import { betDate } from "./bet-grouping";

function betRow(b: BetItem) {
  return [
    b.game,
    b.market,
    b.houseName ?? "",
    Number(b.odd).toFixed(2),
    Number(b.stake).toFixed(2),
    b.resultName ?? "",
    b.profit != null ? Number(b.profit).toFixed(2) : "",
  ];
}

// Exporta o que está na tela de apostas (já filtrado), pela data do jogo
// quando ele foi identificado.
export function exportBetsListCsv(bets: BetItem[]) {
  downloadCsv(
    "apostas.csv",
    ["Data", "Hora", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"],
    bets.map((b) => [formatDate(betDate(b)), formatTime(betDate(b)), ...betRow(b)])
  );
}

// Exportações do perfil: buscam tudo do backend, sem filtro de tela.
export async function exportAllBetsCsv() {
  const res = await getBets({ perPage: 5000, page: 1 });
  downloadCsv(
    "apostas.csv",
    ["Data", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"],
    (res.data ?? []).map((b) => [formatDate(betDate(b)), ...betRow(b)])
  );
}

export async function exportTransactionsCsv() {
  const txs = await getTransactions({});
  downloadCsv(
    "movimentacoes.csv",
    ["Data", "Casa", "Tipo", "Valor"],
    txs.map((t) => [formatDate(t.createdAt), t.houseName, t.transactionType, Number(t.value).toFixed(2)])
  );
}

export async function exportMonthlyCsv() {
  const monthly = await getDashboardMonthlySummary();
  downloadCsv(
    "resumo-mensal.csv",
    ["Mês", "Apostas", "Lucro"],
    monthly.map((m) => [m.month, m.totalBets, m.profitMonth.toFixed(2)])
  );
}

// Casas: exporta o que está na tela (já filtrado/ordenado).
export function exportHousesCsv(houses: HouseBalanceDto[]) {
  downloadCsv(
    "casas.csv",
    ["Casa", "Saldo", "Depositado", "Sacado", "Lucro", "Apostas", "Última mov."],
    houses.map((h) => [
      h.houseName,
      Number(h.houseBalance).toFixed(2),
      Number(h.totalDeposit).toFixed(2),
      Number(h.totalWithdrawal).toFixed(2),
      Number(h.totalBetProfit).toFixed(2),
      Number(h.totalBets),
      h.lastMovementAt ? formatDate(h.lastMovementAt) : "",
    ])
  );
}
