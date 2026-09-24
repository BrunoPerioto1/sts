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
  /** @ do Telegram sem o arroba; null se a conta não tem @ ou não está vinculada. */
  telegramUsername?: string | null;
  stake?: string | number | null;
  minPercentFilter?: string | number | null;
  /** Dias sem apostar numa casa até sugerir saque; null = padrão (20). */
  staleHouseDays?: number | null;
  /** Vencimento do acesso (PIX); null = sem prazo. */
  accessUntil?: string | null;
};

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient().users.get<MeResponse>("me");
  return res.data;
}


