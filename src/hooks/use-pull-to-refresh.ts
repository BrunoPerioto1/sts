import { useEffect, useRef, useState } from "react";

const TRIGGER_PX = 64;
const MAX_PX = 90;
// Resistência: o dedo anda o dobro do que a faixa desce, pra puxar ter peso e
// não disparar sem querer no primeiro pixel de rolagem.
const RESISTANCE = 0.5;

/**
 * Puxar a lista pra baixo no topo da página recarrega os dados.
 *
 * Ouve o toque na janela (as telas rolam no body, não num container próprio) e
 * só entra em ação quando a página já está no topo — no meio da lista o gesto
 * é rolagem normal e o hook nem se envolve.
 *
 * Devolve `distance` (px já puxados) e `refreshing` pra tela desenhar o
 * indicador; nada é renderizado aqui.
 */
export function usePullToRefresh(onRefresh: () => Promise<unknown>, enabled = true) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  // Callback e estado vivem em ref porque os listeners são registrados uma vez
  // só: relê o valor atual sem reassinar o touchmove a cada render.
  const onRefreshRef = useRef(onRefresh);
  const refreshingRef = useRef(false);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!enabled) return;

    let startY: number | null = null;
    let pulled = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current || window.scrollY > 0 || e.touches.length !== 1) {
        startY = null;
        return;
      }
      startY = e.touches[0].clientY;
      pulled = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY === null) return;
      const dy = e.touches[0].clientY - startY;
      // Subiu ou a página saiu do topo: era rolagem, não pull.
      if (dy <= 0 || window.scrollY > 0) {
        startY = null;
        pulled = 0;
        setDistance(0);
        return;
      }
      pulled = Math.min(dy * RESISTANCE, MAX_PX);
      setDistance(pulled);
    };

    const onTouchEnd = () => {
      if (startY === null) return;
      startY = null;
      if (pulled < TRIGGER_PX) {
        setDistance(0);
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      setDistance(TRIGGER_PX);
      onRefreshRef.current().finally(() => {
        refreshingRef.current = false;
        setRefreshing(false);
        setDistance(0);
      });
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled]);

  return { distance, refreshing, active: distance > 0 || refreshing };
}
