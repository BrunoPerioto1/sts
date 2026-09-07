import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal, WarningCircle } from "@phosphor-icons/react";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  casaNome: string;
  houseId: number;
}

const TYPE_MAP: Record<string, { label: string; icon: typeof ArrowDownLeft }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight },
  ADJUSTMENT: { label: "Ajuste", icon: SlidersHorizontal },
};

export function MovimentacaoModal({ isOpen, onClose, casaNome, houseId }: MovimentacaoModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico — {casaNome}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: "color-mix(in srgb, var(--color-text) 8%, transparent)" }} />
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
        ) : movimentacoes.length === 0 ? (
          <EmptyState bare title="Nenhuma movimentação" description="Depósitos e saques desta casa aparecem aqui." />
        ) : (
          <table className="table w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal">Data</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal">Tipo</th>
                <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((mov) => {
                  const meta = TYPE_MAP[mov.transactionType] ?? { label: mov.transactionType, icon: SlidersHorizontal };
                  const Icon = meta.icon;
                  return (
                    <tr key={mov.id} className="border-b border-border hover:bg-foreground/[0.04]">
                      <td className="py-2 opacity-70 text-sm">
                        {formatDate(mov.createdAt)}{" "}
                        <span className="opacity-50">{formatTime(mov.createdAt)}</span>
                      </td>
                      <td className="py-2">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Icon size={14} className="text-accent" /> {meta.label}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">{formatCurrency(mov.value)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
