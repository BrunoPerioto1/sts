import { api } from '../apiClient';
import { unwrap } from '../request';

export type TipStatus = 'pending' | 'planilhada' | 'caiu';

export interface TipItem {
  id: number;
  createdAt: string;
  status: TipStatus;
  betId: number | null;
  house: string | null;
  game: string | null;
  sport: string | null;
  market: string | null;
  odd: number | null;
  percent: number | null;
  limit: number | null;
  recommendedStake: number | null;
  potentialProfit: number | null;
  link: string | null;
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
  params: { status?: TipStatus; q?: string; page?: number; perPage?: number } = {},
) {
  const response = await api.tips.get<TipsListResponse>('', { params });
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
