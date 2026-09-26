// Print compartilhado pelo Android (Web Share Target): o service worker (sw.js)
// guarda os arquivos no Cache Storage e manda pra /bets?compartilhado=1. Aqui a
// tela pega e apaga — o mesmo print não pode abrir o modal de novo depois.
const SHARE_CACHE = "share-target";

export async function takeSharedImages(): Promise<File[]> {
  if (typeof caches === "undefined") return [];
  try {
    const cache = await caches.open(SHARE_CACHE);
    const keys = await cache.keys();
    const files: File[] = [];
    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) continue;
      const blob = await response.blob();
      const name = decodeURIComponent(response.headers.get("X-File-Name") ?? "print.jpg");
      files.push(new File([blob], name, { type: blob.type || "image/jpeg" }));
    }
    await caches.delete(SHARE_CACHE);
    return files;
  } catch {
    return [];
  }
}

// Registro só em produção: em dev o Vite serve outro esquema de arquivos e um
// SW preso de outra sessão só atrapalha.
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}
