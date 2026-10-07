import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: ReactNode;
  /** Quantidade ao lado do título ("Em uso 12"). */
  count?: number;
  /** Ícone pequeno logo depois do título (ex.: escudo da seção de admin). */
  icon?: ReactNode;
  /** Ação alinhada à direita (ex.: "Selecionar todas"). */
  action?: ReactNode;
  /** h2 por padrão; `p` quando o rótulo não abre uma seção da página. */
  as?: "h2" | "h3" | "p";
  className?: string;
}

/**
 * Título de seção, um padrão só pro app inteiro: "Conta", "Em uso",
 * "A iniciar", "Lucro líquido". Caixa alta pequena e apagada — organiza a
 * tela sem competir com o conteúdo.
 */
export function SectionLabel({ children, count, icon, action, as: Tag = "h2", className }: SectionLabelProps) {
  return (
    <div className={cn("flex items-center gap-2 px-1 min-h-5", className)}>
      <Tag className="flex items-center gap-1.5 min-w-0 text-xs font-medium uppercase tracking-wider text-muted">
        <span className="truncate">{children}</span>
        {icon}
        {count !== undefined && <span className="tabular-nums font-normal">{count}</span>}
      </Tag>
      {action && <div className="ml-auto shrink-0">{action}</div>}
    </div>
  );
}
