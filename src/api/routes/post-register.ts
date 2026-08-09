import { apiClient } from "../apiClient";

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  roleId: number;
  fullName?: string;
};

export type RegisterResponse = {
  id: number;
  username: string;
  email: string;
  fullName?: string | null;
  isActive: boolean | null;
  roleId: number;
  createdAt: string | null;
  updatedAt: string | null;
  lastLogin?: string | null;
};

export async function postRegister(data: RegisterRequest): Promise<RegisterResponse> {
  const res = await apiClient().users.post<RegisterResponse>("", data);
  return res.data;
}


