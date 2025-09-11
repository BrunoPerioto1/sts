import { apiClient } from "../apiClient";

export type MeResponse = {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  role_id: number;
};

export async function getMe(): Promise<MeResponse> {
  const res = await apiClient().users.get<MeResponse>("me");
  return res.data;
}


