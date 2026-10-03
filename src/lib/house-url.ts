// "https://www.betano.bet.br/x" -> "betano.bet.br": o que cabe numa linha de lista.
export function siteLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Aba nova sem `opener`: o site da casa não ganha acesso à aba do app.
export function openHouseSite(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}
