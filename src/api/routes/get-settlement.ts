import { api } from '../apiClient';
import { unwrap } from '../request';
import { ResultIdEnum } from './get-bets';

export interface SettlementSuggestion {
  betId: number;
  game: string;
  market: string;
  stake: number;
  odd: number;
  eventStartAt: string | null;
  /** Resultado proposto. Só vira oficial depois que o usuário confirma. */
  suggestedResultId: ResultIdEnum;
  /** Como o sistema chegou nesse resultado: "3 gols no jogo, mais de 2.5". */
  explanation: string;
  homeScore: number | null;
  awayScore: number | null;
}

export interface ComputeSummary {
  /** Apostas com placar que entraram neste lote. */
  analyzed: number;
  suggested: number;
  /** Tinham placar, mas o bot não soube resolver: seguem pendentes. */
  undecided: number;
  /**
   * O backend recalcula em lotes. `true` significa que o lote encheu e ainda
   * sobrou aposta esperando — dá pra chamar compute de novo pro resto.
   */
  hasMore: boolean;
}

/** Recalcula as sugestões. Não altera resultado nenhum. */
export function computeSettlement() {
  return unwrap<ComputeSummary>(api.settlement.post('compute'));
}

export function getSettlementSuggestions() {
  return unwrap<SettlementSuggestion[]>(api.settlement.get('suggestions'));
}

/** Planilha as sugestões aceitas — é o que finalmente mexe no lucro. */
export function confirmSettlement(betIds: number[]) {
  return unwrap<{ confirmed: number }>(
    api.settlement.post('confirm', { betIds }),
  );
}

export function dismissSettlement(betIds: number[]) {
  return unwrap<{ dismissed: number }>(
    api.settlement.post('dismiss', { betIds }),
  );
}

/**
 * Contadores da fila. Vêm do banco, não da resposta do último compute — por
 * isso sobrevivem a um F5, que era o que fazia os avisos de fila restante e de
 * aposta sem proposta sumirem da tela.
 */
export interface SettlementQueue {
  /** Apostas ainda pendentes do usuário. */
  pending: number;
  /** Pendentes com placar esperando cálculo: o que entra no próximo lote. */
  settleable: number;
  /** Propostas aguardando confirmação. */
  suggestions: number;
  /** Analisadas que o bot não soube resolver. Seguem pendentes. */
  undecided: number;
  hasMore: boolean;
}

export function getSettlementQueue() {
  return unwrap<SettlementQueue>(api.settlement.get('queue'));
}
