import { apiClient } from "../apiClient";

export type Billing = { pixKey: string | null; price: number | null };

// Rota pública: a tela de acesso vencido chega aqui sem token válido.
export async function getBilling(): Promise<Billing> {
  const res = await apiClient().dashboard.get<Billing>("access/billing");
  return res.data;
}
