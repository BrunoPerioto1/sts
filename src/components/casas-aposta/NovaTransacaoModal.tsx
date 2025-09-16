import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction } from "@/api/routes/create-transaction";
import { getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-type-trasaction";

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: HouseBalanceDto;
}

export function NovaTransacaoModal({ isOpen, onClose, house }: NovaTransacaoModalProps) {
  const [novaMov, setNovaMov] = useState({ tipoId: 0, valor: "" });
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTypes = async () => {
      try {
        const txTypes = await getTransactionTypes();
        setTypes(txTypes);
        if (txTypes[0]) setNovaMov(prev => ({ ...prev, tipoId: txTypes[0].id }));
      } catch (err) {
        console.error("Erro ao carregar tipos de transação:", err);
      }
    };

    loadTypes();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMov.valor || !novaMov.tipoId) return;

    setLoading(true);
    try {
      await createTransaction({
        houseId: house.houseId,
        transactionTypeId: novaMov.tipoId,
        value: parseFloat(novaMov.valor),
      });

      // Reset e fechar modal
      setNovaMov({ tipoId: types[0]?.id || 0, valor: "" });
      onClose();
    } catch (err) {
      console.error("Erro ao criar transação:", err);
      alert("Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Transação - {house.houseName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={novaMov.tipoId.toString()}
              onValueChange={value =>
                setNovaMov(prev => ({ ...prev, tipoId: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {types.map(t => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Valor</label>
            <Input
              type="number"
              step="0.01"
              placeholder="0,00"
              value={novaMov.valor}
              onChange={e => setNovaMov(prev => ({ ...prev, valor: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Adicionar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
