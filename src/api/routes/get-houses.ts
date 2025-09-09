import { api } from '../apiClient';

export interface HouseDto {
  houseId: number;
  name: string;
  active: boolean;
}

export type FindByIdDto = HouseDto;
export type FindAllHousesDTO = HouseDto;

export interface HouseMetricsDto {
  totalInvested: string | number;
  currentBalance: string | number;
  totalProfit: string | number;
  totalBets: string | number;
  totalHousesUsed: string | number;
}

export interface HouseBalanceDto {
  houseId: number;
  houseName: string;
  totalBets: string | number;
  totalStake: string | number;
  totalBetProfit: string | number;
  totalDeposit: string | number;
  totalWithdrawal: string | number;
  totalTransactions: string | number;
  realHouseBalance: string | number;
  houseBalance: string | number;
  pendingBets: string | number;
  wonBets: string | number;
  lostBets: string | number;
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
  const response = await api.houses.get<FindAllHousesDTO[]>('/all');
  return response.data;
}
