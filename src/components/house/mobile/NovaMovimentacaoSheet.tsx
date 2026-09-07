import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction, getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const TYPE_META: Record<string, { label: string; icon: typeof ArrowDownLeft; submitLabel: string }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft, submitLabel: "Adicionar depósito" },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight, submitLabel: "Registrar saque" },
};

const QUICK_AMOUNTS = [50, 100, 500];

// Máscara de valor "de trás pra frente": os dígitos digitados preenchem os
// centavos primeiro (ex: "1050" -> R$ 10,50), padrão comum em apps BR.
function centsToDisplay(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface NovaMovimentacaoSheetProps {
  house: HouseBalanceDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovaMovimentacaoSheet({ house, onClose, onSuccess }: NovaMovimentacaoSheetProps) {
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [cents, setCents] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!house) return;
    setCents(0);
    getTransactionTypes()
      .then((txTypes) => {
        // Só depósito e saque: ajuste manual não é uma opção pro usuário aqui.
        const filtered = txTypes.filter((t) => t.name !== "ADJUSTMENT");
        setTypes(filtered);
        setTypeId(filtered[0]?.id ?? null);
      })
      .catch(() => undefined);
  }, [house]);

  if (!house) return null;

  const selectedType = types.find((t) => t.id === typeId);
  const meta = selectedType ? TYPE_META[selectedType.name] : undefined;
  const numericValue = cents / 100;
  const balance = Number(house.houseBalance);
  const projectedBalance = selectedType?.name === "WITHDRAWAL" ? balance - numericValue : balance + numericValue;

  const addAmount = (amount: number) => {
    setCents((c) => c + amount * 100);
  };

  const useFullBalance = () => {
    setCents(Math.round(Math.max(balance, 0) * 100));
  };

  const handleSubmit = async () => {
    if (!typeId || !(numericValue > 0)) return;
    setLoading(true);
    try {
      await createTransaction({ houseId: house.houseId, transactionTypeId: typeId, value: numericValue });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      nested
      open={!!house}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Nova movimentação"
      titleExtra={
        <span className="text-xs px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 truncate">{house.houseName}</span>
      }
      footer={
        <Button
          className="w-full min-h-[44px] bg-accent text-white font-bold hover:opacity-90 active:opacity-90"
          disabled={loading || !(numericValue > 0)}
          onClick={handleSubmit}
        >
          {loading ? "Enviando…" : meta?.submitLabel ?? "Confirmar"}
        </Button>
      }
    >
      <div className="pb-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1.5">Tipo</p>
          <div className="inline-flex w-full overflow-hidden rounded-md border border-border">
            {types.map((t, i) => {
              const m = TYPE_META[t.name] ?? { label: t.name, icon: SlidersHorizontal };
              const active = t.id === typeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm whitespace-nowrap transition-colors",
                    i > 0 && "border-l border-border",
                    active ? "text-white" : "text-zinc-400 hover:bg-white/[0.04]"
                  )}
                  style={active ? { background: "var(--color-accent)" } : undefined}
                >
                  <m.icon size={14} /> {m.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-1 pb-1.5">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Valor</p>
            {numericValue > 0 && (
              <p className="text-xs text-zinc-500">Saldo passa a {formatCurrency(projectedBalance)}</p>
            )}
          </div>
          <Input
            inputMode="numeric"
            placeholder="0,00"
            value={cents > 0 ? centsToDisplay(cents) : ""}
            onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "")) || 0)}
            className="text-3xl font-semibold h-auto py-2 tabular-nums"
          />
          <div className="flex gap-2 pt-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => addAmount(amount)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-white/10 text-zinc-300 hover:bg-white/[0.06]"
              >
                +{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={useFullBalance}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-white/10 text-zinc-300 hover:bg-white/[0.06]"
            >
              Tudo
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
