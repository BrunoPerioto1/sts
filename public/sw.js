// Service worker mínimo. Só existe por dois motivos: deixar o app instalável
// (PWA) e receber o print compartilhado pelo Android (Web Share Target).
// Não guarda o app em cache de propósito — com deploy frequente, servir
// bundle velho do cache seria pior que depender da rede.

const SHARE_CACHE = "share-target";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "POST" || url.pathname !== "/share-target") return;

  // O Android manda o print num POST multipart. A página não recebe POST, então
  // o arquivo fica no Cache Storage e a tela de Apostas busca de lá.
  event.respondWith(
    (async () => {
      try {
        const form = await event.request.formData();
        const files = form.getAll("image").filter((f) => f instanceof File);
        await caches.delete(SHARE_CACHE);
        const cache = await caches.open(SHARE_CACHE);
        await Promise.all(
          files.map((file, i) =>
            cache.put(
              `/shared/${i}`,
              new Response(file, { headers: { "Content-Type": file.type, "X-File-Name": encodeURIComponent(file.name) } }),
            ),
          ),
        );
        return Response.redirect(files.length ? "/bets?compartilhado=1" : "/bets", 303);
      } catch {
        return Response.redirect("/bets", 303);
      }
    })(),
  );
});
