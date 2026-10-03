import { apiClient } from "../apiClient";

export type UndeliveredTip = {
  id: number;
  createdAt: string;
  percent: number | null;
  text: string;
  // Passaria pelo filtro de % de quem recebe DM hoje — ou seja, deveria ter
  // chegado em alguém. As outras são o filtro funcionando, não falha.
  expectedDelivery: boolean;
};

export type AdminOverview = {
  lastTipAt: string | null;
  lastDeliveryAt: string | null;
  lastEventFetchAt: string | null;
  lastResultFetchAt: string | null;
  undeliveredTips: UndeliveredTip[];
  undeliveredExpected: number;
  startedEventsWithoutResult: number;
  pendingBetsWithoutSuggestion: number;
  undecidedSuggestions: number;
  suggestionsAwaitingUser: number;
  usersByRole: { admin: number; user: number };
};

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  roleId: number;
  isActive: boolean | null;
  lastLogin: string | null;
  createdAt: string | null;
  lockedUntil: string | null;
  failedLoginAttempts: number;
  telegramLinkedAt: string | null;
  accessUntil: string | null;
  /** Tirado do grupo Tips pelo painel; null = dentro ou convidado de volta. */
  tipsGroupRemovedAt: string | null;
  /** Apertou "Já paguei" (renovação/bot); some quando o acesso é liberado. */
  paymentClaimedAt: string | null;
  hasTelegram: boolean;
  betCount: number;
};

export type AdminHouse = {
  id: number;
  name: string;
  isActive: boolean;
  aliases: string[];
  websiteUrl: string | null;
  betCount: number;
};

// websiteUrl: só .bet.br (o servidor recusa o resto); "" ou null apaga o link.
export type CreateAdminHouseParams = { name: string; aliases?: string[]; websiteUrl?: string | null };
export type UpdateAdminHouseParams = { name?: string; aliases?: string[]; isActive?: boolean; websiteUrl?: string | null };

export type UpdateAdminUserParams = {
  roleId?: number;
  unlock?: boolean;
  unlinkTelegram?: boolean;
  /** false desativa a conta (sem login, sem API, sem tips); true reativa. */
  isActive?: boolean;
  extendDays?: number;
  /** Vencimento exato (ISO com fuso); null = sem prazo. */
  accessUntil?: string | null;
  /** remove: tira do grupo Tips quem está sem acesso. invite: repete o convite de quem voltou e ficou de fora. */
  tipsGroup?: "remove" | "invite";
};

/**
 * A linha atualizada, mais o que houve com o convite do grupo Tips quando o
 * acesso voltou. Ausente = nada a mandar (continuava no grupo).
 */
export type UpdatedAdminUser = AdminUser & { groupInvite?: "sent" | "failed" };

export async function getAdminOverview(): Promise<AdminOverview> {
  const res = await apiClient().admin.get<AdminOverview>("overview");
  return res.data;
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await apiClient().admin.get<AdminUser[]>("users");
  return res.data;
}

export async function patchAdminUser(id: number, data: UpdateAdminUserParams): Promise<UpdatedAdminUser> {
  const res = await apiClient().admin.patch<UpdatedAdminUser>(`users/${id}`, data);
  return res.data;
}

export async function getAdminHouses(): Promise<AdminHouse[]> {
  const res = await apiClient().admin.get<AdminHouse[]>("houses");
  return res.data;
}

export async function postAdminHouse(data: CreateAdminHouseParams): Promise<AdminHouse> {
  const res = await apiClient().admin.post<AdminHouse>("houses", data);
  return res.data;
}

export async function patchAdminHouse(id: number, data: UpdateAdminHouseParams): Promise<AdminHouse> {
  const res = await apiClient().admin.patch<AdminHouse>(`houses/${id}`, data);
  return res.data;
}

// ---- Scanner do SofaScore (/admin/scanner). Regras em stsbackend/docs/scanner.md.

export type ScannerCheckStatus = "ok" | "invalid_id" | "blocked" | "error";

export type ScannerTournament = {
  id: number;
  name: string;
  sportId: number;
  sportName: string;
  isActive: boolean;
  statistics: boolean;
  incidents: boolean;
  lineups: boolean;
  lastEvents: number | null;
  lastEventsAt: string | null;
  lastCheckAt: string | null;
  lastCheckStatus: ScannerCheckStatus | null;
  sampleAt: string | null;
  // Seções que vieram vazias na amostra: a conferência não liquida esses mercados.
  coverageGaps: ("statistics" | "lineups")[];
};

// Resumo do último jogo encerrado da competição (jobs/sofascore/amostra.py).
// `used` = o motor de liquidação lê essa chave.
export type ScannerSample = {
  sample: {
    event: { id: number; home: string; away: string; score: string; startAt: string } | null;
    statistics?: { key: string; name: string; group: string; home: unknown; away: unknown; used: boolean }[] | null;
    incidents?: Record<string, number> | null;
    lineups?: { confirmed: boolean; players: number; keys: { key: string; example: number; used: boolean }[] } | null;
    // Chaves que o motor precisa e não vieram (amostra a partir de 03/10).
    missing?: { statistics: string[]; lineups: string[] };
  } | null;
  sampleAt: string | null;
};

export async function getAdminScannerSample(id: number): Promise<ScannerSample> {
  const res = await apiClient().admin.get<ScannerSample>(`scanner/${id}/sample`);
  return res.data;
}

export type ScannerFlag = "isActive" | "statistics" | "incidents" | "lineups";
export type ScannerFlags = Partial<Record<ScannerFlag, boolean>>;
export type CreateScannerParams = { id: number; name: string; sportId: number };

// PATCH devolve a linha crua da tabela: sem o nome do esporte, que vem de join.
type ScannerRow = Omit<ScannerTournament, "sportName">;

export async function getAdminScanner(): Promise<ScannerTournament[]> {
  const res = await apiClient().admin.get<ScannerTournament[]>("scanner");
  return res.data;
}

export async function postAdminScanner(data: CreateScannerParams): Promise<ScannerRow> {
  const res = await apiClient().admin.post<ScannerRow>("scanner", data);
  return res.data;
}

export async function patchAdminScanner(id: number, data: ScannerFlags): Promise<ScannerRow> {
  const res = await apiClient().admin.patch<ScannerRow>(`scanner/${id}`, data);
  return res.data;
}

export async function patchAdminScannerSport(sportId: number, data: ScannerFlags): Promise<ScannerRow[]> {
  const res = await apiClient().admin.patch<ScannerRow[]>(`scanner/sports/${sportId}`, data);
  return res.data;
}

export async function deleteAdminScanner(id: number): Promise<void> {
  await apiClient().admin.delete(`scanner/${id}`);
}
