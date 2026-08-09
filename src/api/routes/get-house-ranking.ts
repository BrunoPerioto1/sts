import { api } from "../apiClient";

export interface HouseRankingItem {
  houseId: number;
  houseName: string;
  settledBets: number;
  wonBets: number;
  hitRate: number;
  avgOdd: number;
  avgStake: number;
  volume: number;
  profit: number;
  roi: number;
}

export interface HouseRankingParams {
  startDate?: string;
  endDate?: string;
  minBets?: number;
}

export async function getHouseRanking(params: HouseRankingParams) {
  const response = await api.houses.get<HouseRankingItem[]>("/ranking", { params });
  return response.data;
}
