import { useEffect, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { BulkActionButton, BulkActionShell } from "./BulkActionShell";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Trash } from "@phosphor-icons/react";
import { ResultIdEnum } from "@/api/routes/get-bets";

interface BulkActionBarProps {
  count: number;
  loading: boolean;
  onSetStatus: (resultId: ResultIdEnum) => void;
  onDelete: () => void;
  onCancel: () => void;
}

type PendingAction = "won" | "lost" | "pending" | "delete" | null;

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
      {/* Só o símbolo: as quatro ações são reconhecíveis pelo ícone + cor e o
          texto embaixo duplicava a informação num espaço apertado. */}
      <BulkActionShell count={count} loading={loading} ariaLabel="Ações em lote" onCancel={onCancel}>
        <div className="grid grid-cols-4 gap-2">
          <BulkActionButton
            icon={CheckCircle}
            label={`Marcar ${count} aposta${plural} como ganha`}
            onClick={() => handleStatus("won", ResultIdEnum.WON)}
            disabled={loading}
            pending={pendingAction === "won"}
            className="bg-green-500/[0.12] border border-green-500/25 text-green-400 hover:bg-green-500/20"
          />
          <BulkActionButton
            icon={XCircle}
            label={`Marcar ${count} aposta${plural} como perdida`}
            onClick={() => handleStatus("lost", ResultIdEnum.LOST)}
            disabled={loading}
            pending={pendingAction === "lost"}
            className="bg-red-500/[0.12] border border-red-500/25 text-red-400 hover:bg-red-500/20"
          />
          <BulkActionButton
            icon={Clock}
            label={`Marcar ${count} aposta${plural} como pendente`}
            onClick={() => handleStatus("pending", ResultIdEnum.PENDING)}
            disabled={loading}
            pending={pendingAction === "pending"}
            className="bg-foreground/[0.06] border border-foreground/10 text-zinc-200 hover:bg-foreground/[0.1]"
          />
          <BulkActionButton
            icon={Trash}
            label={`Excluir ${count} aposta${plural}`}
            onClick={() => setConfirmOpen(true)}
            disabled={loading}
            pending={pendingAction === "delete"}
            className="bg-red-500 text-white hover:bg-red-600"
          />
        </div>
      </BulkActionShell>

      {/* Confirmacao no mesmo padrao dos outros sheets do app: sobe de baixo,
          na altura do polegar. O dialogo centralizado era o unico que ainda
          aparecia no meio da tela. */}
      <BottomSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Excluir ${count} aposta${plural}?`}
        footer={
          <div className="flex flex-col gap-2">
            <Button variant="destructive" className="w-full min-h-[48px] text-base" onClick={handleConfirmDelete}>
              Excluir {count} aposta{plural}
            </Button>
            <Button variant="ghost" className="w-full min-h-[44px]" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
          </div>
        }
      >
        <p className="pb-4 text-sm text-zinc-400">
          As apostas somem da lista e do histórico, e o lucro do período é recalculado sem elas. Não dá pra desfazer.
        </p>
      </BottomSheet>
    </>
  );
}
