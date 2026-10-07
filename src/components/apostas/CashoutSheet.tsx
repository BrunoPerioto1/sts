import { useState } from "react";
import { Input } from "@/components/ui/input";
import { FormField, FormSheet } from "@/components/ui/form-sheet";

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

  return (
    <FormSheet
      nested
      open={open}
      onOpenChange={(o) => {
        if (!o) setValue("");
        onOpenChange(o);
      }}
      title="Cashout"
      submitLabel="Confirmar"
      submitDisabled={!valid}
      onSubmit={() => {
        onConfirm(numeric);
        setValue("");
        onOpenChange(false);
      }}
    >
      <FormField label="Valor recebido (R$)" htmlFor="cashout-value-mobile">
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
      </FormField>
    </FormSheet>
  );
}
