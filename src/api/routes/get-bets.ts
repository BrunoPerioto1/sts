import { api } from '../apiClient';

export interface BetResultType {
  id: number;
  name: string;
}

export async function getBetResultTypes() {
  const response = await api.bets.get<BetResultType[]>('/result-types');
  return response.data;
}

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
    const response = await api.bets.post('/bets', bet);
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
    const response = await api.bets.put(`/bets/${id}`, bet);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}
export interface BetItem {
  id: number;
  game: string;
  stake: number;
  odd: number;
  houseId: number;
  market: string;
  sport: string;
  profit: number | null;
  betTime: Date;
  resultId: number;
  resultName: string;
}

export interface BetFilterDto {
  betId?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  resultId?: number;
  market?: string;
}

export async function getBets(params?: BetFilterDto) {
  const queryParams = { ...params };
  if (queryParams.startDate) queryParams.startDate = new Date(queryParams.startDate).toISOString();
  if (queryParams.endDate) queryParams.endDate = new Date(queryParams.endDate).toISOString();

  const response = await api.bets.get<BetItem[]>('/bets', { params: queryParams });
  return response.data;
}


export enum ResultIdEnum {
  WON = 1,
  LOST = 2,
  CANCELED = 3,
  PENDING = 9
}

export interface FinalizarApostaDto {
  resultId: ResultIdEnum;
}

export interface FinalizarMultiplasDto {
  betIds: number[];
  resultId: ResultIdEnum;
}

// Finalizar aposta individual: /bets/finalize/{id}
export async function finalizeBet(id: number, data: FinalizarApostaDto) {
  try {
    const response = await api.bets.put(`/bets/finalize/${id}`, data);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}

// Finalizar múltiplas apostas: /bets/finalize-multiple
export async function finalizeMultipleBets(data: FinalizarMultiplasDto) {
  try {
    const response = await api.bets.put('/bets/finalize-multiple', data);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}

// Deletar aposta individual: /bets/{id}
export async function deleteBet(id: number) {
  try {
    const response = await api.bets.delete(`/bets/${id}`);
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}

// Deletar múltiplas apostas: /bets/delete-multiple
export async function deleteMultipleBets(betIds: number[]) {
  try {
    const response = await api.bets.delete('/bets/delete-multiple', { data: { betIds } });
    return response.data;
  } catch (e: any) {
    throw new Error(`${e?.message || e}`);
  }
}
