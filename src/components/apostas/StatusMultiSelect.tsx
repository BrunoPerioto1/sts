import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "9", label: "Pendente" },
  { value: "1", label: "Ganha" },
  { value: "2", label: "Perdida" },
  { value: "4", label: "Meia Ganha" },
  { value: "5", label: "Meia Perdida" },
  { value: "6", label: "Cashout" },
  { value: "3", label: "Cancelada" },
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
            "flex items-center gap-1.5 text-[13px] disabled:opacity-45 disabled:cursor-not-allowed",
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
