import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: Icon;
}

// Poucas opções exclusivas com troca imediata (tema, cor dos resultados):
// todas à vista, a ativa em destaque.
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
  disabled,
  className,
}: {
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex gap-1 rounded-lg border border-border p-1", className)} role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "press flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors disabled:opacity-50",
              active ? "bg-accent/15 text-foreground ring-1 ring-inset ring-accent/40" : "text-zinc-400 hover:text-foreground"
            )}
          >
            {o.icon && <o.icon size={14} />} {o.label}
          </button>
        );
      })}
    </div>
  );
}
