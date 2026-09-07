import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "./BottomSheet";

// Versão em bottom sheet do CashoutDialog, só pro fluxo mobile do
// LiquidarSheet: o Dialog (radix) empilhado em cima de dois níveis de drawer
// (vaul) do LiquidarSheet/ApostaDetailSheet renderizava quebrado (o
// shouldScaleBackground do vaul transforma o body, e o portal do Dialog
// herdava esse contexto). RowActions (desktop) continua usando o
// CashoutDialog normal — lá não tem nenhum drawer por baixo.
export function CashoutSheet({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState("");
  const numeric = Number(value);
  const valid = value !== "" && !Number.isNaN(numeric);

  const close = () => {
    setValue("");
    onOpenChange(false);
  };

  return (
    <BottomSheet
      nested
      open={open}
      onOpenChange={(o) => {
        if (!o) setValue("");
        onOpenChange(o);
      }}
      title="Cashout"
      footer={
        <div className="flex flex-col gap-2">
          <Button
            className="w-full min-h-[44px] bg-accent text-white font-bold hover:opacity-90 active:opacity-90"
            disabled={!valid}
            onClick={() => {
              onConfirm(numeric);
              close();
            }}
          >
            Confirmar
          </Button>
          <Button variant="outline" className="w-full min-h-[44px]" onClick={close}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="space-y-1.5 pb-4">
        <Label htmlFor="cashout-value-mobile" className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Valor recebido (R$)
        </Label>
        <Input
          id="cashout-value-mobile"
          type="number"
          step="0.01"
          inputMode="decimal"
          autoFocus
          placeholder="Ex: 45,00"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
    </BottomSheet>
  );
}
