import { apiClient } from "../apiClient";

export type TelegramLinkCodeResponse = {
  code: string;
};

export async function postTelegramLinkCode(): Promise<TelegramLinkCodeResponse> {
  const res = await apiClient().auth.post<TelegramLinkCodeResponse>("link-telegram");
  return res.data;
}


