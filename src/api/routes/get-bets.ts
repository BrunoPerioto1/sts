import { api } from '../apiClient';

export interface CreateBetDto {
  game: string;
  stake: number;
  odd: number;
  houseId?: number;
  market: string;
  sport: string;
  betTime?: string;
}

export async function createBet(bet: CreateBetDto) {
  try {
    const response = await api.bets.post('', bet);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
  
}

export interface UpdateApostaDto {
  game?: string;
  stake?: number;
  odd?: number;
  house?: string;
  houseId?: number;
  market?: string;
  sport?: string;
  betTime?: string;
}

export async function updateBet(id: number, bet: UpdateApostaDto) {
  try {
    const response = await api.bets.put(`/${id}`, bet);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}
export interface BetItem {
  id: number;
  game: string;
  stake: string | number;
  odd: string | number;
  houseId: number;
  market: string;
  sport: string;
  profit: string | number | null;
  cashoutValue?: string | number | null;
  betTime: string | Date;
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
  const queryParams: Record<string, any> = { ...params };
  if (queryParams.startDate) queryParams.startDate = new Date(queryParams.startDate).toISOString();
  if (queryParams.endDate) queryParams.endDate = new Date(queryParams.endDate).toISOString();
  // API espera lista separada por vírgula (independe de como axios serializaria um array).
  if (queryParams.resultIds?.length) queryParams.resultIds = queryParams.resultIds.join(',');
  else delete queryParams.resultIds;
  if (queryParams.houseIds?.length) queryParams.houseIds = queryParams.houseIds.join(',');
  else delete queryParams.houseIds;

  const response = await api.bets.get<PaginatedBetsResponseDto>('', { params: queryParams });
  return response.data;
}


export enum ResultIdEnum {
  WON = 1,
  LOST = 2,
  CANCELED = 3,
  HALF_WON = 4,
  HALF_LOST = 5,
  CASHOUT = 6,
  PENDING = 9
}

export interface FinalizarApostaDto {
  resultId: ResultIdEnum;
  cashoutValue?: number;
}

export interface FinalizarMultiplasDto {
  betIds: number[];
  resultId: ResultIdEnum;
}

// Finalizar aposta individual: /bets/finalize/{id}
export async function finalizeBet(id: number, data: FinalizarApostaDto) {
  try {
    const response = await api.bets.put(`/finalize/${id}`, data);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}

// Finalizar múltiplas apostas: /bets/finalize-multiple
export async function finalizeMultipleBets(data: FinalizarMultiplasDto) {
  try {
    const response = await api.bets.put('/finalize-multiple', data);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}


// Deletar múltiplas apostas: /bets/delete-multiple
export async function deleteMultipleBets(betIds: number[]) {
  try {
    const response = await api.bets.delete('/delete-multiple', { data: { betIds } });
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}


// Deletar aposta individual: /bets/{id}
export async function deleteBet(id: number) {
  try {
    const response = await api.bets.delete(`/${id}`);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}


