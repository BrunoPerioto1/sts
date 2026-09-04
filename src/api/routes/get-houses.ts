import { api } from '../apiClient';

export interface HouseDto {
  id: number;
  name: string;
  active: boolean;
}

export type FindAllHousesDTO = HouseDto;

export interface HouseMetricsDto {
  totalBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  consolidatedProfit: number;
  negativeHouses: number;
  totalHousesUsed: number;
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
  lastMovementAt: string | null;
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

// GET /house
export async function getAllHouses() {
  const response = await api.houses.get<FindAllHousesDTO[]>('/all');
  return response.data;
}
