import { ArrowCounterClockwise, Table, XCircle } from "@phosphor-icons/react";
import { BulkActionButton, BulkActionShell } from "@/components/apostas/BulkActionShell";

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

  return (
    <BulkActionShell count={count} loading={loading} ariaLabel="Ações das tips selecionadas" onCancel={onCancel}>
      {variant === "pending" ? (
        <div className="grid grid-cols-2 gap-2">
          <BulkActionButton
            icon={Table}
            label="Planilhar"
            showLabel
            onClick={onPlanilhar}
            disabled={loading}
            className="bg-green-500/[0.12] border border-green-500/25 text-green-400 hover:bg-green-500/20"
          />
          <BulkActionButton
            icon={XCircle}
            label="Caiu"
            showLabel
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
          showLabel
          onClick={onUndismiss}
          disabled={loading}
          pending={loading}
          className="w-full bg-foreground/[0.06] border border-foreground/10 text-zinc-200 hover:bg-foreground/[0.1]"
        />
      )}
    </BulkActionShell>
  );
}
