import { api } from '../apiClient';
import { unwrap } from '../request';

export interface CreateBetDto {
  game: string;
  stake: number;
  odd: number;
  houseId?: number;
  market: string;
  sport: string;
  betTime?: string;
  // Tip pendente que esta aposta liquida. Quando vai preenchido, a tip sai da
  // fila de pendências e o resultado volta pro canal.
  tipId?: number;
}

export function createBet(bet: CreateBetDto) {
  return unwrap(api.bets.post('', bet));
}

export interface UpdateApostaDto {
  game?: string;
  stake?: number;
  odd?: number;
  houseId?: number;
  market?: string;
  sport?: string;
  betTime?: string;
}

export function updateBet(id: number, bet: UpdateApostaDto) {
  return unwrap(api.bets.put(`/${id}`, bet));
}
export interface BetItem {
  id: number;
  game: string;
  stake: string | number;
  odd: string | number;
  houseId: number;
  market: string;
  sport: string;
  sportId?: number | null;
  profit: string | number | null;
  cashoutValue?: string | number | null;
  betTime: string | Date;
  eventStartAt?: string | Date | null;
  resultId: number;
  resultName: string;
  houseName?: string;
}

export interface BetFilterDto {
  betId?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  resultId?: number;
  resultIds?: number[];
  houseIds?: number[];
  sportIds?: number[];
  q?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedBetsResponseDto {
  totalPages?: number;
  total?: number;
  data?: BetItem[];
}

export async function getBets(params?: BetFilterDto) {
  const { startDate, endDate, resultIds, houseIds, sportIds, ...rest } = params ?? {};
  const queryParams: Record<string, string | number | undefined> = { ...rest };
  if (startDate) queryParams.startDate = new Date(startDate).toISOString();
  if (endDate) queryParams.endDate = new Date(endDate).toISOString();
  // API espera lista separada por vírgula (independe de como axios serializaria um array).
  if (resultIds?.length) queryParams.resultIds = resultIds.join(',');
  if (houseIds?.length) queryParams.houseIds = houseIds.join(',');
  if (sportIds?.length) queryParams.sportIds = sportIds.join(',');

  const response = await api.bets.get<PaginatedBetsResponseDto>('', { params: queryParams });
  return response.data;
}


// O enum mora em result-id.ts (sem import de HTTP, pra ser testável com
// `node --test`). Continua saindo daqui pra não mexer nos imports existentes.
export { ResultIdEnum } from './result-id';
import { ResultIdEnum } from './result-id';

export interface FinalizarApostaDto {
  resultId: ResultIdEnum;
  cashoutValue?: number;
}

export interface FinalizarMultiplasDto {
  betIds: number[];
  resultId: ResultIdEnum;
}

// Finalizar aposta individual: /bets/finalize/{id}
export function finalizeBet(id: number, data: FinalizarApostaDto) {
  return unwrap(api.bets.put(`/finalize/${id}`, data));
}

// Finalizar múltiplas apostas: /bets/finalize-multiple
export function finalizeMultipleBets(data: FinalizarMultiplasDto) {
  return unwrap(api.bets.put('/finalize-multiple', data));
}


// Deletar múltiplas apostas: /bets/delete-multiple
export function deleteMultipleBets(betIds: number[]) {
  return unwrap(api.bets.delete('/delete-multiple', { data: { betIds } }));
}


// Deletar aposta individual: /bets/{id}
export function deleteBet(id: number) {
  return unwrap(api.bets.delete(`/${id}`));
}

export interface SportDto {
  id: number;
  name: string;
}

// Esportes normalizados (tabela `sports`). Lista global, cacheada na CDN.
export async function getSports() {
  const response = await api.bets.get<SportDto[]>('/sports');
  return response.data;
}
