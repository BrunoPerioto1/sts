import { Clock } from "@phosphor-icons/react";

// Horário do jogo como chip: destaca pela forma (fundo + borda), não pelo
// tamanho da fonte — texto grande desalinhava a coluna e brigava com o jogo.
export function TipKickoffBadge({ label, title }: { label: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-foreground/[0.06] px-1.5 py-0.5 text-[12px] font-semibold leading-none tabular-nums text-foreground"
    >
      <Clock size={12} weight="bold" className="shrink-0 text-zinc-400" />
      {label}
    </span>
  );
}
