import { getBets, type BetItem } from "@/api/routes/get-bets";
import { getTransactions } from "@/api/routes/get-transaction";
import { getDashboardMonthlySummary } from "@/api/routes/get-dashboard-monthly";
import { downloadCsv } from "./csv";
import { formatDate, formatTime } from "./format";

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

// Exporta o que está na tela de apostas (já filtrado), com a hora do lançamento.
export function exportBetsListCsv(bets: BetItem[]) {
  downloadCsv(
    "apostas.csv",
    ["Data", "Hora", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"],
    bets.map((b) => [formatDate(b.betTime), formatTime(b.betTime), ...betRow(b)])
  );
}

// Exportações do perfil: buscam tudo do backend, sem filtro de tela.
export async function exportAllBetsCsv() {
  const res = await getBets({ perPage: 5000, page: 1 });
  downloadCsv(
    "apostas.csv",
    ["Data", "Evento", "Mercado", "Casa", "Odd", "Stake", "Status", "Retorno"],
    (res.data ?? []).map((b) => [formatDate(b.betTime), ...betRow(b)])
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
