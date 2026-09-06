import { apiClient } from "../apiClient";

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export async function postChangePassword(data: ChangePasswordRequest): Promise<{ success: boolean }> {
  const res = await apiClient().auth.post<{ success: boolean }>("change-password", data);
  return res.data;
}
