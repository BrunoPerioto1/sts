import type { CSSProperties } from "react";

/** Atraso de entrada de cada peça, em ms (lido pelas classes .ws-* e .lp-* do landing.css). */
export const at = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
