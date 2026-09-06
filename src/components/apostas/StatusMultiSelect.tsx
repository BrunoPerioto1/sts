import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Cor da barra usada no StatusSheet mobile (o dropdown desktop abaixo só usa
// value/label).
const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "9", label: "Pendente", color: "var(--color-neutral-300)" },
  { value: "1", label: "Ganha", color: "var(--color-positive)" },
  { value: "2", label: "Perdida", color: "var(--color-negative)" },
  { value: "4", label: "Meia Ganha", color: "color-mix(in srgb, var(--color-positive) 55%, white)" },
  { value: "5", label: "Meia Perdida", color: "color-mix(in srgb, var(--color-negative) 55%, white)" },
  { value: "6", label: "Cashout", color: "var(--color-accent)" },
  { value: "3", label: "Cancelada", color: "#71717a" },
];

interface StatusMultiSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export function StatusMultiSelect({ selected, onChange, className, disabled }: StatusMultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectedLabel =
    selected.length > 0
      ? STATUS_OPTIONS.filter((o) => selected.includes(o.value))
          .map((o) => o.label)
          .join(", ")
      : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 text-sm disabled:opacity-45 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className="text-zinc-500 shrink-0">Status</span>
          {selectedLabel && <span className="text-white truncate">{selectedLabel}</span>}
          <CaretDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { STATUS_OPTIONS };
