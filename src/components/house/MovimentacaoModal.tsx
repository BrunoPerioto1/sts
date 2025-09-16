import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  casaNome: string;
  houseId: number;
}

export function MovimentacaoModal({
  isOpen,
  onClose,
  casaNome,
  houseId
}: MovimentacaoModalProps) {
  const [movimentacoes, setMovimentacoes] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const txs = await getTransactions({ houseId });
        setMovimentacoes(txs || []);
      } catch (e: any) {
        setError(e.message || "Falha ao carregar movimentações");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isOpen, houseId]);

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));

  const getTipo = (tipo: string) => {
    switch (tipo) {
      case "DEPOSIT":
        return {
          label: "DEPÓSITO",
          color: "bg-green-100 text-green-800"
        };
      case "WITHDRAWAL":
        return {
          label: "SAQUE",
          color: "bg-red-100 text-red-800"
        };
      case "ADJUSTMENT":
        return {
          label: "AJUSTE",
          color: "bg-blue-100 text-blue-800"
        };
      default:
        return {
          label: "OUTRO",
          color: "bg-gray-100 text-gray-700"
        };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[70vh] overflow-y-auto rounded-xl shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Histórico - {casaNome}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-600 font-medium">{error}</div>
        ) : movimentacoes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">Nenhuma movimentação registrada</div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="border border-gray-200 rounded-lg">
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((mov) => {
                    const tipo = getTipo(mov.transactionType);
                    return (
                      <TableRow key={mov.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="py-2">
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(mov.createdAt).toLocaleDateString("pt-BR")}{" "}
                            <span className="text-xs text-gray-400">
                              {new Date(mov.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge className={cn("text-xs px-2 py-1 rounded-lg font-medium", tipo.color)}>
                            {tipo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-2 font-semibold text-gray-800">
                           {formatCurrency(mov.value)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
