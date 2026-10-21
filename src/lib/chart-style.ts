/** Eixo Y curto dos gráficos do dashboard: "0", "500", "1,5k", "−2k". */
export function compactAxis(value: number) {
  const abs = Math.abs(value);
  const text = abs >= 1000
    ? `${(abs / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`
    : abs.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  return value < 0 ? `−${text}` : text;
}

// Grade e eixos recessivos: o protagonismo é da linha/barra.
export const GRID_PROPS = { vertical: false, stroke: "var(--color-text)", strokeOpacity: 0.07, strokeDasharray: "4 5" } as const;
export const AXIS_TICK = { fill: "var(--color-text)", opacity: 0.4, fontSize: 11 } as const;
