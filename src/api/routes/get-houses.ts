import { api } from '../apiClient';

export interface HouseDto {
  id: number;
  name: string;
  active: boolean;
  /** Versão do avatar guardado no banco; null = sem logo (usa as iniciais). */
  logoVersion?: number | null;
}

// <img> não passa pelo axios: monta a URL absoluta. O ?v= muda quando o logo
// é trocado, e a API serve com cache imutável.
export function houseLogoUrl(id: number, version: number): string {
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  return `${base}/house/${id}/logo?v=${version}`;
}

export type FindAllHousesDTO = HouseDto;

export interface HouseMetricsDto {
  totalBalance: number;
  totalDeposit: number;
  totalWithdrawal: number;
  consolidatedProfit: number;
  negativeHouses: number;
  /** Soma dos saldos reais negativos (valor <= 0) — o "a conferir". */
  negativeAmount: number;
  totalHousesUsed: number;
}

export interface HouseBalanceDto {
  houseId: number;
  houseName: string;
  /** Site da casa (.bet.br, federal); null = sem link cadastrado. */
  websiteUrl: string | null;
  totalBets: string | number;
  settledBets: string | number;
  totalStake: string | number;
  /** Stake das liquidadas: a base do ROI. */
  settledStake: string | number;
  /** Stake das pendentes. A casa já tirou isso do saldo que ela mostra. */
  openStake: string | number;
  /** Lucro / stake liquidado (fração: 0.12 = 12%). */
  roi: string | number;
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
  /** Hora da aposta mais recente na casa; null = nunca apostou nela. */
  lastBetAt: string | null;
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
