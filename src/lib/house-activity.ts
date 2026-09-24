// Quantos dias sem apostar numa casa até ela virar candidata a saque.
export const STALE_BET_DAYS = 20;

const DAY_MS = 86_400_000;

// "never" é separado de "idle" de propósito: casa que só recebeu depósito
// nunca foi usada, não está parada — não pode ganhar o aviso de sacar.
export type HouseActivity =
  | { kind: "active"; days: number }
  | { kind: "withdraw"; days: number }
  | { kind: "idle"; days: number }
  | { kind: "never" };

export function houseActivity(
  lastBetAt: string | null,
  balance: number,
  now: number = Date.now()
): HouseActivity {
  if (!lastBetAt) return { kind: "never" };
  const days = Math.floor((now - new Date(lastBetAt).getTime()) / DAY_MS);
  if (days <= STALE_BET_DAYS) return { kind: "active", days };
  // Parada sem saldo não tem o que sacar.
  return balance > 0 ? { kind: "withdraw", days } : { kind: "idle", days };
}

// Chave da ordenação "mais parada primeiro": casa nunca apostada vai pro fim.
export function idleDays(lastBetAt: string | null, now: number = Date.now()): number {
  if (!lastBetAt) return -1;
  return Math.floor((now - new Date(lastBetAt).getTime()) / DAY_MS);
}

export function formatIdleDays(days: number): string {
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days}d`;
}
