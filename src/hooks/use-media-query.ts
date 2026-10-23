import { useCallback, useSyncExternalStore } from "react";

/**
 * Media query lida no render, como o useIsMobile — sem o frame errado de um
 * useEffect. Pra layout puro prefira as classes do Tailwind; isto é pra quando
 * a árvore muda (o painel ao lado x a gaveta por cima, na Conferência).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
