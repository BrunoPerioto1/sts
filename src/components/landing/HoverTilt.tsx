import { useRef, type PointerEvent, type ReactNode } from "react";

// Inclinação máxima, em graus, quando o mouse está na borda do card. Pequena de
// propósito: o gráfico dentro dele é clicável e as barras não podem fugir do cursor.
const MAX_X = 2;
const MAX_Y = 2.5;

function canTilt() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * O card inclina um pouco na direção do mouse e sobe 4px; ao sair, volta pro
 * lugar. Só com mouse (toque dispara hover falso) e sem movimento reduzido. O
 * transform vai direto no elemento, um por frame, e a transição do .hover-tilt
 * (landing.css) retoma do ponto em que está, sem salto.
 */
export function HoverTilt({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse" || !canTilt()) return;
    const box = el.getBoundingClientRect();
    // -0,5 a 0,5 a partir do centro do card.
    const x = (e.clientX - box.left) / box.width - 0.5;
    const y = (e.clientY - box.top) / box.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.transform = `perspective(1600px) translate3d(0, -4px, 0) rotateX(${(-y * 2 * MAX_X).toFixed(2)}deg) rotateY(${(x * 2 * MAX_Y).toFixed(2)}deg)`;
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    if (ref.current) ref.current.style.transform = "";
  };

  return (
    <div ref={ref} className="hover-tilt" onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
