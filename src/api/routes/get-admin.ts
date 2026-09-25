import { apiClient } from "../apiClient";

export type UndeliveredTip = {
  id: number;
  createdAt: string;
  percent: number | null;
  text: string;
  // Passaria pelo filtro de % de quem recebe DM hoje — ou seja, deveria ter
  // chegado em alguém. As outras são o filtro funcionando, não falha.
  expectedDelivery: boolean;
};

export type AdminOverview = {
  lastTipAt: string | null;
  lastDeliveryAt: string | null;
  lastEventFetchAt: string | null;
  lastResultFetchAt: string | null;
  undeliveredTips: UndeliveredTip[];
  undeliveredExpected: number;
  startedEventsWithoutResult: number;
  pendingBetsWithoutSuggestion: number;
  undecidedSuggestions: number;
  suggestionsAwaitingUser: number;
  usersByRole: { admin: number; user: number };
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  roleId: number;
  isActive: boolean | null;
  lastLogin: string | null;
  createdAt: string | null;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  telegramLinkedAt: string | null;
  accessUntil: string | null;
  /** Tirado do grupo Tips pelo painel; null = dentro ou convidado de volta. */
  tipsGroupRemovedAt: string | null;
  hasTelegram: boolean;
  betCount: number;
};

export type AdminHouse = {
  id: number;
  name: string;
  isActive: boolean;
  aliases: string[];
  websiteUrl: string | null;
  betCount: number;
};

// websiteUrl: só .bet.br (o servidor recusa o resto); "" ou null apaga o link.
export type CreateAdminHouseParams = { name: string; aliases?: string[]; websiteUrl?: string | null };
export type UpdateAdminHouseParams = { name?: string; aliases?: string[]; isActive?: boolean; websiteUrl?: string | null };

export type UpdateAdminUserParams = {
  roleId?: number;
  unlock?: boolean;
  unlinkTelegram?: boolean;
  /** false desativa a conta (sem login, sem API, sem tips); true reativa. */
  isActive?: boolean;
  extendDays?: number;
  /** Vencimento exato (ISO com fuso); null = sem prazo. */
  accessUntil?: string | null;
  /** remove: tira do grupo Tips quem está sem acesso. invite: repete o convite de quem voltou e ficou de fora. */
  tipsGroup?: "remove" | "invite";
};

/**
 * A linha atualizada, mais o que houve com o convite do grupo Tips quando o
 * acesso voltou. Ausente = nada a mandar (continuava no grupo).
 */
export type UpdatedAdminUser = AdminUser & { groupInvite?: "sent" | "failed" };

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiClient().admin.get<AdminOverview>("overview");
  return res.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await apiClient().admin.get<AdminUser[]>("users");
  return res.data;
}

export async function patchAdminUser(id: number, data: UpdateAdminUserParams): Promise<UpdatedAdminUser> {
  const res = await apiClient().admin.patch<UpdatedAdminUser>(`users/${id}`, data);
  return res.data;
}

export async function getAdminHouses(): Promise<AdminHouse[]> {
  const res = await apiClient().admin.get<AdminHouse[]>("houses");
  return res.data;
}

export async function postAdminHouse(data: CreateAdminHouseParams): Promise<AdminHouse> {
  const res = await apiClient().admin.post<AdminHouse>("houses", data);
  return res.data;
}

export async function patchAdminHouse(id: number, data: UpdateAdminHouseParams): Promise<AdminHouse> {
  const res = await apiClient().admin.patch<AdminHouse>(`houses/${id}`, data);
  return res.data;
}
