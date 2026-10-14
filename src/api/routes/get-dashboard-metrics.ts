import { apiClient } from "../apiClient";

export interface DashboardQueryParams {
  house_id?: number;
  startDate?: string;
  endDate?: string;
}

export interface DashboardMetrics {
  totalBets: string | number;
  settledBets: string | number;
  wonBets: string | number;
  lostBets: string | number;
  pendingBets: string | number;
  canceledBets: string | number;
  totalStaked: string | number;
  /** Stake das liquidadas: a base do ROI. */
  settledStake: string | number;
  averageStake: string | number;
  averageOdd: string | number;
  totalProfit: string | number;
  roi: string | number;
  hitRate: string | number;
  /** Aposta liquidada que mais lucrou (>= 0) e a que mais perdeu (<= 0). */
  biggestWin: string | number;
  biggestLoss: string | number;
  /** > 0 vitórias seguidas até a mais recente; < 0 derrotas. */
  streak: number;
  /** Maior queda do lucro acumulado a partir de um pico, em R$ (>= 0). */
  maxDrawdown: number;
}

export async function getDashboardMetrics(params: DashboardQueryParams) {
  const response = await apiClient().dashboard.get<DashboardMetrics>(
    "/dashboard/metrics",
    { params }
  );
  return response.data;
}
