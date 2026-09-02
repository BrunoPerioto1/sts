import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  return (
    <div className={cn("inline-flex overflow-hidden rounded-md border border-border", className)}>
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-[7px] text-[13px] whitespace-nowrap transition-colors",
              i > 0 && "border-l border-border",
              active ? "text-[var(--color-onlight)]" : "hover:bg-foreground/[0.07]"
            )}
            style={active ? { background: "var(--color-light)" } : undefined}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
