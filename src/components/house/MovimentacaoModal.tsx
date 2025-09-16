import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";
import { TransactionTypeEnum } from "@/api/routes/get-type-trasaction";

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

  const getTipoIcon = (tipo: number) => {
    switch (tipo) {
      case TransactionTypeEnum.DEPOSIT:
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case TransactionTypeEnum.WITHDRAWAL:
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case TransactionTypeEnum.ADJUSTMENT:
        return <RefreshCcw className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const getTipoColor = (tipo: number) => {
    switch (tipo) {
      case TransactionTypeEnum.DEPOSIT:
        return "bg-success/10 text-success";
      case TransactionTypeEnum.WITHDRAWAL:
        return "bg-destructive/10 text-destructive";
      case TransactionTypeEnum.ADJUSTMENT:
        return "bg-muted/10 text-muted-foreground";
      default:
        return "bg-muted/10 text-muted-foreground";
    }
  };

  const getTipoLabel = (tipo: number) => {
    switch (tipo) {
      case TransactionTypeEnum.DEPOSIT:
        return "DEPÓSITO";
      case TransactionTypeEnum.WITHDRAWAL:
        return "SAQUE";
      case TransactionTypeEnum.ADJUSTMENT:
        return "AJUSTE";
      default:
        return "OUTRO";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Histórico - {casaNome}</span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">{error}</div>
        ) : movimentacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma movimentação registrada</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimentacoes
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm">{new Date(mov.createdAt).toLocaleDateString("pt-BR")}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(mov.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipoIcon(mov.transactionType)}
                          <Badge className={cn("text-xs", getTipoColor(mov.transactionType))}>
                            {getTipoLabel(mov.transactionType)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{mov.houseName} - #{mov.id}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {(mov.transactionType === TransactionTypeEnum.DEPOSIT ? "+" : mov.transactionType === TransactionTypeEnum.WITHDRAWAL ? "-" : "")} {formatCurrency(mov.value)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
