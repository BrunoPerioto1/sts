import { apiClient } from "../apiClient";

export type LoginRequest = {
  email: string;
  password: string;
  /** "Manter conectado": o backend emite um token de 30 dias em vez de 1. */
  remember?: boolean;
};

export type LoginResponse = {
  access_token: string;
};

export async function postLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient().auth.post<LoginResponse>("login", data);
  return res.data;
}

/** Pede o link de redefinir senha (e-mail e, se vinculado, bot). Responde igual exista ou não a conta. */
export async function postForgotPassword(email: string): Promise<void> {
  await apiClient().auth.post("forgot-password", { email });
}

/** Troca a senha com o token do link. 400 = link inválido, vencido ou já usado. */
export async function postResetPassword(data: { token: string; newPassword: string }): Promise<void> {
  await apiClient().auth.post("reset-password", data);
}
