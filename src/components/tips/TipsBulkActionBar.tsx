import { ArrowCounterClockwise, CheckSquare, CircleNotch, Table, XCircle, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TipsBulkActionBarProps {
  count: number;
  loading: boolean;
  /** Na aba "Caíram" a única ação é devolver pra fila. */
  variant: "pending" | "caiu";
  onPlanilhar: () => void;
  onDismiss: () => void;
  onUndismiss: () => void;
  onCancel: () => void;
}

// Mesmo botão da barra de Apostas: símbolo + rótulo curto, altura de toque
// confortável e spinner no lugar do ícone enquanto o lote roda.
function BulkActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  pending,
  className,
}: {
  icon: Icon;
  label: string;
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
        "h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors disabled:pointer-events-none",
        disabled && !pending && "opacity-40",
        className,
      )}
    >
      {pending ? <CircleNotch size={20} className="animate-spin" /> : <Icon size={20} />}
      <span className="truncate">{label}</span>
    </button>
  );
}

export function TipsBulkActionBar({
  count,
  loading,
  variant,
  onPlanilhar,
  onDismiss,
  onUndismiss,
  onCancel,
}: TipsBulkActionBarProps) {
  if (count === 0) return null;

  const plural = count === 1 ? "" : "s";

  return (
    <div
      role="toolbar"
      aria-label="Ações das tips selecionadas"
      className={cn(
        "fixed z-50 p-3 space-y-3 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 duration-200",
        "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
        "md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-full md:max-w-[480px]",
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <CheckSquare size={18} weight="fill" className="text-accent shrink-0" />
          <span aria-live="polite" className="text-base font-semibold text-white truncate">
            {count} selecionada{plural}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="shrink-0 h-8 px-4 rounded-lg text-sm text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-45 disabled:pointer-events-none transition-colors"
        >
          Cancelar
        </button>
      </div>

      {variant === "pending" ? (
        <div className="grid grid-cols-2 gap-2">
          <BulkActionButton
            icon={Table}
            label="Planilhar"
            onClick={onPlanilhar}
            disabled={loading}
            className="bg-green-500/[0.12] border border-green-500/25 text-green-400 hover:bg-green-500/20"
          />
          <BulkActionButton
            icon={XCircle}
            label="Caiu"
            onClick={onDismiss}
            disabled={loading}
            pending={loading}
            className="bg-red-500/[0.12] border border-red-500/25 text-red-400 hover:bg-red-500/20"
          />
        </div>
      ) : (
        <BulkActionButton
          icon={ArrowCounterClockwise}
          label="Devolver para a fila"
          onClick={onUndismiss}
          disabled={loading}
          pending={loading}
          className="w-full bg-white/[0.06] border border-white/10 text-zinc-200 hover:bg-white/[0.1]"
        />
      )}
    </div>
  );
}
