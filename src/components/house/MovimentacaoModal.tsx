import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowsDownUp, SlidersHorizontal, WarningCircle, Plus } from "@phosphor-icons/react";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { HouseDialog } from "./HouseDialog";

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  casaNome: string;
  houseId: number;
  onNewTransaction?: () => void;
}

const TYPE_MAP: Record<string, { label: string; icon: typeof ArrowDownLeft; className: string }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, className: "text-positive" },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight, className: "text-negative" },
  ADJUSTMENT: { label: "Ajuste", icon: SlidersHorizontal, className: "opacity-55" },
};

export function MovimentacaoModal({ isOpen, onClose, casaNome, houseId, onNewTransaction }: MovimentacaoModalProps) {
  const [movimentacoes, setMovimentacoes] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setError(null);
    getTransactions({ houseId })
      .then((txs) => setMovimentacoes(txs || []))
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setIsLoading(false));
  }, [isOpen, houseId]);

  const ordered = [...movimentacoes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <HouseDialog open={isOpen} onClose={onClose} title="Histórico" houseName={casaNome}>
      {isLoading ? (
        <div className="space-y-2 py-2">
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="h-3 rounded bg-foreground/[0.08]" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : error ? (
        <div
          className="flex items-start gap-2 rounded-md p-3 text-sm"
          style={{ background: "var(--color-surface)", boxShadow: "inset 2px 0 0 var(--color-negative)" }}
        >
          <WarningCircle size={18} className="text-negative shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Não foi possível carregar o histórico</p>
            <p className="opacity-70 mt-0.5">Estamos com um problema nesta casa. Tente de novo em instantes.</p>
          </div>
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState
          bare
          icon={<ArrowsDownUp size={26} />}
          title="Nenhuma movimentação"
          description="Depósitos e saques desta casa aparecem aqui em ordem cronológica."
          action={
            onNewTransaction && (
              <Button variant="outline" className="gap-2" onClick={onNewTransaction}>
                <Plus size={14} /> Registrar a primeira
              </Button>
            )
          }
        />
      ) : (
        <div>
          {ordered.map((mov) => {
            const meta = TYPE_MAP[mov.transactionType] ?? { label: mov.transactionType, icon: SlidersHorizontal, className: "opacity-55" };
            const Icon = meta.icon;
            const isWithdrawal = mov.transactionType === "WITHDRAWAL";
            return (
              <div key={mov.id} className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0">
                <Icon size={15} className={cn("shrink-0", meta.className)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{meta.label}</p>
                  <p className="text-xs opacity-45">
                    {formatDate(mov.createdAt)} · {formatTime(mov.createdAt)}
                  </p>
                </div>
                <span className={cn("text-sm font-medium tabular-nums shrink-0", meta.className)}>
                  {isWithdrawal ? "−" : "+"}
                  {formatCurrency(mov.value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </HouseDialog>
  );
}
