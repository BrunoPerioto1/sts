import { useEffect, useState, type ComponentType } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, XCircle, Clock, Trash, CheckSquare, CircleNotch } from "@phosphor-icons/react";
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

function BulkActionButton({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
  disabled,
  pending,
  className,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
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
        "h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors disabled:pointer-events-none",
        disabled && !pending && "opacity-40",
        className
      )}
    >
      {pending ? <CircleNotch size={16} className="animate-spin" /> : <Icon size={16} />}
      <span className="text-[12px] font-medium">{label}</span>
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
          "fixed z-50 p-3 space-y-3 rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-md",
          "animate-in slide-in-from-bottom-4 duration-200",
          "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
          "md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-full md:max-w-[480px]"
        )}
        style={{ boxShadow: "var(--shadow-lg)" }}
      >
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <CheckSquare size={18} weight="fill" className="text-accent shrink-0" />
            <span aria-live="polite" className="text-[15px] font-semibold text-white truncate">
              {count} selecionada{plural}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="shrink-0 h-8 px-4 rounded-lg text-[13px] text-zinc-300 bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-45 disabled:pointer-events-none transition-colors"
          >
            Cancelar
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <BulkActionButton
            icon={CheckCircle}
            label="Ganha"
            ariaLabel={`Marcar ${count} aposta${plural} como ganha`}
            onClick={() => handleStatus("won", ResultIdEnum.WON)}
            disabled={loading}
            pending={pendingAction === "won"}
            className="bg-green-500/[0.12] border border-green-500/25 text-green-400 hover:bg-green-500/20"
          />
          <BulkActionButton
            icon={XCircle}
            label="Perdida"
            ariaLabel={`Marcar ${count} aposta${plural} como perdida`}
            onClick={() => handleStatus("lost", ResultIdEnum.LOST)}
            disabled={loading}
            pending={pendingAction === "lost"}
            className="bg-red-500/[0.12] border border-red-500/25 text-red-400 hover:bg-red-500/20"
          />
          <BulkActionButton
            icon={Clock}
            label="Pendente"
            ariaLabel={`Marcar ${count} aposta${plural} como pendente`}
            onClick={() => handleStatus("pending", ResultIdEnum.PENDING)}
            disabled={loading}
            pending={pendingAction === "pending"}
            className="bg-white/[0.06] border border-white/10 text-zinc-200 hover:bg-white/[0.1]"
          />
          <BulkActionButton
            icon={Trash}
            label="Excluir"
            ariaLabel={`Excluir ${count} aposta${plural}`}
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            pending={pendingAction === "delete"}
            className="bg-red-500 text-white hover:bg-red-600"
          />
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {count} aposta{plural}?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir {count} aposta{plural} selecionada{plural}. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
