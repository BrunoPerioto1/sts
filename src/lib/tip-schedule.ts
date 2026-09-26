// Fila de Tips pelo relógio do jogo. A pergunta de quem abre a fila é "ainda
// dá tempo de entrar?", e a ordem de chegada no canal não responde isso.

function duration(totalMin: number): string {
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

/** "começa em 40 min", "começou há 2h15". */
export function startLabel(eventStartAt: string, now: Date = new Date()): string {
  const diffMin = (new Date(eventStartAt).getTime() - now.getTime()) / 60_000;
  if (diffMin > 0) return `começa em ${duration(Math.max(1, Math.round(diffMin)))}`;
  const ago = Math.round(-diffMin);
  if (ago >= 24 * 60) return "começou há mais de um dia";
  return `começou há ${duration(Math.max(1, ago))}`;
}

/**
 * Versão curta pra coluna estreita do desktop ("em 40 min", "há 2h15").
 * Fora de um dia pra frente ou pra trás, o relativo não ajuda: null, e a
 * célula volta a mostrar o dia.
 */
export function compactStartLabel(eventStartAt: string, now: Date = new Date()): string | null {
  const diffMin = (new Date(eventStartAt).getTime() - now.getTime()) / 60_000;
  if (Math.abs(diffMin) >= 24 * 60) return null;
  return diffMin > 0
    ? `em ${duration(Math.max(1, Math.round(diffMin)))}`
    : `há ${duration(Math.max(1, Math.round(-diffMin)))}`;
}

export function hasStarted(eventStartAt: string | null, now: Date = new Date()): boolean {
  return eventStartAt != null && new Date(eventStartAt).getTime() <= now.getTime();
}

export type TipGroupId = "upcoming" | "unknown" | "started";

export interface TipGroup<T> {
  id: TipGroupId;
  label: string;
  tips: T[];
}

/**
 * Três blocos, nesta ordem: o que ainda dá tempo (quem começa antes vem
 * primeiro), o que não teve o confronto reconhecido, e o que já começou (o
 * mais recente em cima — é o que ainda pode ter odd ao vivo).
 */
export function groupPendingTips<T extends { eventStartAt: string | null }>(
  tips: T[],
  now: Date = new Date(),
): TipGroup<T>[] {
  const time = (t: T) => new Date(t.eventStartAt!).getTime();
  const upcoming = tips.filter((t) => t.eventStartAt != null && !hasStarted(t.eventStartAt, now));
  const started = tips.filter((t) => hasStarted(t.eventStartAt, now));
  const unknown = tips.filter((t) => t.eventStartAt == null);

  const grupos: TipGroup<T>[] = [
    { id: "upcoming", label: "Ainda dá tempo", tips: [...upcoming].sort((a, b) => time(a) - time(b)) },
    { id: "unknown", label: "Sem horário identificado", tips: unknown },
    { id: "started", label: "Jogo já começou", tips: [...started].sort((a, b) => time(b) - time(a)) },
  ];
  return grupos.filter((g) => g.tips.length > 0);
}
