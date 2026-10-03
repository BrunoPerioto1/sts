import { apiClient } from "../apiClient";

// Apaga a conta e, junto, apostas, saldos e movimentações — sem volta. Pede a
// senha: só o token não basta pra uma ação sem desfazer.
export async function deleteMe(password: string): Promise<{ success: boolean }> {
  const res = await apiClient().users.delete<{ success: boolean }>("me", { data: { password } });
  return res.data;
}
