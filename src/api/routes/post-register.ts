import { apiClient } from "../apiClient";

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  roleId: number;
  full_name?: string;
};

export type RegisterResponse = {
  id: number;
  username: string;
  email: string;
  full_name?: string | null;
  is_active: boolean | null;
  role_id: number;
  created_at: string | null;
  updated_at: string | null;
  last_login?: string | null;
};

export async function postRegister(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient().users.post<RegisterResponse>("", data);
  return res.data;
}


