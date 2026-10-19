import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useInView } from "./use-in-view";

/**
 * Entrada ao rolar, a mesma em toda a landing: o bloco sobe, sai do desfoque e
 * aparece uma vez só, quando chega perto da tela. Blocos lado a lado entram em
 * cascata pelo `delay`. Fica fora do topo da página: o que abre a página já
 * nasce visível. Com movimento reduzido, nasce no lugar (landing.css).
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>({ rootMargin: "0px 0px -10% 0px", once: true });
  return (
    <div ref={ref} className={cn("reveal", inView && "is-in", className)} style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  );
}
