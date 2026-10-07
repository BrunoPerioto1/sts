import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormSheet } from "@/components/ui/form-sheet";
import { Segmented } from "@/components/ui/segmented";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction, getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";
import { centsToDisplay, formatMoney, houseDisplayName } from "@/lib/format";

const TYPE_META: Record<string, { label: string; icon: typeof ArrowDownLeft; submitLabel: string }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, submitLabel: "Adicionar depósito" },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight, submitLabel: "Registrar saque" },
  ADJUSTMENT: { label: "Saldo real", icon: SlidersHorizontal, submitLabel: "Ajustar saldo" },
};

const QUICK_AMOUNTS = [50, 100, 500];

interface NovaMovimentacaoSheetProps {
  house: HouseBalanceDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovaMovimentacaoSheet({ house, onClose, onSuccess }: NovaMovimentacaoSheetProps) {
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [typed, setTyped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!house) return;
    setCents(0);
    setTyped(false);
    getTransactionTypes()
      .then((txTypes) => {
        // Ordem fixa: a API devolve ADJUSTMENT primeiro e o modal abria com
        // "Saldo real" marcado. Deposito e o caso comum, entao vem na frente.
        const ORDER = ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"];
        const sorted = [...txTypes].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
        setTypes(sorted);
        setTypeId(sorted[0]?.id ?? null);
      })
      .catch(() => undefined);
  }, [house]);

  if (!house) return null;

  const selectedType = types.find((t) => t.id === typeId);
  const meta = selectedType ? TYPE_META[selectedType.name] : undefined;
  const numericValue = cents / 100;
  // `houseBalance` vem clampado em zero pelo backend; casa no vermelho
  // projetaria o saldo errado depois do depósito.
  const balance = Number(house.realHouseBalance);
  const projectedBalance = selectedType?.name === "WITHDRAWAL" ? balance - numericValue : balance + numericValue;
  // A casa mostra o saldo ja' sem o stake das apostas em aberto; aqui a
  // pendente ainda conta (lucro null). "Saldo real" e "Tudo" usam o disponivel.
  const openStake = Number(house.openStake ?? 0);
  const available = balance - openStake;
  // "Saldo real": o valor digitado e' o saldo que a casa mostra; grava so' a
  // diferenca como ajuste. Fecha casa no vermelho por deposito nunca lancado.
  const isAdjust = selectedType?.name === "ADJUSTMENT";
  const diff = Math.round(cents - available * 100) / 100;
  const valid = isAdjust ? typed && diff !== 0 : numericValue > 0;

  const addAmount = (amount: number) => {
    setTyped(true);
    setCents((c) => c + amount * 100);
  };

  const useFullBalance = () => {
    setTyped(true);
    setCents(Math.round(Math.max(available, 0) * 100));
  };

  const handleSubmit = async () => {
    if (!typeId || !valid) return;
    setLoading(true);
    try {
      await createTransaction({ houseId: house.houseId, transactionTypeId: typeId, value: isAdjust ? diff : numericValue });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormSheet
      nested
      open={!!house}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Nova movimentação"
      submitLabel={meta?.submitLabel ?? "Confirmar"}
      submitting={loading}
      submittingLabel="Enviando…"
      submitDisabled={!valid}
      onSubmit={handleSubmit}
    >
      <p className="-mt-2 text-sm text-zinc-500 truncate">{houseDisplayName(house.houseName)}</p>

      <FormField label="Tipo">
        <Segmented
          label="Tipo de movimentação"
          className="flex w-full"
          value={String(typeId ?? "")}
          options={types.map((t) => {
            const m = TYPE_META[t.name] ?? { label: t.name, icon: SlidersHorizontal };
            return { value: String(t.id), label: m.label, icon: m.icon };
          })}
          onChange={(id) => setTypeId(Number(id))}
        />
      </FormField>

      <FormField
        label={isAdjust ? "Saldo na casa" : "Valor"}
        help={
          isAdjust
            ? [
                typed ? `Ajuste ${formatMoney(diff, { signed: true })}` : `Disponível ${formatMoney(available)}`,
                openStake > 0 && `Digite o saldo disponível que a casa mostra. ${formatMoney(openStake)} em apostas abertas já ficam de fora.`,
              ]
                .filter(Boolean)
                .join(" · ")
            : numericValue > 0 && `Saldo passa a ${formatMoney(projectedBalance)}`
        }
      >
        <Input
          inputMode="numeric"
          placeholder="0,00"
          value={typed ? centsToDisplay(cents) : ""}
          onChange={(e) => { setTyped(e.target.value !== ""); setCents(Number(e.target.value.replace(/\D/g, "")) || 0); }}
          className="text-3xl font-semibold h-auto py-2 tabular-nums"
        />
        <div className="flex gap-2 pt-1">
          {QUICK_AMOUNTS.map((amount) => (
            <Button key={amount} type="button" variant="secondary" size="sm" className="rounded-full" onClick={() => addAmount(amount)}>
              +{amount}
            </Button>
          ))}
          <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={useFullBalance}>
            Tudo
          </Button>
        </div>
      </FormField>
    </FormSheet>
  );
}
