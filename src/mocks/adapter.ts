// Modo mock (`npm run dev:mock`): o axios responde daqui, sem API. Feito pra ver o
// desenho novo da Conferência; as outras telas recebem resposta vazia.
//
// Plano: ?plano=gratis na URL mostra o convite do Pro; ?plano=pro volta.
// Fica guardado no sessionStorage até trocar de novo. ?fila=vazia mostra o
// "Tudo conferido".
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { ResultIdEnum } from "@/api/routes/result-id";
import type { SettlementReviewItem, SettlementSuggestion } from "@/api/routes/get-settlement";
import type { MeResponse } from "@/api/routes/get-me";

const PLANO_KEY = "mock_plano";

function plano(): "free" | "pro" {
  const daUrl = new URLSearchParams(window.location.search).get("plano");
  try {
    if (daUrl) sessionStorage.setItem(PLANO_KEY, daUrl === "gratis" || daUrl === "free" ? "free" : "pro");
    return sessionStorage.getItem(PLANO_KEY) === "free" ? "free" : "pro";
  } catch {
    return daUrl === "gratis" || daUrl === "free" ? "free" : "pro";
  }
}

const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

let suggestions: SettlementSuggestion[] = [
  { betId: 101, game: "Flamengo x Palmeiras", market: "Resultado final: Flamengo", stake: 50, odd: 2.1, eventStartAt: horasAtras(3), suggestedResultId: ResultIdEnum.WON, explanation: "Flamengo venceu por 2×1", homeScore: 2, awayScore: 1 },
  { betId: 102, game: "Real Madrid x Barcelona", market: "Mais de 2.5 gols", stake: 100, odd: 1.85, eventStartAt: horasAtras(5), suggestedResultId: ResultIdEnum.WON, explanation: "4 gols no jogo, mais de 2.5", homeScore: 3, awayScore: 1 },
  { betId: 103, game: "Corinthians x São Paulo", market: "Ambas marcam: Sim", stake: 40, odd: 1.95, eventStartAt: horasAtras(6), suggestedResultId: ResultIdEnum.LOST, explanation: "São Paulo não marcou", homeScore: 1, awayScore: 0 },
  { betId: 104, game: "Manchester City x Arsenal", market: "Handicap asiático: Arsenal +0.5", stake: 75, odd: 2.3, eventStartAt: horasAtras(26), suggestedResultId: ResultIdEnum.WON, explanation: "Empate 1×1; Arsenal +0.5 cobre o empate", homeScore: 1, awayScore: 1 },
  { betId: 105, game: "Bayern x Dortmund", market: "Menos de 3.5 gols", stake: 60, odd: 1.7, eventStartAt: horasAtras(27), suggestedResultId: ResultIdEnum.LOST, explanation: "5 gols no jogo, acima de 3.5", homeScore: 3, awayScore: 2 },
  { betId: 106, game: "Grêmio x Internacional", market: "Empate anula: Grêmio", stake: 30, odd: 1.6, eventStartAt: horasAtras(28), suggestedResultId: ResultIdEnum.CANCELED, explanation: "Terminou empatado 0×0; aposta devolvida", homeScore: 0, awayScore: 0 },
  { betId: 107, game: "Botafogo x Fluminense", market: "Criar aposta: Botafogo vence / Mais de 1.5 gols / Escanteios mais de 7.5", stake: 25, odd: 4.5, eventStartAt: horasAtras(50), suggestedResultId: ResultIdEnum.WON, explanation: "Botafogo venceu por 3×1; 4 gols no jogo; 11 escanteios", homeScore: 3, awayScore: 1 },
  { betId: 108, game: "PSG x Olympique de Marseille", market: "Resultado final: PSG", stake: 80, odd: 1.45, eventStartAt: horasAtras(75), suggestedResultId: ResultIdEnum.WON, explanation: "PSG venceu por 2×0", homeScore: 2, awayScore: 0 },
  { betId: 109, game: "Athletico-PR x Cruzeiro", market: "Cruzeiro vence", stake: 45, odd: 2.6, eventStartAt: horasAtras(100), suggestedResultId: ResultIdEnum.LOST, explanation: "Athletico-PR venceu por 1×0", homeScore: 1, awayScore: 0 },
];

let review: SettlementReviewItem[] = [
  { betId: 201, game: "Vasco x Bahia", market: "Pedro marca a qualquer momento", stake: 30, odd: 2.75, eventStartAt: horasAtras(4), reason: "DADO_INDISPONIVEL", explanation: "o placar não diz quem marcou os gols", homeScore: 2, awayScore: 2 },
  { betId: 202, game: "Liverpool x Chelsea", market: "Criar aposta: Liverpool vence / Salah marca / Mais de 3.5 cartões", stake: 20, odd: 6.8, eventStartAt: horasAtras(7), reason: "DADO_INDISPONIVEL", explanation: "Liverpool venceu por 3×1; quem marcou; cartões não vêm no placar", homeScore: 3, awayScore: 1 },
  { betId: 203, game: "Juventus x Milan", market: "1º tempo: Mais de 0.5 gols", stake: 50, odd: 1.4, eventStartAt: horasAtras(25), reason: "TEMPO_PARCIAL", explanation: "só há o placar final, sem o do 1º tempo", homeScore: 1, awayScore: 0 },
  { betId: 204, game: "Santos x Sport", market: "Escanteios asiáticos +9", stake: 35, odd: 1.9, eventStartAt: horasAtras(30), reason: "MERCADO_NAO_RECONHECIDO", explanation: "mercado não reconhecido", homeScore: 0, awayScore: 0 },
  { betId: 205, game: "Lakers x Celtics", market: "LeBron James mais de 25.5 pontos", stake: 40, odd: 1.83, eventStartAt: horasAtras(52), reason: "ESPORTE_FORA_ESCOPO", explanation: "basquete ainda não é conferido pelo bot", homeScore: 112, awayScore: 108 },
  { betId: 206, game: "Fortaleza x Ceará", market: "Fortaleza vence", stake: 60, odd: 1.75, eventStartAt: horasAtras(2), reason: "JOGO_NAO_FINALIZADO", explanation: 'jogo com status "postponed"', homeScore: null, awayScore: null },
  { betId: 207, game: "Benfica x Porto", market: "Ambas marcam: Sim", stake: 25, odd: 1.8, eventStartAt: horasAtras(1), reason: "SEM_PLACAR", explanation: "o placar ainda não chegou", homeScore: null, awayScore: null },
];

function vazia() {
  return new URLSearchParams(window.location.search).get("fila") === "vazia";
}

function fila() {
  if (vazia()) return { pending: 0, overdue: 0, settleable: 0, suggestions: 0, undecided: 0, computed: 0, hasMore: false };
  return {
    pending: suggestions.length + review.length + 12,
    overdue: suggestions.length + review.length,
    settleable: 0,
    suggestions: suggestions.length,
    undecided: review.length,
    computed: 0,
    hasMore: false,
  };
}

function me(): MeResponse {
  const p = plano();
  return {
    id: 1,
    username: "demo",
    email: "demo@trackton.app",
    fullName: "Usuário Demo",
    roleId: 2,
    createdAt: horasAtras(24 * 90),
    plan: {
      plan: p,
      proUntil: p === "pro" ? new Date(Date.now() + 20 * 86_400_000).toISOString() : null,
      features: { csvExport: p === "pro", settlement: p === "pro", tipsPlanilhar: p === "pro" },
      aiDaily: p === "pro" ? null : { used: 1, limit: 5 },
      subscription: p === "pro" ? "authorized" : null,
      price: 19.9,
    },
  };
}

const tira = (ids: number[]) => {
  const fora = new Set(ids);
  suggestions = suggestions.filter((s) => !fora.has(s.betId));
  review = review.filter((r) => !fora.has(r.betId));
};

function responder(metodo: string, caminho: string, corpo: { betIds?: number[] } | undefined): unknown {
  const rota = `${metodo} ${caminho}`;
  switch (rota) {
    case "get users/me": return me();
    case "get settlement/suggestions": return vazia() ? [] : suggestions;
    case "get settlement/review": return vazia() ? [] : review;
    case "get settlement/queue": return fila();
    // Conta nova, como a API devolve: tudo zerado.
    case "get house/metrics":
      return { totalBalance: 0, totalDeposit: 0, totalWithdrawal: 0, consolidatedProfit: 0, negativeHouses: 0, negativeAmount: 0, totalHousesUsed: 0 };
    case "post settlement/compute": return { analyzed: 0, suggested: 0, undecided: 0, hasMore: false };
    case "post settlement/confirm": tira(corpo?.betIds ?? []); return { confirmed: corpo?.betIds?.length ?? 0 };
    case "post settlement/dismiss": tira(corpo?.betIds ?? []); return { dismissed: corpo?.betIds?.length ?? 0 };
    // Liquidar na mão. O desfazer (de volta a Pendente) não traz a aposta de
    // volta no mock: só a tira da lista.
    case "put bets/finalize-multiple": tira(corpo?.betIds ?? []); return { updated: corpo?.betIds?.length ?? 0 };
  }
  return metodo === "get" ? [] : {};
}

export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const caminho = (config.url ?? "").split("?")[0].replace(/^\/+|\/+$/g, "");
  const corpo = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
  // Um respiro de rede, pra o skeleton aparecer e sumir como no real.
  await new Promise((r) => setTimeout(r, 250));
  return {
    data: structuredClone(responder((config.method ?? "get").toLowerCase(), caminho, corpo)),
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}
