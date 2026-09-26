// Origem da aposta, igual ao BET_ORIGINS do back. Tip vence a fonte: o
// Planilhar do bot grava source=telegram, mas pra quem filtra veio do canal.
// Print x digitada só vale para apostas registradas depois do `fromImage`;
// as antigas do site contam como digitadas.
export const ORIGIN_OPTIONS = [
  { value: "tip", label: "Tip do canal" },
  { value: "telegram", label: "Mensagem no bot" },
  { value: "print", label: "Print no site" },
  { value: "manual", label: "Digitada no site" },
] as const;

export type BetOrigin = (typeof ORIGIN_OPTIONS)[number]["value"];

export const ORIGIN_LABEL: Record<string, string> = Object.fromEntries(ORIGIN_OPTIONS.map((o) => [o.value, o.label]));
