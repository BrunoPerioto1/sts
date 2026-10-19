import { apiClient } from "../apiClient";

export type ProFeature = "csvExport" | "settlement" | "tipsPlanilhar";

/** Status da assinatura no Mercado Pago; null = nunca assinou. */
export type SubscriptionStatus = "pending" | "authorized" | "paused" | "cancelled";

/** Plano da conta (backend: src/users/plan.ts). Quem barra é o backend; a tela só lê. */
export type PlanSummary = {
  plan: "free" | "pro";
  /** Até quando vai o Pro; null no Grátis ou no Pro sem prazo. */
  proUntil: string | null;
  features: Record<ProFeature, boolean>;
  /** Leituras por IA (print e áudio) de hoje no Grátis; null no Pro (sem limite). */
  aiDaily: { used: number; limit: number } | null;
  subscription: SubscriptionStatus | null;
  /** Mensalidade do Pro em reais. */
  price: number;
};

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
  /** Pro até; vencido = Grátis; null = Pro sem prazo. */
  accessUntil?: string | null;
  /** Só no GET /users/me: o PATCH devolve a conta sem ele. */
  plan?: PlanSummary;
};

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient().users.get<MeResponse>("me");
  return res.data;
}
