import type { ReactNode } from "react";

/**
 * Tooltip dos gráficos do dashboard: a data apagada em cima e uma linha por
 * valor (rótulo à esquerda, número à direita).
 */
export function ChartTooltipBox({ title, rows }: { title: ReactNode; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="pointer-events-none min-w-[170px] rounded-lg border border-foreground/10 bg-[rgb(var(--rgb-surface-2))] px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <p className="mb-1.5 text-xs text-zinc-400">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="flex items-baseline justify-between gap-4 text-[13px] leading-6">
          <span className="text-zinc-400">{row.label}</span>
          <span className="font-medium tabular-nums text-foreground" style={{ color: row.color }}>{row.value}</span>
        </p>
      ))}
    </div>
  );
}
