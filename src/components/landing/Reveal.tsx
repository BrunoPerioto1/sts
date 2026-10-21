import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Entrada ao rolar, a mesma em toda a landing: o bloco sobe, sai do desfoque e
 * aparece uma vez só, quando chega na tela. Blocos lado a lado entram em
 * cascata pelo `delay`. Com movimento reduzido, nasce no lugar (landing.css).
 *
 * Nasce visível: só esconde, antes da primeira pintura, o que está abaixo da
 * tela na montagem. O que já está na tela (ou acima dela) nunca some, e sem
 * IntersectionObserver nada é escondido. A animação é enfeite, não porteira.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [waiting, setWaiting] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setWaiting(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setWaiting(false);
        observer.disconnect();
      },
      // Uma tela de folga em cima: quem pulou por âncora (#preco) e volta rolando encontra o bloco já pronto.
      { rootMargin: "100% 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={waiting ? "wait" : undefined}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
