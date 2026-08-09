import { apiClient } from "../apiClient";

export async function postUnlinkTelegram() {
  const res = await apiClient().users.delete("me/telegram");
  return res.data;
}
