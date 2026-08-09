import { apiClient } from "../apiClient";
import type { MeResponse } from "./get-me";

export interface UpdateMeParams {
  username?: string;
  email?: string;
  fullName?: string;
}

export async function patchMe(data: UpdateMeParams): Promise<MeResponse> {
  const res = await apiClient().users.patch<MeResponse>("me", data);
  return res.data;
}
