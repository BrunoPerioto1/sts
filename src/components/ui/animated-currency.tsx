import { cn } from "@/lib/utils";
import { formatSignedCurrency } from "@/lib/format";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

// Valor com sinal que corre até o novo quando muda (liquidar, totais do dia e
// do mês). A cor segue o valor exibido, então vira de verde pra vermelho no
// meio da corrida junto com o sinal.
export function AnimatedSignedCurrency({ value, className }: { value: number; className?: string }) {
  const { display, animating } = useAnimatedNumber(value);
  return (
    <span
      className={cn(
        "inline-block tabular-nums whitespace-nowrap",
        display >= 0 ? "text-positive" : "text-negative",
        animating && "animate-value-pop",
        className
      )}
    >
      {formatSignedCurrency(display)}
    </span>
  );
}
