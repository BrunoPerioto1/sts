import { apiClient } from "../apiClient";

// Apaga a conta e, junto, apostas, saldos e movimentações — sem volta.
export async function deleteMe(): Promise<{ success: boolean }> {
  const res = await apiClient().users.delete<{ success: boolean }>("me");
  return res.data;
}
