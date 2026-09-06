import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// easeOutExpo: quase todo o percurso acontece no primeiro terco do tempo, que
// e o que faz o numero "assentar" em vez de escorrer linearmente ate o fim.
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Anima de 0 (ou do valor anterior) ate `value`. Devolve o valor corrente pra
 * ser formatado por quem chama — o hook nao sabe nada sobre moeda/percentual.
 *
 * Sem `requestAnimationFrame` em loop de setState por frame nao da: e um numero
 * so por tela e o custo e desprezivel perto do ganho de leitura.
 */
export function useCountUp(value: number, duration = 700): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(value)) {
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    if (from === value) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(from + (value - from) * easeOutExpo(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, duration]);

  return display;
}
