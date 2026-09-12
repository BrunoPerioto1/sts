import { api } from '../apiClient';
import { unwrap } from '../request';

export type TipStatus = 'pending' | 'planilhada' | 'caiu';

export interface TipItem {
  id: number;
  createdAt: string;
  status: TipStatus;
  betId: number | null;
  house: string | null;
  /** Casa cadastrada que o nome da tip casou, quando reconhecida. */
  houseId: number | null;
  game: string | null;
  sport: string | null;
  /** Esporte cadastrado que o texto da tip casou, quando reconhecido. */
  sportId: number | null;
  market: string | null;
  odd: number | null;
  percent: number | null;
  limit: number | null;
  recommendedStake: number | null;
  potentialProfit: number | null;
  link: string | null;
  /** "Odd mudou? ... calcule quanto vale" — calculador de odd justa. */
  calcLink: string | null;
  /** Início do jogo, do cache de eventos do provider. Null quando o confronto não foi reconhecido. */
  eventStartAt: string | null;
  isAviso: boolean;
  text: string;
}

export interface TipsSummary {
  pending: number;
  planilhadas: number;
  caidas: number;
  pendingStake: number;
}

export interface TipsListResponse {
  data: TipItem[];
  summary: TipsSummary;
  total: number;
  page: number;
  perPage: number;
}

export async function getTips(
  params: {
    status?: TipStatus;
    q?: string;
    houseIds?: number[];
    sportIds?: number[];
    page?: number;
    perPage?: number;
  } = {},
) {
  const { houseIds, sportIds, ...rest } = params;
  const queryParams: Record<string, string | number | undefined> = { ...rest };
  // Mesma convenção do /bets: lista separada por vírgula, independente de
  // como o axios serializaria um array.
  if (houseIds?.length) queryParams.houseIds = houseIds.join(',');
  if (sportIds?.length) queryParams.sportIds = sportIds.join(',');

  const response = await api.tips.get<TipsListResponse>('', { params: queryParams });
  return response.data;
}

export interface PlanilharTipDto {
  stake?: number;
  odd?: number;
  houseId?: number;
}

export function planilharTip(id: number, overrides: PlanilharTipDto = {}) {
  return unwrap(api.tips.post(`/${id}/planilhar`, overrides));
}

export function dismissTip(id: number) {
  return unwrap(api.tips.post(`/${id}/dismiss`));
}

export function undismissTip(id: number) {
  return unwrap(api.tips.delete(`/${id}/dismiss`));
}
