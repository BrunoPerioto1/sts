import { useEffect, useRef, useState } from "react";

const DURATION_MS = 650;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Número que corre do valor anterior até o novo quando `value` muda (ex.:
 * lucro ao liquidar). O primeiro render já mostra o valor final: abrir a tela
 * não anima a lista inteira. `animating` fica true durante a corrida, pro
 * destaque visual.
 */
export function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  const displayRef = useRef(value);

  useEffect(() => {
    const from = displayRef.current;
    if (from === value) return;
    if (prefersReducedMotion()) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    setAnimating(true);
    const tick = (now: number) => {
      const t = Math.min((now - start) / DURATION_MS, 1);
      const next = from + (value - from) * easeOutCubic(t);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
      else setAnimating(false);
    };
    frame = requestAnimationFrame(tick);
    // Valor novo no meio da corrida: a próxima parte do ponto onde esta parou.
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return { display, animating };
}
