import { ArrowsDownUp, CaretDown, Check } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SortOption<T extends string> {
  value: T;
  /** Rótulo no gatilho e na lista: "Mais apostas". */
  label: string;
  /** Explicação curta na lista: "maior saldo primeiro". */
  hint?: string;
}

/**
 * Ordenação. Visualmente diferente de um chip de filtro de propósito — texto
 * com ícone de ordenar e seta, sem caixa —, porque ordenar não esconde nada
 * da lista. Abre um menu com as opções (mesmo componente no celular e no
 * desktop).
 */
export function SortSelect<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  options: readonly SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        aria-label={`Ordenar: ${current.label}`}
        className={cn(
          "press h-9 px-1.5 -mx-1.5 rounded-md flex items-center gap-1.5 text-[13px] text-zinc-400 whitespace-nowrap hover:text-foreground disabled:opacity-50",
          className,
        )}
      >
        <ArrowsDownUp size={14} />
        {current.label}
        <CaretDown size={11} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[13rem]">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} onSelect={() => onChange(o.value)} className="gap-2 py-2">
            <span className="flex-1 min-w-0">
              <span className="block">{o.label}</span>
              {o.hint && <span className="block text-xs opacity-60">{o.hint}</span>}
            </span>
            {o.value === value && <Check size={14} weight="bold" className="shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
