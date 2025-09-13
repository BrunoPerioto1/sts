import { apiClient } from "../apiClient";

export type TelegramLinkConfirmRequest = {
  code: string;
  telegramUserId: number;
};

export type TelegramLinkConfirmResponse = {
  success: boolean;
  message: string;
  userId?: number;
  telegramUserId?: number;
};

export async function postTelegramLinkConfirm(data: TelegramLinkConfirmRequest): Promise<TelegramLinkConfirmResponse> {
  const res = await apiClient().auth.post<TelegramLinkConfirmResponse>("link-telegram/confirm", data);
  return res.data;
}


