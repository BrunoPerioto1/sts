import { apiClient } from "../apiClient";

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

// A troca derruba todas as sessões, inclusive esta: o token novo é o que
// mantém quem trocou logado aqui.
export type ChangePasswordResponse = { success: boolean; access_token: string };

export async function postChangePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const res = await apiClient().auth.post<ChangePasswordResponse>("change-password", data);
  return res.data;
}
