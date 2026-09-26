import type { CSSProperties } from "react";
import { useMe } from "@/hooks/queries/use-me";
import { normalizeDashboardPreferences, performanceColor } from "@/lib/dashboard-preferences";

/**
 * Cor de ganho/perda escolhida em Preferências. Fora do dashboard as telas
 * usavam verde e vermelho fixos e ignoravam a escolha do usuário.
 */
export function usePerformanceColor() {
  const { me } = useMe();
  const colors = normalizeDashboardPreferences(me?.dashboardPreferences).performanceColors;
  return (value: number | null) => performanceColor(value, colors);
}

/** Selo/caixa tingido: fundo e borda são a própria cor, mais transparente. */
export function tintStyle(color: string, fill = 12, border = 25): CSSProperties {
  return {
    color,
    background: `color-mix(in srgb, ${color} ${fill}%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} ${border}%, transparent)`,
  };
}
