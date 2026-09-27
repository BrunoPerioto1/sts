import type { ReactNode } from "react";
import { CheckSquare, CircleNotch, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Barra flutuante de ações em lote, comum a Apostas e Tips: contador de
// selecionadas + Cancelar em cima, os botões de cada tela embaixo.
export function BulkActionShell({
  count,
  loading,
  ariaLabel,
  onCancel,
  children,
}: {
  count: number;
  loading: boolean;
  ariaLabel: string;
  onCancel: () => void;
  children: ReactNode;
}) {
  const plural = count === 1 ? "" : "s";

  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "fixed z-50 p-3 space-y-3 rounded-2xl border border-foreground/10 bg-zinc-900/95 backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 duration-200",
        "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
        "md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-full md:max-w-[480px]"
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <CheckSquare size={18} weight="fill" className="text-accent shrink-0" />
          <span aria-live="polite" className="text-base font-semibold text-foreground truncate">
            {count} selecionada{plural}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="shrink-0 h-8 px-4 rounded-lg text-sm text-zinc-300 bg-foreground/[0.06] hover:bg-foreground/[0.1] disabled:opacity-45 disabled:pointer-events-none transition-colors"
        >
          Cancelar
        </button>
      </div>

      {children}
    </div>
  );
}

// Altura de toque confortável e spinner no lugar do ícone enquanto o lote
// roda. `showLabel` desliga quando o ícone + cor já bastam (Apostas tem quatro
// ações num espaço apertado); `label` segue como aria-label pro leitor de tela.
export function BulkActionButton({
  icon: Icon,
  label,
  showLabel = false,
  onClick,
  disabled,
  pending,
  className,
}: {
  icon: Icon;
  label: string;
  showLabel?: boolean;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "h-12 rounded-xl flex items-center justify-center transition-colors disabled:pointer-events-none",
        showLabel && "gap-2 text-sm font-medium",
        disabled && !pending && "opacity-40",
        className
      )}
    >
      {pending ? <CircleNotch size={20} className="animate-spin" /> : <Icon size={20} />}
      {showLabel && <span className="truncate">{label}</span>}
    </button>
  );
}
