export const API_BASE_URL =
  (import.meta as any)?.env?.VITE_API_URL || "http://localhost:4000";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init && init.headers ? init.headers : {}),
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Request failed ${response.status}: ${text || response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return undefined as unknown as T;
}

// Bets
export type Bet = {
  id: number;
  game: string;
  sport: string;
  market: string;
  stake: number;
  odd: number;
  house_id: number | null;
  casa_nome?: string;
  result_id?: number;
  lucro_calculado?: number;
  bet_time?: string;
  created_at?: string;
  profit?: number;
};

export async function getBets(): Promise<Bet[]> {
  return apiFetch<Bet[]>("/bets");
}

export async function getBetById(id: number): Promise<Bet> {
  return apiFetch<Bet>(`/bets/${id}`);
}

export async function createBet(data: {
  game: string;
  stake: number;
  odd: number;
  house_id?: number;
  market: string;
  sport: string;
  bet_time?: string;
}): Promise<Bet> {
  return apiFetch<Bet>("/bets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBetApi(id: number, data: Partial<Bet>): Promise<Bet> {
  return apiFetch<Bet>(`/bets/${id}` , {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBetApi(id: number): Promise<void> {
  await apiFetch<void>(`/bets/${id}`, { method: "DELETE" });
}

export async function deleteMultipleBetsApi(ids: number[]): Promise<{ success: boolean }>{
  return apiFetch<{ success: boolean }>("/bets/delete-multiple", {
    method: "DELETE",
    body: JSON.stringify({ apostaIds: ids }),
  });
}

export async function finalizeBetApi(id: number, resultId: number): Promise<any> {
  return apiFetch<any>(`/bets/finalize/${id}`, {
    method: "PUT",
    body: JSON.stringify({ resultId }),
  });
}

export async function finalizeMultipleBetsApi(ids: number[], resultId: number): Promise<any> {
  return apiFetch<any>("/bets/finalize-multiple", {
    method: "PUT",
    body: JSON.stringify({ betIds: ids, resultId }),
  });
}

export async function getBetHousesFilter(): Promise<string[]> {
  return apiFetch<string[]>("/bets/houses/list");
}

// Houses
export type House = {
  id: number;
  name: string;
  active: boolean;
};

export async function getHouses(): Promise<House[]> {
  const rows = await apiFetch<any[]>("/house");
  return rows.map((r) => ({ id: Number(r.id), name: r.name, active: Boolean(r.is_active) }));
}

export async function createHouseApi(data: { name: string; active?: boolean }): Promise<any> {
  return apiFetch<any>("/house", { method: "POST", body: JSON.stringify(data) });
}

export async function updateHouseApi(id: number, data: { name?: string; active?: boolean }): Promise<any> {
  return apiFetch<any>(`/house/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteHouseApi(id: number): Promise<any> {
  return apiFetch<any>(`/house/${id}`, { method: "DELETE" });
}

export type HouseBalance = {
  house_id: number;
  house_name: string;
  total_bets: number;
  total_stake: number;
  total_bet_profit: number;
  total_transactions: number;
  house_balance: number;
  real_house_balance: number;
  pending_bets: number;
  won_bets: number;
  lost_bets: number;
};

export async function getAllHousesBalance(): Promise<HouseBalance[]> {
  const rows = await apiFetch<any[]>("/house/balances");
  return rows.map((r) => ({
    house_id: Number(r.house_id),
    house_name: r.house_name,
    total_bets: Number(r.total_bets ?? 0),
    total_stake: Number(r.total_stake ?? 0),
    total_bet_profit: Number(r.total_bet_profit ?? 0),
    total_transactions: Number(r.total_transactions ?? 0),
    house_balance: Number(r.house_balance ?? 0),
    real_house_balance: Number(r.real_house_balance ?? 0),
    pending_bets: Number(r.pending_bets ?? 0),
    won_bets: Number(r.won_bets ?? 0),
    lost_bets: Number(r.lost_bets ?? 0),
  }));
}

export async function getHouseBalance(id: number): Promise<HouseBalance> {
  const r = await apiFetch<any>(`/house/${id}/balance`);
  return {
    house_id: Number(r.house_id),
    house_name: r.house_name,
    total_bets: Number(r.total_bets ?? 0),
    total_stake: Number(r.total_stake ?? 0),
    total_bet_profit: Number(r.total_bet_profit ?? 0),
    total_transactions: Number(r.total_transactions ?? 0),
    house_balance: Number(r.house_balance ?? 0),
    real_house_balance: Number(r.real_house_balance ?? 0),
    pending_bets: Number(r.pending_bets ?? 0),
    won_bets: Number(r.won_bets ?? 0),
    lost_bets: Number(r.lost_bets ?? 0),
  };
}

export type HouseTransaction = {
  id: number;
  house_id: number;
  casa_nome: string;
  transaction_type_id: number; // 1 Depósito, 2 Saque, 3 Ajuste (quando disponível)
  transaction_type_name: string;
  valor: number;
  descricao: string;
  created_at: string;
  updated_at: string;
};

export async function createTransactionApi(data: { house_id: number; transaction_type_id: number; valor: number; descricao: string }): Promise<any> {
  return apiFetch<any>("/house/transaction", { method: "POST", body: JSON.stringify(data) });
}

export async function getAllTransactions(): Promise<HouseTransaction[]> {
  const rows = await apiFetch<any[]>("/house/transactions");
  return rows.map((r) => ({
    id: Number(r.id),
    house_id: Number(r.house_id),
    casa_nome: r.house_name ?? "",
    // Backend devolve nome; inferimos id pelo nome quando possível
    transaction_type_id: r.transaction_type === "Depósito" || r.transaction_type === "DEPOSIT" ? 1 : r.transaction_type === "Saque" || r.transaction_type === "WITHDRAWAL" ? 2 : 3,
    transaction_type_name: r.transaction_type ?? "",
    valor: Number(r.value ?? 0),
    descricao: r.description ?? "",
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getTransactionsByHouse(id: number): Promise<HouseTransaction[]> {
  const rows = await apiFetch<any[]>(`/house/${id}/transactions`);
  return rows.map((r) => ({
    id: Number(r.id),
    house_id: Number(r.house_id),
    casa_nome: "",
    transaction_type_id: r.transaction_type === "Depósito" || r.transaction_type === "DEPOSIT" ? 1 : r.transaction_type === "Saque" || r.transaction_type === "WITHDRAWAL" ? 2 : 3,
    transaction_type_name: r.transaction_type ?? "",
    valor: Number(r.value ?? 0),
    descricao: r.description ?? "",
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getHouseHistory(id: number): Promise<any[]> {
  return apiFetch<any[]>(`/house/${id}/history`);
}

// Dashboard
export type DashboardMetrics = {
  totalApostas: number;
  apostasGanhas: number;
  apostasPerdidas: number;
  apostasPendentes: number;
  apostasCanceladas: number;
  totalInvestido: number;
  totalRetorno: number;
  lucroTotal: number;
  roi: number;
  taxaAcerto: number;
};

export async function getDashboardMetrics(params?: { house_id?: number; startDate?: string; endDate?: string }): Promise<DashboardMetrics> {
  const sp = new URLSearchParams();
  if (params?.house_id) sp.set("house_id", String(params.house_id));
  if (params?.startDate) sp.set("startDate", new Date(params.startDate).toISOString());
  if (params?.endDate) sp.set("endDate", new Date(params.endDate).toISOString());
  const qs = sp.toString() ? `?${sp.toString()}` : "";
  return apiFetch<DashboardMetrics>(`/dashboard/metrics${qs}`);
}

export async function getDashboardChartData(params?: { house_id?: number; startDate?: string; endDate?: string }): Promise<{ date: string; value: number }[]> {
  const sp = new URLSearchParams();
  if (params?.house_id) sp.set("house_id", String(params.house_id));
  if (params?.startDate) sp.set("startDate", new Date(params.startDate).toISOString());
  if (params?.endDate) sp.set("endDate", new Date(params.endDate).toISOString());
  const qs = sp.toString() ? `?${sp.toString()}` : "";
  return apiFetch(`/dashboard/chart-data${qs}`);
}

export async function getDashboardDailySummary(params?: { house_id?: number; startDate?: string; endDate?: string }): Promise<{ date: string; totalApostas: number; lucroDia: number }[]> {
  const sp = new URLSearchParams();
  if (params?.house_id) sp.set("house_id", String(params.house_id));
  if (params?.startDate) sp.set("startDate", new Date(params.startDate).toISOString());
  if (params?.endDate) sp.set("endDate", new Date(params.endDate).toISOString());
  const qs = sp.toString() ? `?${sp.toString()}` : "";
  return apiFetch(`/dashboard/daily-summary${qs}`);
}
