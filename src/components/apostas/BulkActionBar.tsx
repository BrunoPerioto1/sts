import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckCircle, XCircle, Clock, Trash, CircleNotch, type Icon } from "@phosphor-icons/react";
import { ResultIdEnum } from "@/api/routes/get-bets";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  count: number;
  loading: boolean;
  onSetStatus: (resultId: ResultIdEnum) => void;
  onDelete: () => void;
  onCancel: () => void;
}

type PendingAction = "won" | "lost" | "pending" | "delete" | null;

// Mobile: só o símbolo, ícone + cor bastam no espaço apertado. Desktop: barra
// numa linha só, com rótulo ao lado do ícone. `aria-label` nomeia o botão.
function BulkActionButton({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
  disabled,
  pending,
  className,
}: {
  icon: Icon;
  label: string;
  ariaLabel: string;
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
      aria-label={ariaLabel}
      className={cn(
        "h-12 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:pointer-events-none",
        "md:h-9 md:px-3 md:rounded-lg md:text-sm md:font-medium",
        disabled && !pending && "opacity-40",
        className
      )}
    >
      {pending ? <CircleNotch size={20} className="animate-spin" /> : <Icon size={20} />}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

export function BulkActionBar({ count, loading, onSetStatus, onDelete, onCancel }: BulkActionBarProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!loading) setPendingAction(null);
  }, [loading]);

  if (count === 0) return null;

  const plural = count === 1 ? "" : "s";

  const handleStatus = (action: PendingAction, resultId: ResultIdEnum) => {
    setPendingAction(action);
    onSetStatus(resultId);
  };

  const handleConfirmDelete = () => {
    setConfirmOpen(false);
    setPendingAction("delete");
    onDelete();
  };

  return (
    <>
      <div
        role="toolbar"
        aria-label="Ações em lote"
        className={cn(
          "fixed z-50 p-3 space-y-3 rounded-2xl border border-foreground/10 bg-zinc-900/95 backdrop-blur-md",
          "animate-in slide-in-from-bottom-4 duration-200",
          "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
          "md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6",
          "md:flex md:items-center md:gap-3 md:space-y-0 md:p-2 md:pl-4 md:rounded-xl md:whitespace-nowrap"
        )}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        {/* No desktop vira `contents`: contagem e Limpar entram na mesma
            linha dos botões, Limpar no fim. */}
        <div className="flex items-center justify-between gap-3 px-1 md:contents">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle size={18} weight="fill" className="text-accent shrink-0" />
            <span aria-live="polite" className="text-base font-semibold text-foreground truncate md:text-sm">
              {count} selecionada{plural}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="shrink-0 h-8 px-4 rounded-lg md:order-last md:h-9 text-sm text-zinc-300 bg-foreground/[0.06] hover:bg-foreground/[0.1] disabled:opacity-45 disabled:pointer-events-none transition-colors"
          >
            Limpar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 md:flex">
          <BulkActionButton
            icon={CheckCircle}
            label="Ganha"
            ariaLabel={`Marcar ${count} aposta${plural} como ganha`}
            onClick={() => handleStatus("won", ResultIdEnum.WON)}
            disabled={loading}
            pending={pendingAction === "won"}
            className="bg-success/[0.12] border border-success/25 text-success hover:bg-success/20"
          />
          <BulkActionButton
            icon={XCircle}
            label="Perdida"
            ariaLabel={`Marcar ${count} aposta${plural} como perdida`}
            onClick={() => handleStatus("lost", ResultIdEnum.LOST)}
            disabled={loading}
            pending={pendingAction === "lost"}
            className="bg-danger/[0.12] border border-danger/25 text-danger hover:bg-danger/20"
          />
          <BulkActionButton
            icon={Clock}
            label="Pendente"
            ariaLabel={`Marcar ${count} aposta${plural} como pendente`}
            onClick={() => handleStatus("pending", ResultIdEnum.PENDING)}
            disabled={loading}
            pending={pendingAction === "pending"}
            className="bg-foreground/[0.06] border border-foreground/10 text-zinc-200 hover:bg-foreground/[0.1]"
          />
          <BulkActionButton
            icon={Trash}
            label="Excluir"
            ariaLabel={`Excluir ${count} aposta${plural}`}
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            pending={pendingAction === "delete"}
            className="bg-danger-solid text-white hover:bg-danger-solid/90"
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${count} aposta${plural}?`}
        description="As apostas somem da lista e do histórico, e o lucro do período é recalculado sem elas. Não dá pra desfazer."
        confirmLabel={`Excluir ${count} aposta${plural}`}
        destructive
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
