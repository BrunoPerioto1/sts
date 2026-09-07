import { ResultIdEnum, type BetItem } from "@/api/routes/get-bets";

export type Status = "ganha" | "perdida" | "pendente" | "cancelada" | "meiaGanha" | "meiaPerdida" | "cashout";

export function mapResultToStatus(aposta: BetItem): Status {
  switch (aposta.resultId) {
    case ResultIdEnum.WON:
      return "ganha";
    case ResultIdEnum.LOST:
      return "perdida";
    case ResultIdEnum.CANCELED:
      return "cancelada";
    case ResultIdEnum.HALF_WON:
      return "meiaGanha";
    case ResultIdEnum.HALF_LOST:
      return "meiaPerdida";
    case ResultIdEnum.CASHOUT:
      return "cashout";
    default:
      return "pendente";
  }
}

export const statusVariant = {
  ganha: "won",
  perdida: "lost",
  pendente: "pending",
  cancelada: "canceled",
  meiaGanha: "halfWon",
  meiaPerdida: "halfLost",
  cashout: "cashout",
} as const;

export const statusLabel = {
  ganha: "Ganha",
  perdida: "Perdida",
  pendente: "Pendente",
  cancelada: "Cancelada",
  meiaGanha: "Meia Ganha",
  meiaPerdida: "Meia Perdida",
  cashout: "Cashout",
};

// Cor da barra usada no StatusSheet mobile (o dropdown desktop só usa
// value/label).
export const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "9", label: "Pendente", color: "var(--color-neutral-300)" },
  { value: "1", label: "Ganha", color: "var(--color-positive)" },
  { value: "2", label: "Perdida", color: "var(--color-negative)" },
  { value: "4", label: "Meia Ganha", color: "color-mix(in srgb, var(--color-positive) 55%, white)" },
  { value: "5", label: "Meia Perdida", color: "color-mix(in srgb, var(--color-negative) 55%, white)" },
  { value: "6", label: "Cashout", color: "var(--color-accent)" },
  { value: "3", label: "Cancelada", color: "#71717a" },
];

export const colorByResultId: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.color])
);

// Rótulo por resultId — usado no optimistic update em lote, que precisa
// preencher o resultName antes do backend responder.
export const statusLabelByResultId: Record<number, string> = {
  [ResultIdEnum.WON]: "Ganha",
  [ResultIdEnum.LOST]: "Perdida",
  [ResultIdEnum.PENDING]: "Pendente",
};

// Preview de lucro só pra exibir no LiquidarSheet antes de confirmar — o
// cálculo real e autoritativo continua no backend (calculateProfit em
// bet.utils.ts). Cashout não entra aqui: depende do valor que o usuário
// informar, não dá pra prever.
export function previewProfit(resultId: ResultIdEnum, stake: number, odd: number): number {
  switch (resultId) {
    case ResultIdEnum.WON:
      return stake * (odd - 1);
    case ResultIdEnum.LOST:
      return -stake;
    case ResultIdEnum.HALF_WON:
      return (stake * (odd - 1)) / 2;
    case ResultIdEnum.HALF_LOST:
      return -stake / 2;
    case ResultIdEnum.CANCELED:
    default:
      return 0;
  }
}

// Lucro que conta pros totais de mês/semana/dia: pendente ainda não tem
// resultado e cancelada devolve a stake, nenhuma das duas move o total.
export function settledProfit(aposta: BetItem): number {
  const status = mapResultToStatus(aposta);
  if (status === "pendente" || status === "cancelada") return 0;
  return Number(aposta.profit ?? 0);
}
