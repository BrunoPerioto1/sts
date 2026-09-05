import type { CSSProperties } from "react";

/**
 * Indice do degrau da cascata de entrada. Usar junto de `animate-rise stagger`:
 * a classe le `--i` e converte em atraso (ver src/index.css).
 */
export function stagger(index: number): CSSProperties {
  return { "--i": Math.min(index, 5) } as CSSProperties;
}
