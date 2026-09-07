import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Sem a moldura tracejada — pra vazios dentro de card/sheet, que já têm borda. */
  bare?: boolean;
  className?: string;
}

/**
 * Estado vazio único do app. Antes cada tela escrevia o seu: a de casas tinha
 * ícone + título + descrição, a de apostas tinha só um `<p>` cinza no meio da
 * página. Mesmo vazio, aparências diferentes.
 */
export function EmptyState({ icon, title, description, action, bare = false, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "animate-fade-in flex flex-col items-center justify-center text-center",
        bare ? "py-10" : "py-16 border border-dashed border-border rounded-md",
        className,
      )}
    >
      {icon && <div className="opacity-35 mb-3">{icon}</div>}
      <h3 className="text-base font-medium mb-1">{title}</h3>
      {description && <p className="text-sm opacity-55 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
