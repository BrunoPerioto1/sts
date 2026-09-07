import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CashoutDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cashout</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cashout-value" className="text-xs">Valor recebido (R$)</Label>
          <Input
            id="cashout-value"
            type="number"
            step="0.01"
            autoFocus
            placeholder="Ex: 45.00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!value || Number.isNaN(Number(value))}
            onClick={() => {
              onConfirm(Number(value));
              setValue("");
              onClose();
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
