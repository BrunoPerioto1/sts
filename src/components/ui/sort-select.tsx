import { ArrowsDownUp, CaretDown, Check } from "@phosphor-icons/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet } from "@/components/apostas/BottomSheet";

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
 * da lista. Desktop abre menu; celular abre bottom sheet (o menu com dica
 * em duas linhas não cabia na largura e saía da tela).
 */
export function SortSelect<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className,
  label,
}: {
  options: readonly SortOption<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  /** Rótulo apagado antes do valor ("Ordenar Saldo"), pra versão em caixa. */
  label?: string;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const triggerClass = cn(
    "press h-9 px-1.5 -mx-1.5 rounded-md flex items-center gap-1.5 text-[13px] text-zinc-400 whitespace-nowrap hover:text-foreground disabled:opacity-50",
    className,
  );
  const triggerContent = (
    <>
      <ArrowsDownUp size={14} />
      {label ? (
        <>
          <span className="text-zinc-500">{label}</span>
          <span className="text-zinc-300">{current.label}</span>
        </>
      ) : (
        current.label
      )}
      <CaretDown size={11} />
    </>
  );

  if (isMobile) {
    return (
      <>
        <button type="button" disabled={disabled} aria-label={`Ordenar: ${current.label}`} onClick={() => setOpen(true)} className={triggerClass}>
          {triggerContent}
        </button>
        <BottomSheet open={open} onOpenChange={setOpen} title="Ordenar por">
          <div className="pb-4">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className="press flex min-h-[48px] w-full items-center gap-3 border-b border-border py-2 text-left last:border-b-0"
              >
                <span className="flex-1 min-w-0">
                  <span className={cn("block text-sm", o.value === value ? "font-semibold text-foreground" : "text-zinc-300")}>{o.label}</span>
                  {o.hint && <span className="block text-xs text-zinc-500">{o.hint}</span>}
                </span>
                {o.value === value && <Check size={16} weight="bold" className="shrink-0 text-accent-text" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={disabled} aria-label={`Ordenar: ${current.label}`} className={triggerClass}>
        {triggerContent}
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
