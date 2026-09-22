import type { DashboardPreferences } from "@/lib/dashboard-preferences";
import { apiClient } from "../apiClient";
import type { MeResponse } from "./get-me";

export interface UpdateMeParams {
  dashboardPreferences?: DashboardPreferences | null;
  username?: string;
  email?: string;
  fullName?: string;
  stake?: number;
  minPercentFilter?: number;
  // Exigida pelo servidor só quando o e-mail muda.
  currentPassword?: string;
}

export async function patchMe(data: UpdateMeParams): Promise<MeResponse> {
  const res = await apiClient().users.patch<MeResponse>("me", data);
  return res.data;
}
