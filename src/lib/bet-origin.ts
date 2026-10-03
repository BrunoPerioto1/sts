// Origem da aposta, subconjunto do BET_ORIGINS do back. Print vale no geral
// (lido no site ou mandado pro bot); manual é a digitada no site. Apostas
// antigas do site, anteriores ao `fromImage`, contam como digitadas.
export const ORIGIN_OPTIONS = [
  { value: "print", label: "Print" },
  { value: "manual", label: "Manual" },
] as const;

export type BetOrigin = (typeof ORIGIN_OPTIONS)[number]["value"];

export const ORIGIN_LABEL: Record<string, string> = Object.fromEntries(ORIGIN_OPTIONS.map((o) => [o.value, o.label]));
