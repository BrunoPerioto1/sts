// Vencimento do acesso (cobrança por PIX). O servidor guarda um instante; aqui
// tudo que é mostrado ou digitado é hora de Brasília, independente do fuso de
// quem abre a tela. Brasil sem horário de verão desde 2019: -03:00 fixo.
const TZ = "America/Sao_Paulo";
const OFFSET = "-03:00";

export function isExpired(accessUntil: string | null | undefined): boolean {
  return !!accessUntil && new Date(accessUntil).getTime() <= Date.now();
}

/** "24/09 23:30" */
export function formatAccessDate(accessUntil: string): string {
  return new Date(accessUntil).toLocaleString("pt-BR", {
    timeZone: TZ,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", "");
}

/** Instante → valor de <input type="datetime-local"> em hora de Brasília. */
export function toSaoPauloInput(accessUntil: string): string {
  // sv-SE formata como "2026-09-24 23:30:00".
  return new Date(accessUntil).toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(" ", "T");
}

/** Valor do datetime-local (lido como hora de Brasília) → ISO com fuso. */
export function fromSaoPauloInput(value: string): string {
  return `${value}:00${OFFSET}`;
}

/** Dias de calendário em Brasília até o vencimento: 0 = vence hoje. */
export function daysUntilAccess(accessUntil: string, now = new Date()): number {
  const day = (d: Date) => Date.parse(d.toLocaleDateString("en-CA", { timeZone: TZ }));
  return Math.round((day(new Date(accessUntil)) - day(now)) / 86_400_000);
}
