import { useEffect, useRef, useState } from "react";

/**
 * Se o elemento está na tela (ou a `rootMargin` dela). Serve pra parar as
 * animações em loop fora da tela e pra só baixar o que está perto de aparecer.
 *
 * - `initial`: o valor antes do primeiro aviso do observer. `true` pro que já
 *   nasce visível (a área de trabalho no topo), senão ela começaria pausada.
 * - `once`: depois de entrar, não volta a `false` (carregamento sob demanda).
 *
 * Sem IntersectionObserver responde `true`: melhor mostrar do que esconder.
 */
export function useInView<T extends Element>({
  rootMargin = "0px",
  initial = false,
  once = false,
}: { rootMargin?: string; initial?: boolean; once?: boolean } = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && once) observer.disconnect();
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, once]);

  return [ref, inView] as const;
}
