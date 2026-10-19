import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlowingBorderProps {
  /** Metade do arco aceso, em graus. */
  spread?: number;
  /** Quantos px fora do card o ponteiro já acende a borda. */
  proximity?: number;
  /** Fração do raio, a partir do centro, em que o brilho apaga. */
  inactiveZone?: number;
  className?: string;
}

/**
 * Arco azul que corre pela borda do card apontando pro ponteiro (o "Glowing
 * Effect" do Aceternity sem a lib motion: o ângulo anima por transição CSS da
 * --glow-start, ver index.css). Vai dentro de um pai `relative` com o mesmo
 * arredondamento e sem overflow-hidden, senão a borda sai cortada.
 */
export function GlowingBorder({ spread = 40, proximity = 48, inactiveZone = 0.6, className }: GlowingBorderProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    // No toque não há ponteiro pra seguir; com movimento reduzido, nada de brilho andando.
    if (!el || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let pointer: { x: number; y: number } | null = null;
    let angle = 0;

    const update = () => {
      frame = 0;
      if (!pointer) return;
      const { left, top, width, height } = el.getBoundingClientRect();
      const cx = left + width / 2;
      const cy = top + height / 2;
      const near =
        pointer.x > left - proximity &&
        pointer.x < left + width + proximity &&
        pointer.y > top - proximity &&
        pointer.y < top + height + proximity;
      // Perto do centro qualquer movimento vira meia volta no ângulo: ali apaga.
      const active = near && Math.hypot(pointer.x - cx, pointer.y - cy) >= (Math.min(width, height) / 2) * inactiveZone;
      el.toggleAttribute("data-active", active);
      if (!active) return;
      const target = (Math.atan2(pointer.y - cy, pointer.x - cx) * 180) / Math.PI + 90;
      // Caminho mais curto: de 350° pra 10° são 20°, não uma volta inteira.
      angle += ((((target - angle) % 360) + 540) % 360) - 180;
      el.style.setProperty("--glow-start", String(angle));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY };
      schedule();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", schedule);
    };
  }, [proximity, inactiveZone]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("glowing-border pointer-events-none absolute inset-0 rounded-[inherit]", className)}
      style={{ "--glow-spread": spread } as CSSProperties}
    />
  );
}
