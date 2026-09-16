// Contas que a tela de conferência faz em cima das propostas. Ficam aqui, fora
// do componente, porque são texto e número puros — nada depende de render.

// .ts explícito no caminho: o teste roda em node --test, que não resolve
// extensão sozinho como o bundler.
import { ResultIdEnum } from "../api/routes/result-id.ts";
import type { SettlementSuggestion } from "../api/routes/get-settlement";

/**
 * Prévia do impacto no lucro, só pra exibir. Quem grava o valor de verdade é o
 * backend, em calculateProfit — se os dois divergirem, o backend manda.
 */
export function lucroSugerido(s: SettlementSuggestion): number {
  if (s.suggestedResultId === ResultIdEnum.WON) return s.stake * (s.odd - 1);
  if (s.suggestedResultId === ResultIdEnum.LOST) return -s.stake;
  return 0; // anulada devolve a stake: não move o lucro
}

export interface Tally {
  ganhas: number;
  perdidas: number;
  anuladas: number;
}

export function tally(list: readonly SettlementSuggestion[]): Tally {
  const conta: Tally = { ganhas: 0, perdidas: 0, anuladas: 0 };
  for (const s of list) {
    if (s.suggestedResultId === ResultIdEnum.WON) conta.ganhas += 1;
    else if (s.suggestedResultId === ResultIdEnum.LOST) conta.perdidas += 1;
    else conta.anuladas += 1;
  }
  return conta;
}

/**
 * "8 ganhas · 3 perdidas · 1 anulada". Zero não vira "0 anuladas": a linha
 * existe pra dar o formato do lote de relance, e categoria vazia só faz o olho
 * parar num número que não quer dizer nada.
 */
export function formatTally({ ganhas, perdidas, anuladas }: Tally, separador = " · "): string {
  return [
    ganhas && `${ganhas} ganha${ganhas === 1 ? "" : "s"}`,
    perdidas && `${perdidas} perdida${perdidas === 1 ? "" : "s"}`,
    anuladas && `${anuladas} anulada${anuladas === 1 ? "" : "s"}`,
  ]
    .filter(Boolean)
    .join(separador);
}

/**
 * "hoje" / "ontem" / "2 dias" / "12/09" pro horário do jogo.
 *
 * A conferência é sobre jogo que acabou de terminar: dizer "hoje 16:00" situa
 * o usuário mais rápido que a data cheia, e a data cheia volta quando é antigo
 * o bastante pra contagem em dias já não ajudar.
 */
export function diaRelativo(value: string | Date, agora = new Date()): string {
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "";

  const meiaNoite = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((meiaNoite(agora) - meiaNoite(data)) / 86_400_000);

  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias > 1 && dias <= 6) return `${dias} dias`;
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}
