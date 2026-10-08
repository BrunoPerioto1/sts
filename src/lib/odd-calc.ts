// "Odd mudou?" — a mesma conta da calculadora que o canal linka
// (calc.peixeesperto.com.br/?justa=X): Kelly a 1/4 sobre a odd justa da tip.
// Conferido contra ela: justa 1.982, casa 3.00 → edge +51,36%, 6,42% da banca.

// Fração de Kelly da calculadora do canal. É também o que gera a % da tip:
// odd 2.03 contra justa 1.982 dá os mesmos 0,59% que o sinal manda.
const KELLY_FRACTION = 1 / 4;

/** Odd justa do link da calculadora (`?justa=1.982`). Null se o link não a traz. */
export function parseFairOdd(calcLink: string | null): number | null {
  if (!calcLink) return null;
  try {
    const raw = new URL(calcLink).searchParams.get("justa");
    const value = raw === null ? NaN : Number(raw.replace(",", "."));
    return Number.isFinite(value) && value > 1 ? value : null;
  } catch {
    return null;
  }
}

export type OddVerdict = "ok" | "warn" | "bad";

export interface OddEvaluation {
  /** Vantagem sobre a odd justa (0.05 = +5%). */
  edge: number;
  /** % da banca sugerida (0.59 = 0,59%), já com a fração de Kelly. Zero sem vantagem. */
  percent: number;
  /** Stake em reais, cortada pelo limite. Null sem banca definida. */
  stake: number | null;
  /** ok: ainda vale; warn: perdeu mais da metade da vantagem; bad: abaixo da justa. */
  verdict: OddVerdict;
}

export function evaluateOdd({
  odd,
  fair,
  tipOdd,
  limit,
  bankroll,
}: {
  odd: number;
  fair: number;
  tipOdd: number | null;
  limit: number | null;
  bankroll: number | null;
}): OddEvaluation {
  const edge = odd / fair - 1;
  const percent = edge > 0 && odd > 1 ? (edge / (odd - 1)) * KELLY_FRACTION * 100 : 0;

  let stake: number | null = null;
  if (bankroll && bankroll > 0) {
    stake = (percent / 100) * bankroll;
    if (limit !== null) stake = Math.min(stake, limit);
    stake = Math.round(stake * 100) / 100;
  }

  const tipEdge = tipOdd !== null ? tipOdd / fair - 1 : null;
  const verdict: OddVerdict =
    edge <= 0 ? "bad" : tipEdge !== null && tipEdge > 0 && edge < tipEdge / 2 ? "warn" : "ok";

  return { edge, percent, stake, verdict };
}
