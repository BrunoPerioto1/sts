import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { mapResultToStatus } from "@/lib/bet-status";
import { useAnimatedNumber } from "@/hooks/use-animated-number";
import type { BetItem } from "@/api/routes/get-bets";

export function ReturnValue({ aposta, className }: { aposta: BetItem; className?: string }) {
  const status = mapResultToStatus(aposta);
  const settled = status !== "pendente" && status !== "cancelada";
  // Pendente conta como 0: ao liquidar, o lucro corre do zero até o valor.
  const lucro = settled ? Number(aposta.profit ?? 0) : 0;
  const { display, animating } = useAnimatedNumber(lucro);

  if (status === "pendente") return <span className={cn("opacity-35 tabular-nums whitespace-nowrap", className)}>—</span>;
  if (status === "cancelada")
    return <span className={cn("opacity-55 tabular-nums whitespace-nowrap", className)}>{formatCurrency(Number(aposta.stake ?? 0))}</span>;
  return (
    <span
      className={cn(
        "inline-block tabular-nums font-medium whitespace-nowrap",
        lucro >= 0 ? "text-positive" : "text-negative",
        animating && "animate-value-pop",
        className
      )}
    >
      {formatSignedCurrency(display)}
    </span>
  );
}
