import type { CSSProperties } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Extraído do dashboard mobile; tamanho e aparência independem da quantidade.
export function DashboardKpiCard({ label, value, icon: IconComponent, color, columnSpan = 1, style }: {
  label: string; value: string; icon: Icon; color?: string; columnSpan?: 1 | 2; style?: CSSProperties;
}) {
  return <div className={cn("min-w-0 flex items-center gap-2 min-h-[76px] rounded-xl border border-white/[0.07] bg-white/[0.015] p-3", columnSpan === 2 && "col-span-2")} style={style}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-zinc-400 max-[359px]:h-7 max-[359px]:w-7" aria-hidden="true"><IconComponent size={21} /></span>
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-zinc-400 mb-1">{label}</p>
      <p className="text-lg leading-tight font-semibold tabular-nums break-words" style={{ color }}>{value}</p>
    </div>
  </div>;
}
