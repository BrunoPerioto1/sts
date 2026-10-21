import type { ReactNode } from "react";

/** Caixa do tooltip dos gráficos do dashboard: rótulo apagado em cima, valor embaixo. */
export function ChartTooltipBox({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="pointer-events-none min-w-[150px] rounded-lg border border-foreground/10 bg-[rgb(var(--rgb-surface-2))] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-0.5 text-[13px] font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}
