import { useCountUp } from "@/hooks/use-count-up";

interface AnimatedNumberProps {
  value: number;
  /** Formatador aplicado ao valor intermediario a cada frame. */
  format: (value: number) => string;
  duration?: number;
  className?: string;
}

/**
 * Numero que conta ate o valor final. Use so nos numeros-heroi da tela (lucro
 * do periodo, saldo total) — contar todo numero de uma grade transforma a tela
 * num painel de aeroporto e atrapalha a leitura.
 *
 * `tabular-nums` e obrigatorio aqui: sem ele a largura de cada digito muda a
 * cada frame e o texto vibra na horizontal enquanto conta.
 */
export function AnimatedNumber({ value, format, duration, className }: AnimatedNumberProps) {
  const current = useCountUp(value, duration);
  return <span className={className}>{format(current)}</span>;
}
