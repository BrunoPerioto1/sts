import { apiClient } from "../apiClient";

export type MeResponse = {
  dashboardPreferences?: unknown;
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  roleId: number;
  createdAt?: string | null;
  telegramUserId?: number | null;
  telegramLinkedAt?: string | null;
  stake?: string | number | null;
  minPercentFilter?: string | number | null;
};

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient().users.get<MeResponse>("me");
  return res.data;
}


