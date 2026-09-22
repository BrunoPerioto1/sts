// Régua de cor do painel de admin. Fica aqui, e não espalhada em ternário
// dentro do JSX, porque o mesmo limiar aparece no card, na contagem de alertas
// do grupo e no resumo do cabeçalho — três lugares que precisam concordar.

export type HealthLevel = "ok" | "warn" | "bad" | "neutral";

const HOUR = 60 * 60 * 1000;

export const HEALTH_THRESHOLDS = {
  // Tip é irregular por natureza: silêncio de madrugada é normal, dois dias não.
  tip: { warn: 24, bad: 48 },
  // O coletor roda de hora em hora. Passou de 6h, alguma coisa quebrou.
  collector: { warn: 1, bad: 6 },
  // Contagens: zero é verde, punhado é amarelo, mais que isso é vermelho.
  count: { warn: 1, bad: 6 },
} as const;

export function hoursSince(value: string | null, now: number = Date.now()): number | null {
  if (!value) return null;
  return (now - new Date(value).getTime()) / HOUR;
}

/** Nunca aconteceu conta como o pior caso: `null` é vermelho, não cinza. */
export function ageLevel(
  value: string | null,
  limits: { warn: number; bad: number },
  now: number = Date.now(),
): HealthLevel {
  const hours = hoursSince(value, now);
  if (hours === null) return "bad";
  if (hours >= limits.bad) return "bad";
  if (hours >= limits.warn) return "warn";
  return "ok";
}

export function countLevel(total: number): HealthLevel {
  if (total >= HEALTH_THRESHOLDS.count.bad) return "bad";
  if (total >= HEALTH_THRESHOLDS.count.warn) return "warn";
  return "ok";
}

export function isAlert(level: HealthLevel): boolean {
  return level === "warn" || level === "bad";
}

/**
 * Idade em duas partes pro card: número grande, unidade pequena. Minuto até
 * 1h, hora até 2 dias, dia depois disso — "72 h" não diz nada mais rápido que
 * "3 d".
 */
export function ageParts(value: string | null, now: number = Date.now()): { value: string; unit: string } {
  const hours = hoursSince(value, now);
  if (hours === null) return { value: "—", unit: "nunca" };
  if (hours < 1) return { value: String(Math.max(0, Math.round(hours * 60))), unit: "min" };
  if (hours < 48) return { value: String(Math.round(hours)), unit: "h" };
  return { value: String(Math.round(hours / 24)), unit: "d" };
}

/**
 * "22/09 13:24" no horário de Brasília. Fixo no fuso de propósito: a API roda
 * serverless em UTC e devolve ISO, então deixar o navegador decidir faria o
 * mesmo dado aparecer com 3h de diferença dependendo de onde a tela abre.
 */
export function formatSaoPaulo(value: string | null): string {
  if (!value) return "—";
  return new Date(value)
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");
}

// roles.id = 1. O backend valida de verdade; aqui serve pra esconder o que o
// usuário não pode abrir.
export const ADMIN_ROLE_ID = 1;

// Só os dois papéis em uso. O 2 (moderator) segue na tabela `roles` sem
// ninguém dentro e sem nenhuma regra que o consulte — oferecer na tela era
// convidar a criar um papel que não significa nada.
export const ROLE_LABELS: Record<number, string> = {
  1: "Admin",
  3: "Usuário",
};

export const ROLE_OPTIONS = [1, 3] as const;

export function isLocked(lockedUntil: string | null, now: number = Date.now()): boolean {
  return !!lockedUntil && new Date(lockedUntil).getTime() > now;
}
