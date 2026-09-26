import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS } from "@/lib/bet-status";

interface StatusMultiSelectProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  disabled?: boolean;
  // Reaproveitado pelo filtro de origem: mesma caixa, outras opções.
  options?: readonly { value: string; label: string }[];
  label?: string;
  /** Itens depois de um separador (ex.: "Sem jogo identificado" na origem). */
  extra?: ReactNode;
  /** Texto a mais no resumo do gatilho quando `extra` está marcado. */
  extraLabel?: string | null;
}

export function StatusMultiSelect({
  selected,
  onChange,
  className,
  disabled,
  options = STATUS_OPTIONS,
  label = "Status",
  extra,
  extraLabel,
}: StatusMultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const selectedLabel =
    [
      ...options.filter((o) => selected.includes(o.value)).map((o) => o.label),
      ...(extraLabel ? [extraLabel] : []),
    ].join(", ") || null;

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
          <span className="text-zinc-500 shrink-0">{label}</span>
          {selectedLabel && <span className="text-foreground truncate max-w-[180px]">{selectedLabel}</span>}
          <CaretDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px]">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => toggle(opt.value)}
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        {extra && (
          <>
            <DropdownMenuSeparator />
            {extra}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
