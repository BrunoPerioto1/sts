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
  usersByRole: { admin: number; moderator: number; user: number };
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
  hasTelegram: boolean;
  betCount: number;
};

export type UpdateAdminUserParams = {
  roleId?: number;
  unlock?: boolean;
  unlinkTelegram?: boolean;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiClient().admin.get<AdminOverview>("overview");
  return res.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await apiClient().admin.get<AdminUser[]>("users");
  return res.data;
}

export async function patchAdminUser(id: number, data: UpdateAdminUserParams): Promise<AdminUser> {
  const res = await apiClient().admin.patch<AdminUser>(`users/${id}`, data);
  return res.data;
}
