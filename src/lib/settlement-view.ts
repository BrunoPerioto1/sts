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

// ---- Liquidar na mão ----

/**
 * Motivo do bot (settlement.types.ts da API) em uma linha curta pra lista. O
 * texto técnico (`explanation`) continua no detalhe.
 */
const MOTIVO: Record<string, string> = {
  DADO_INDISPONIVEL: "O placar não traz esse dado",
  MERCADO_NAO_RECONHECIDO: "Mercado que o bot não entendeu",
  OUTRA_CATEGORIA: "Mercado fora do que o bot confere",
  TEMPO_PARCIAL: "Sem o placar do tempo da aposta",
  GOLS_DE_UM_TIME: "Não deu pra saber de qual time é",
  VARIOS_JOGOS: "Múltipla que o bot não separou",
  COMBINADA_NAO_SEPARADA: "Múltipla que o bot não separou",
  CONDICAO_ALTERNATIVA: "Aposta com condição alternativa",
  ESPORTE_FORA_ESCOPO: "Esporte que o bot ainda não confere",
  ESCOPO_NAO_SUPORTADO: "Vale prorrogação ou classificação",
  REGRA_NAO_SUPORTADA: "Depende da regra da casa",
  PERNA_ANULADA: "Perna anulada muda a odd",
  MERCADO_TRUNCADO: "Texto da aposta cortado pelo canal",
};

// Status do evento que vem em `status "postponed"`.
const STATUS_JOGO: Record<string, string> = {
  postponed: "Jogo adiado",
  canceled: "Jogo cancelado",
  cancelled: "Jogo cancelado",
  interrupted: "Jogo interrompido",
  suspended: "Jogo suspenso",
  abandoned: "Jogo abandonado",
  inprogress: "Jogo em andamento",
  notstarted: "Jogo ainda não começou",
};

interface Indecisa {
  reason: string | null;
  explanation: string | null;
}

/** Sem placar final ainda: não há o que o usuário conferir, só esperar. */
export function aguardandoResultado(b: Indecisa): boolean {
  return b.reason === "JOGO_NAO_FINALIZADO" || b.reason === "SEM_PLACAR";
}

export function motivoCurto(b: Indecisa): string {
  if (b.reason === "JOGO_NAO_FINALIZADO") {
    const status = /status "([^"]+)"/.exec(b.explanation ?? "")?.[1]?.toLowerCase().replace(/[^a-z]/g, "");
    return `${(status && STATUS_JOGO[status]) || "Jogo não terminou"} · ainda sem placar`;
  }
  if (b.reason === "SEM_PLACAR") return "Ainda sem placar";
  return (b.reason && MOTIVO[b.reason]) || b.explanation || "O bot não soube decidir";
}

/** "quem marcou; 3 escanteios" → "Quem marcou. 3 escanteios." — pra ler como frase. */
export function explicacaoLegivel(texto: string | null): string {
  return (texto ?? "")
    .split(";")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => `${t[0].toUpperCase()}${t.slice(1)}${/[.!?]$/.test(t) ? "" : "."}`)
    .join(" ");
}

/**
 * Pernas da aposta. "Criar aposta: A / B / C" vira o rótulo "Criar aposta" e
 * as três seleções; mercado simples é uma seleção só, sem rótulo.
 */
export function selecoesDe(market: string): { rotulo: string | null; itens: string[] } {
  const partes = (texto: string) => texto.split(/\s+\/\s+/).map((t) => t.trim()).filter(Boolean);
  const m = /^([^:/]{2,30}):\s*(.+)$/.exec(market);
  if (m && partes(m[2]).length > 1) return { rotulo: m[1].trim(), itens: partes(m[2]) };
  return { rotulo: null, itens: partes(market) };
}

/** "hoje, 20:59" / "ontem, 20:59" / "há 3 dias" / "12/09". */
export function quandoCurto(value: string | null, agora = new Date()): string {
  if (!value) return "sem data";
  const dia = diaRelativo(value, agora);
  if (dia === "hoje" || dia === "ontem") {
    return `${dia}, ${new Date(value).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return /dias$/.test(dia) ? `há ${dia}` : dia;
}
