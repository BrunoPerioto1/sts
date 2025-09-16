import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { createTransaction } from "@/api/routes/get-transaction";
import { getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseId: number;
}

export function NovaTransacaoModal({ isOpen, onClose, houseId }: NovaTransacaoModalProps) {
  const [novaMov, setNovaMov] = useState({ tipoId: 0, valor: "" });
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadTypes = async () => {
      try {
        const txTypes = await getTransactionTypes();
        setTypes(txTypes);
        if (txTypes[0]) {
          setNovaMov(prev => ({ ...prev, tipoId: txTypes[0].id }));
        }
      } catch (err) {
        console.error("Erro ao carregar tipos de transação:", err);
      }
    };

    loadTypes();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMov.valor || !novaMov.tipoId) return;

    const value = Number(novaMov.valor.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      alert("Informe um valor válido maior que zero.");
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        houseId,
        transactionTypeId: novaMov.tipoId,
        value
      });

      // Reset e fechar modal
      setNovaMov({ tipoId: types[0]?.id || 0, valor: "" });
      onClose();
    } catch (err: any) {
      console.error("Erro ao criar transação:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Erro ao criar transação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
      

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Tipo de transação */}
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select
              value={novaMov.tipoId.toString()}
              onValueChange={value =>
                setNovaMov(prev => ({ ...prev, tipoId: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
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

          {/* Valor */}
          <div>
            <label className="text-sm font-medium">Valor</label>
            <Input
              type="text"
              placeholder="0,00"
              value={novaMov.valor}
              onChange={e => setNovaMov(prev => ({ ...prev, valor: e.target.value }))}
            />
          </div>

          {/* Botões */}
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
