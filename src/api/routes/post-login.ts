import { apiClient } from "../apiClient";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
};

export async function postLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient().auth.post<LoginResponse>("login", data);
  return res.data;
}


