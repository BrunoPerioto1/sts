import { apiClient } from "../apiClient";

export type TelegramLinkCodeResponse = {
  code: string;
  // ISO; o backend dá cinco minutos de validade.
  expiresAt: string;
};

export async function postTelegramLinkCode(): Promise<TelegramLinkCodeResponse> {
  const res = await apiClient().auth.post<TelegramLinkCodeResponse>("link-telegram");
  return res.data;
}


