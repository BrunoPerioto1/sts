import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownLeft, ArrowUpRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface Movimentacao {
  id: number;
  tipo: "deposito" | "saque" | "aposta" | "premio";
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  saldoAnterior: number;
  saldoAtual: number;
}

interface MovimentacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  casaNome: string;
  saldoAtual: number;
  onNovaMovimentacao?: (movimentacao: Omit<Movimentacao, "id" | "saldoAnterior" | "saldoAtual">) => void;
}

// Carrega histórico real

export function MovimentacaoModal({ 
  isOpen, 
  onClose, 
  casaNome, 
  saldoAtual,
  onNovaMovimentacao 
}: MovimentacaoModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    tipo: "deposito" as const,
    valor: "",
    descricao: ""
  });
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [houseId, setHouseId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Tenta resolver casa pelo nome e buscar transações
        const resolved = await apiFetch<any>(`/house/resolve?texto=${encodeURIComponent(casaNome)}`);
        const resolvedId = Number(resolved?.id ?? resolved?.houseId ?? 0);
        setHouseId(resolvedId || null);
        const txs = await apiFetch<any[]>(`/house/${resolvedId}/transactions`);
        const normalized = txs.map((t: any, idx: number) => ({
          id: Number(t.id ?? idx + 1),
          tipo: (t.tipo ?? t.type ?? "deposito") as Movimentacao["tipo"],
          valor: Number(t.valor ?? t.amount ?? 0),
          data: t.data ?? t.date ?? "",
          hora: t.hora ?? t.time ?? "",
          descricao: t.descricao ?? t.description ?? "",
          saldoAnterior: Number(t.saldoAnterior ?? t.previousBalance ?? 0),
          saldoAtual: Number(t.saldoAtual ?? t.balance ?? 0),
        })) as Movimentacao[];
        setMovimentacoes(normalized);
      } catch (e: any) {
        setError(e.message || "Falha ao carregar movimentações");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isOpen, casaNome]);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "deposito":
      case "premio":
        return <ArrowDownLeft className="h-4 w-4 text-success" />;
      case "saque":
      case "aposta":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "deposito":
        return "bg-blue-100 text-blue-800";
      case "saque":
        return "bg-red-100 text-red-800";
      case "aposta":
        return "bg-orange-100 text-orange-800";
      case "premio":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseId || !novaMovimentacao.valor || !novaMovimentacao.descricao) return;
    const tipoBackend = novaMovimentacao.tipo === "deposito" ? "DEPOSIT" : "WITHDRAWAL";
    try {
      await apiFetch(`/house/transaction`, {
        method: "POST",
        body: JSON.stringify({
          casa_id: houseId,
          tipo: tipoBackend,
          valor: parseFloat(novaMovimentacao.valor),
          descricao: novaMovimentacao.descricao,
        }),
      });
      // reload
      const txs = await apiFetch<any[]>(`/house/${houseId}/transactions`);
      const normalized = txs.map((t: any, idx: number) => ({
        id: Number(t.id ?? idx + 1),
        tipo: (t.tipo ?? t.type ?? "deposito") as Movimentacao["tipo"],
        valor: Number(t.valor ?? t.amount ?? 0),
        data: t.data ?? t.date ?? "",
        hora: t.hora ?? t.time ?? "",
        descricao: t.descricao ?? t.description ?? "",
        saldoAnterior: Number(t.saldoAnterior ?? t.previousBalance ?? 0),
        saldoAtual: Number(t.saldoAtual ?? t.balance ?? 0),
      })) as Movimentacao[];
      setMovimentacoes(normalized);
      setNovaMovimentacao({ tipo: "deposito", valor: "", descricao: "" });
      setShowForm(false);
    } catch (err) {
      // erro silencioso na UI do modal
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Histórico de Movimentação - {casaNome}</span>
            <div className="text-lg font-bold text-primary">
              Saldo: R$ {saldoAtual.toFixed(2)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Movimentações</h3>
            <Button 
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Movimentação
            </Button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <Select 
                    value={novaMovimentacao.tipo} 
                    onValueChange={(value: any) => setNovaMovimentacao(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposito">Depósito</SelectItem>
                      <SelectItem value="saque">Saque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Valor</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={novaMovimentacao.valor}
                    onChange={(e) => setNovaMovimentacao(prev => ({ ...prev, valor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Input
                    placeholder="Descrição da movimentação"
                    value={novaMovimentacao.descricao}
                    onChange={(e) => setNovaMovimentacao(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm">Adicionar</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

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
                    <TableHead className="w-28">Data/Hora</TableHead>
                    <TableHead className="w-24">Tipo</TableHead>
                    <TableHead className="min-w-48">Descrição</TableHead>
                    <TableHead className="w-24 text-right">Valor</TableHead>
                    <TableHead className="w-24 text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimentacoes.sort((a, b) => b.id - a.id).map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="w-28">
                        <div>
                          <p className="font-medium text-sm whitespace-nowrap">{mov.data}</p>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">{mov.hora}</p>
                        </div>
                      </TableCell>
                      <TableCell className="w-24">
                        <div className="flex items-center gap-2">
                          {getTipoIcon(mov.tipo)}
                          <Badge className={cn("text-xs whitespace-nowrap", getTipoColor(mov.tipo))}>
                            {mov.tipo.toUpperCase()}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-48">
                        <div className="max-w-xs">
                          <p className="text-sm break-words">{mov.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell className="w-24 text-right">
                        <span className={cn(
                          "font-medium whitespace-nowrap",
                          mov.valor > 0 ? "text-success" : "text-destructive"
                        )}>
                          {mov.valor > 0 ? '+' : ''}R$ {mov.valor.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="w-24 text-right">
                        <span className="font-medium whitespace-nowrap">
                          R$ {mov.saldoAtual.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}