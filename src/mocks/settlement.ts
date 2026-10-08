// Mock da Conferência, pra validar o front sem depender de placar real.
// Liga com VITE_MOCK_CONFERIR=1 no .env (só no `npm run dev`: o build de
// produção ignora). Com ele ligado NADA da Conferência vai pra rede —
// planilhar e descartar mexem só nesta memória, nunca no lucro de verdade.
// F5 volta tudo pro estado inicial.
import { ResultIdEnum } from "@/api/routes/get-bets";
import type {
  ComputeSummary,
  SettlementQueue,
  SettlementReviewItem,
  SettlementSuggestion,
} from "@/api/routes/get-settlement";

export const MOCK_CONFERIR =
  import.meta.env.DEV && import.meta.env.VITE_MOCK_CONFERIR === "1";

const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const delay = <T>(value: T, ms = 350) => new Promise<T>((r) => setTimeout(() => r(value), ms));

// Cobre o que a tela precisa mostrar: ganhou / perdeu / anulada, placar e sem
// placar, hoje / ontem / dias atrás / sem horário, texto longo e valores altos.
const SUGESTOES_INICIAIS: SettlementSuggestion[] = [
  {
    betId: 900001, game: "EC Bahia x SE Palmeiras", market: "SE Palmeiras -1 - Handicap asiático",
    stake: 23.01, odd: 2.03, eventStartAt: horasAtras(3), suggestedResultId: ResultIdEnum.WON,
    explanation: "Palmeiras venceu por 3x1: cobriu o -1.", homeScore: 1, awayScore: 3,
  },
  {
    betId: 900002, game: "Brooklyn Nets x Charlotte Hornets", market: "Charlotte Hornets - Vencedor",
    stake: 46.41, odd: 1.61, eventStartAt: horasAtras(5), suggestedResultId: ResultIdEnum.LOST,
    explanation: "Nets venceram por 112x104.", homeScore: 112, awayScore: 104,
  },
  {
    betId: 900003, game: "Flamengo x Grêmio", market: "Mais de 2.5 gols",
    stake: 150, odd: 1.85, eventStartAt: horasAtras(26), suggestedResultId: ResultIdEnum.WON,
    explanation: "3 gols no jogo, mais de 2.5.", homeScore: 2, awayScore: 1,
  },
  {
    betId: 900004, game: "Renata Zarazua x Darya Astakhova", market: "Renata Zarazua -4 - Handicap de games",
    stake: 112, odd: 2.27, eventStartAt: horasAtras(28), suggestedResultId: ResultIdEnum.CANCELED,
    explanation: "Astakhova abandonou no 1º set: aposta anulada pela regra da casa.", homeScore: null, awayScore: null,
  },
  {
    betId: 900005, game: "Timberwolves x Pacers", market: "Timberwolves - Vencedor",
    stake: 144, odd: 1.53, eventStartAt: horasAtras(30), suggestedResultId: ResultIdEnum.WON,
    explanation: "Timberwolves venceram por 121x109.", homeScore: 121, awayScore: 109,
  },
  {
    betId: 900006, game: "Timrå IK x Frölunda HC", market: "Frölunda HC - Vencedor (tempo regulamentar, sem prorrogação)",
    stake: 124.8, odd: 1.63, eventStartAt: horasAtras(76), suggestedResultId: ResultIdEnum.LOST,
    explanation: "Empate em 2x2 no tempo regulamentar: Frölunda não venceu nos 60 minutos.", homeScore: 2, awayScore: 2,
  },
  {
    betId: 900007, game: "SAW x Sangal", market: "Sangal - Vencedor",
    stake: 25.35, odd: 1.895, eventStartAt: null, suggestedResultId: ResultIdEnum.WON,
    explanation: "Sangal venceu a série por 2x0.", homeScore: 0, awayScore: 2,
  },
  {
    betId: 900008, game: "Manchester City x Arsenal", market: "Ambas marcam - Sim",
    stake: 999, odd: 1.72, eventStartAt: horasAtras(100), suggestedResultId: ResultIdEnum.LOST,
    explanation: "1x0: só o City marcou.", homeScore: 1, awayScore: 0,
  },
];

const REVIEW_INICIAL: SettlementReviewItem[] = [
  {
    betId: 900101, game: "Lakers x Celtics + Heat x Knicks", market: "Dupla - Lakers e Heat vencedores",
    stake: "80.00", odd: "3.40", eventStartAt: horasAtras(20), reason: "PERNA_ANULADA",
    explanation: "odd ajustada não calculada: uma perna foi anulada",
  },
  {
    betId: 900102, game: "Corinthians x Santos", market: "Escanteios asiáticos +9.5",
    stake: "40.00", odd: "1.90", eventStartAt: horasAtras(50), reason: "MERCADO_DESCONHECIDO",
    explanation: "mercado de escanteios ainda não é lido pelo bot",
  },
];

let sugestoes = [...SUGESTOES_INICIAIS];
const review = [...REVIEW_INICIAL];
// Um lote "a mais" na fila: o primeiro compute/queue mostra o aviso de fila
// restante, o "Calcular próximo lote" esvazia.
let hasMore = true;

function queue(): SettlementQueue {
  return {
    pending: sugestoes.length + review.length + 6,
    overdue: sugestoes.length + review.length,
    settleable: hasMore ? 6 : 0,
    suggestions: sugestoes.length,
    undecided: review.length,
    computed: 0,
    hasMore,
  };
}

export const settlementMock = {
  getSuggestions: () => delay([...sugestoes]),
  getQueue: () => delay(queue(), 200),
  getReview: () => delay([...review]),
  compute: (): Promise<ComputeSummary> => {
    const veio = hasMore;
    hasMore = false;
    if (veio) {
      sugestoes = [
        ...sugestoes,
        {
          betId: 900009, game: "Real Madrid x Barcelona", market: "Real Madrid - Vencedor",
          stake: 60, odd: 2.4, eventStartAt: horasAtras(2), suggestedResultId: ResultIdEnum.WON,
          explanation: "Real venceu por 2x1.", homeScore: 2, awayScore: 1,
        },
      ];
    }
    // Leva um tempo de verdade: dá pra ver o "Lendo os placares".
    return delay({ analyzed: veio ? 6 : 0, suggested: veio ? 1 : 0, undecided: 0, hasMore: false }, 1500);
  },
  confirm: (betIds: number[]) => {
    const antes = sugestoes.length;
    sugestoes = sugestoes.filter((s) => !betIds.includes(s.betId));
    return delay({ confirmed: antes - sugestoes.length });
  },
  dismiss: (betIds: number[]) => {
    const antes = sugestoes.length;
    sugestoes = sugestoes.filter((s) => !betIds.includes(s.betId));
    return delay({ dismissed: antes - sugestoes.length });
  },
};
