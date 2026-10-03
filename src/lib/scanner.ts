// Regras da tela /admin/scanner que não são JSX. Ver stsbackend/docs/scanner.md.

/**
 * Id do torneio a partir do que foi colado: o id cru ou a URL do SofaScore.
 * Vale o último segmento do path, se for número; hash e query são ignorados —
 * em `…/premier-league/17#id:61627` o 61627 é a temporada, não o torneio.
 */
export function parseTournamentId(raw: string): number | null {
  const value = raw.trim();
  if (/^\d+$/.test(value)) return Number(value) > 0 ? Number(value) : null;
  let path: string;
  try {
    path = new URL(value).pathname;
  } catch {
    return null;
  }
  const last = path.split("/").filter(Boolean).at(-1);
  return last && /^\d+$/.test(last) && Number(last) > 0 ? Number(last) : null;
}

/** "…/brasileirao-serie-a/325" → "Brasileirao Serie A". Só sugestão: dá pra editar. */
export function nameFromUrl(raw: string): string {
  let path: string;
  try {
    path = new URL(raw.trim()).pathname;
  } catch {
    return "";
  }
  const slug = path.split("/").filter(Boolean).at(-2) ?? "";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

type CollectState = {
  isActive: boolean;
  lastEvents: number | null;
  lastCheckAt: string | null;
  lastCheckStatus: "ok" | "invalid_id" | "blocked" | "error" | null;
};

/** Precisa de olho: ativa e com ID inválido, coleta falhando ou desatualizada. */
export const hasProblem = (t: CollectState, now: number = Date.now()) =>
  t.isActive && collectLabel(t, now).alert;

/**
 * Linha do cabeçalho: "Última coleta há 3 h · 2.005 jogos · 22 sem jogos ·
 * Tudo OK". Só competições ativas: pausada não é coletada.
 */
export function collectSummary(rows: CollectState[], now: number = Date.now()) {
  const ativas = rows.filter((t) => t.isActive);
  const ok = ativas.filter(
    (t) => t.lastCheckStatus === "ok" && !hasProblem(t, now),
  );
  const ultima = ativas.reduce<string | null>(
    (max, t) =>
      t.lastCheckAt && (!max || t.lastCheckAt > max) ? t.lastCheckAt : max,
    null,
  );
  return {
    lastCheckAt: ultima,
    games: ok.reduce((n, t) => n + (t.lastEvents ?? 0), 0),
    empty: ok.filter((t) => t.lastEvents === 0).length,
    problems: ativas.filter((t) => hasProblem(t, now)).length,
  };
}

// O coletor roda seg e qui: o maior intervalo normal entre tentativas é 4 dias.
export const STALE_DAYS = 5;
const DAY = 24 * 60 * 60 * 1000;

const games = (n: number) => `${n} ${n === 1 ? "jogo" : "jogos"}`;

/**
 * Texto da coluna "Próximos 30 dias". `alert` pinta de laranja. O 0 de uma
 * coleta ok fica sem cor: liga fora de temporada não tem nada de errado.
 */
export function collectLabel(
  t: CollectState,
  now: number = Date.now(),
): { text: string; alert: boolean } {
  if (!t.isActive) {
    return {
      text:
        t.lastEvents === null
          ? "pausada"
          : `pausada · última: ${games(t.lastEvents)}`,
      alert: false,
    };
  }
  if (!t.lastCheckAt) return { text: "aguardando coleta", alert: false };

  let text: string;
  let alert = false;
  if (t.lastCheckStatus === "invalid_id") {
    text = "ID inválido";
    alert = true;
  } else if (t.lastCheckStatus === "ok") {
    text = games(t.lastEvents ?? 0);
  } else {
    text = `${t.lastEvents === null ? "" : `${games(t.lastEvents)} · `}coleta falhou`;
    alert = true;
  }
  if (now - Date.parse(t.lastCheckAt) > STALE_DAYS * DAY) {
    text += " · desatualizado";
    alert = true;
  }
  return { text, alert };
}
