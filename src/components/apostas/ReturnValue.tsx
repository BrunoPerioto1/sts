import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { mapResultToStatus } from "@/lib/bet-status";
import type { BetItem } from "@/api/routes/get-bets";

export function ReturnValue({ aposta, className }: { aposta: BetItem; className?: string }) {
  const status = mapResultToStatus(aposta);
  if (status === "pendente") return <span className={cn("opacity-35 tabular-nums whitespace-nowrap", className)}>—</span>;
  if (status === "cancelada")
    return <span className={cn("opacity-55 tabular-nums whitespace-nowrap", className)}>{formatCurrency(Number(aposta.stake ?? 0))}</span>;
  const lucro = Number(aposta.profit ?? 0);
  return (
    <span className={cn("tabular-nums font-medium whitespace-nowrap", lucro >= 0 ? "text-positive" : "text-negative", className)}>
      {formatSignedCurrency(lucro)}
    </span>
  );
}
