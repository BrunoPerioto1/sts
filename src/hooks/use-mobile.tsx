import { useSyncExternalStore } from "react";

export const MOBILE_BREAKPOINT = 640;

const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

// Instanciado sob demanda, nao no topo do modulo: `window` nao existe em tempo
// de import fora do browser (teste/SSR) e o modulo e importado por dezenas de
// componentes.
let mediaQuery: MediaQueryList | null = null;
function getMediaQuery(): MediaQueryList {
  if (!mediaQuery) mediaQuery = window.matchMedia(QUERY);
  return mediaQuery;
}

function subscribe(onStoreChange: () => void): () => void {
  const mql = getMediaQuery();
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

const getSnapshot = (): boolean => getMediaQuery().matches;

// Mobile-first: se nao ha janela pra consultar, assume a tela estreita. Errar
// pro lado do mobile so custa um layout mais simples; errar pro desktop e
// justamente o flash de sidebar que esse hook causava.
const getServerSnapshot = (): boolean => true;

/**
 * `true` abaixo de 640px, JA NO PRIMEIRO RENDER.
 *
 * A versao anterior comecava em `false` e corrigia no `useEffect`, entao todo
 * componente que remontava (leia-se: toda navegacao) pintava um frame de
 * desktop antes de virar mobile. `useSyncExternalStore` le o matchMedia
 * durante o render, sem frame intermediario.
 *
 * Use isto so pra logica em JS (arvores de componente diferentes). Pra
 * mostrar/esconder layout, prefira as classes `sm:` — quem decide e a pintura.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
