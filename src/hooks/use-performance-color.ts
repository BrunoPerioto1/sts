import { useLayoutEffect, type CSSProperties } from "react";
import { useMe } from "@/hooks/queries/use-me";
import { normalizeDashboardPreferences, performanceColor, resultColorVars } from "@/lib/dashboard-preferences";

/**
 * Leva a cor escolhida em Preferências pro <html>: `text-success`/`text-danger`
 * em qualquer tela passam a usar ela, não só o dashboard e a conferência.
 * Montado uma vez, no AppShell.
 */
export function useResultColorVars() {
  const { me } = useMe();
  const vars = resultColorVars(normalizeDashboardPreferences(me?.dashboardPreferences).performanceColors);
  const success = vars?.success;
  const danger = vars?.danger;
  useLayoutEffect(() => {
    const style = document.documentElement.style;
    if (success && danger) {
      style.setProperty("--color-success", success);
      style.setProperty("--color-danger", danger);
    }
    // Ao sair (logout) ou voltar pro padrão, devolve o controle ao index.css.
    return () => {
      style.removeProperty("--color-success");
      style.removeProperty("--color-danger");
    };
  }, [success, danger]);
}

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
