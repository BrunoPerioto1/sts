import { useEffect, useRef, useState } from "react";

/**
 * Número que vai até o alvo em ~0,9 s, desacelerando no fim, sempre a partir
 * do valor que está na tela (trocar o alvo no meio do caminho não dá salto).
 * Com `instant` (movimento reduzido, ou um reset de loop), pula direto.
 */
export function useTween(target: number, instant: boolean, ms = 900) {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (instant || current.current === target) {
      current.current = target;
      setValue(target);
      return;
    }
    const origin = current.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const v = origin + (target - origin) * (1 - (1 - t) ** 3);
      current.current = v;
      setValue(v);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, instant, ms]);

  return value;
}
