import type { ReactNode } from "react";
import { CaretDown, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Contagem dentro do chip, como badge ("Pendentes 40"). */
  count?: number;
  icon?: Icon;
  /** Chip que abre um sheet em vez de alternar: ganha a setinha e vira botão
   *  comum pro leitor de tela. Ativo = filtro fora do padrão. */
  opensSheet?: boolean;
  /** `lg`: 40px, pra tela onde os filtros são o principal controle (Tips). */
  size?: "default" | "lg";
}

/**
 * Chip de filtro, estilo único do app: ativo preenchido de azul, inativo com
 * fundo neutro e borda sutil. 36px de altura visual, mas o alvo de toque
 * estende até 44px.
 */
export function FilterChip({ active, onClick, children, count, icon: IconComponent, opensSheet, size = "default" }: FilterChipProps) {
  const lg = size === "lg";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={opensSheet ? undefined : active}
      className={cn(
        "press relative shrink-0 rounded-full flex items-center font-medium whitespace-nowrap transition-colors",
        lg ? "h-10 px-4 gap-2 text-sm" : "h-9 px-3 gap-1.5 text-[13px]",
        "after:absolute after:inset-x-0 after:-inset-y-1",
        active ? "bg-accent text-white" : "border border-foreground/10 bg-foreground/[0.04] text-zinc-300 hover:text-foreground",
      )}
    >
      {IconComponent && <IconComponent size={lg ? 16 : 14} />}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-px tabular-nums",
            lg ? "text-xs" : "text-[11px]",
            active ? "bg-white/20 text-white" : "bg-foreground/[0.08] text-zinc-200",
          )}
        >
          {count}
        </span>
      )}
      {opensSheet && <CaretDown size={lg ? 12 : 11} className="opacity-60" />}
    </button>
  );
}

/**
 * Faixa de chips que rola de lado em vez de quebrar linha. Sangra até a borda
 * da tela (compensa o padding de 16px do corpo) e sempre abre no começo —
 * por isso o "Todas" vai primeiro, não no fim.
 */
export function FilterChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 overflow-x-auto -mx-4 px-4 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface FilterChipOption<T extends string> {
  value: T;
  label: string;
  count?: number;
  icon?: Icon;
}

/**
 * Filtro de escolha única ("Todas · Ganhas · Pendentes · Perdidas").
 * Convenção: a opção "Todas/Todos" é a primeira de `options`.
 * Ordenação NÃO entra aqui — é <SortSelect>, ao lado.
 */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  trailing,
  className,
}: {
  options: readonly FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Depois dos chips, empurrado pra direita (o <SortSelect>, por exemplo). */
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <FilterChipRow className={className}>
      {options.map((o) => (
        <FilterChip key={o.value} active={value === o.value} count={o.count} icon={o.icon} onClick={() => onChange(o.value)}>
          {o.label}
        </FilterChip>
      ))}
      {trailing && <div className="ml-auto shrink-0 pl-1">{trailing}</div>}
    </FilterChipRow>
  );
}
