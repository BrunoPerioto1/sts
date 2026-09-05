import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react";

import { createTransaction } from "@/api/routes/get-transaction";
import { getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseId: number;
}

const TYPE_ICON: Record<string, typeof ArrowDownLeft> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  ADJUSTMENT: SlidersHorizontal,
};

const TYPE_LABEL: Record<string, string> = {
  DEPOSIT: "Depósito",
  WITHDRAWAL: "Saque",
  ADJUSTMENT: "Ajuste",
};

export function NovaTransacaoModal({ isOpen, onClose, houseId }: NovaTransacaoModalProps) {
  const [novaMov, setNovaMov] = useState({ tipoId: 0, valor: "" });
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getTransactionTypes()
      .then((txTypes) => {
        setTypes(txTypes);
        if (txTypes[0]) setNovaMov((prev) => ({ ...prev, tipoId: txTypes[0].id }));
      })
      .catch(() => undefined);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMov.valor || !novaMov.tipoId) return;

    const value = Number(novaMov.valor.replace(",", "."));
    if (isNaN(value) || value <= 0) return;

    setLoading(true);
    try {
      await createTransaction({ houseId, transactionTypeId: novaMov.tipoId, value });
      setNovaMov({ tipoId: types[0]?.id || 0, valor: "" });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={novaMov.tipoId.toString()} onValueChange={(value) => setNovaMov((prev) => ({ ...prev, tipoId: parseInt(value) }))}>
              <SelectTrigger><SelectValue placeholder="Selecione um tipo" /></SelectTrigger>
              <SelectContent>
                {types.map((t) => {
                  const Icon = TYPE_ICON[t.name] ?? SlidersHorizontal;
                  return (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      <span className="inline-flex items-center gap-2">
                        <Icon size={14} /> {TYPE_LABEL[t.name] ?? t.name}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Valor</Label>
            <Input placeholder="0,00" value={novaMov.valor} onChange={(e) => setNovaMov((prev) => ({ ...prev, valor: e.target.value }))} />
          </div>

          <div className="flex gap-2 justify-end mt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>{loading ? "Enviando…" : "Adicionar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
