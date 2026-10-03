import { apiClient } from "../apiClient";

export type Billing = {
  pixKey: string | null;
  price: number | null;
  /** Só com token: identificador do PIX desta conta (vai junto no copia-e-cola). */
  txid?: string | null;
  /** Só com token: PIX copia-e-cola com valor e txid da conta. */
  pixCode?: string | null;
  /** new = nunca ativada; expired = acesso venceu. */
  status?: "new" | "expired" | null;
  /** Quando a conta apertou "Já paguei"; null = não avisou. */
  paymentClaimedAt?: string | null;
};

// Rota pública: a tela de acesso vencido chega aqui sem token válido. O
// payToken (da resposta 402) é o que libera o PIX desta conta.
export async function getBilling(token?: string): Promise<Billing> {
  const res = await apiClient().dashboard.get<Billing>("access/billing", { params: token ? { token } : undefined });
  return res.data;
}

/** PIX da conta logada (aviso de vencimento próximo): a sessão identifica. */
export async function getMyBilling(): Promise<Billing> {
  const res = await apiClient().dashboard.get<Billing>("access/billing/me");
  return res.data;
}

export async function postMyPaymentClaim(): Promise<{ result: "notified" | "already" }> {
  const res = await apiClient().dashboard.post<{ result: "notified" | "already" }>("access/paid/me");
  return res.data;
}

/** "Já paguei": avisa o admin no Telegram. Não libera nada sozinho. */
export async function postPaymentClaim(token: string): Promise<{ result: "notified" | "already" }> {
  const res = await apiClient().dashboard.post<{ result: "notified" | "already" }>("access/paid", { token });
  return res.data;
}
