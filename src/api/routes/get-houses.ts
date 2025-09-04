import { api } from '../apiClient';

export interface HouseDto {
  houseId: number;
  houseName: string;
  active: boolean;
}

export type FindByIdDto = HouseDto;
export type FindAllHousesDTO = HouseDto;

export interface HouseMetricsDto {
  totalInvested: number;
  currentBalance: number;
  totalProfit: number;
  totalBets: number;
  totalHousesUsed: number;
}

export interface HouseBalanceDto {
  houseId: number;
  houseName: string;
  totalBets: number;
  totalStake: number;
  totalBetProfit: number;
  totalDeposit: number;
  totalWithdrawal: number;
  totalTransactions: number;
  realHouseBalance: number;
  houseBalance: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
}

export interface HouseBalanceFilter {
  houseId?: number;
  houseName?: string;
}

// GET /house/balances
export async function getHouseBalances(params?: HouseBalanceFilter) {
  const response = await api.houses.get<HouseBalanceDto[]>('/balances', { params });
  return response.data;
}

// GET /house/metrics
export async function getHouseMetrics() {
  const response = await api.houses.get<HouseMetricsDto>('/metrics');
  return response.data;
}

// GET /house/{id}
export async function getHouseById(id: number) {
  const response = await api.houses.get<FindByIdDto>(`/${id}`);
  return response.data;
}

// GET /house
export async function getAllHouses() {
  const response = await api.houses.get<FindAllHousesDTO[]>('');
  return response.data;
}
