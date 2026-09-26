import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowDownLeft, ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { centsToDisplay, formatCurrency } from "@/lib/format";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction, getTransactionTypes, type TransactionTypeDto } from "@/api/routes/get-transaction";
import { HouseDialog } from "./HouseDialog";

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: HouseBalanceDto;
  // "Conciliar" (casa a conferir) abre direto em Saldo real.
  initialType?: "DEPOSIT" | "WITHDRAWAL" | "ADJUSTMENT";
}

const TYPE_META: Record<string, { label: string; icon: typeof ArrowDownLeft }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight },
  ADJUSTMENT: { label: "Saldo real", icon: SlidersHorizontal },
};

export function NovaTransacaoModal({ isOpen, onClose, house, initialType }: NovaTransacaoModalProps) {
  const [types, setTypes] = useState<TransactionTypeDto[]>([]);
  const [typeId, setTypeId] = useState(0);
  const [cents, setCents] = useState(0);
  const [typed, setTyped] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCents(0);
    setTyped(false);
    getTransactionTypes()
      .then((txTypes) => {
        // Ordem fixa: a API devolve ADJUSTMENT primeiro e o modal abria com
        // "Saldo real" marcado. Deposito e o caso comum, entao vem na frente.
        const ORDER = ["DEPOSIT", "WITHDRAWAL", "ADJUSTMENT"];
        const sorted = [...txTypes].sort((a, b) => ORDER.indexOf(a.name) - ORDER.indexOf(b.name));
        setTypes(sorted);
        setTypeId((sorted.find((t) => t.name === initialType) ?? sorted[0])?.id ?? 0);
      })
      .catch(() => undefined);
  }, [isOpen, initialType]);

  // "Saldo real": o usuario digita o que a casa mostra e grava so' a diferenca
  // como ajuste. Fecha casa no vermelho por deposito nunca lancado.
  // A casa mostra o saldo ja' sem o stake das apostas em aberto; aqui a
  // pendente ainda conta como saldo (lucro null). Comparar com o saldo cheio
  // gravava um ajuste negativo do tamanho das pendentes, que ficava pra sempre
  // depois que elas liquidavam.
  const isAdjust = types.find((t) => t.id === typeId)?.name === "ADJUSTMENT";
  const openStake = Number(house.openStake ?? 0);
  const available = Number(house.realHouseBalance) - openStake;
  const diff = Math.round(cents - available * 100) / 100;
  const value = isAdjust ? diff : cents / 100;
  const valid = typeId > 0 && (isAdjust ? typed && diff !== 0 : cents > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    try {
      await createTransaction({ houseId: house.houseId, transactionTypeId: typeId, value });
      setCents(0);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <HouseDialog open={isOpen} onClose={onClose} title="Nova movimentação" houseName={house.houseName}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-45 mb-1.5">Tipo</div>
          {/* Dois botões no lugar do select: com só duas opções, abrir uma lista
              pra escolher entre depósito e saque é um clique a mais por nada. */}
          <div className="grid grid-cols-3 rounded-lg border border-border overflow-hidden divide-x divide-border">
            {types.map((t) => {
              const meta = TYPE_META[t.name] ?? { label: t.name, icon: ArrowDownLeft };
              const Icon = meta.icon;
              const active = t.id === typeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeId(t.id)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                    active ? "bg-foreground/[0.10] text-foreground" : "text-zinc-400 hover:bg-foreground/[0.04] hover:text-zinc-200"
                  )}
                >
                  <Icon size={14} /> {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-45 mb-1.5">{isAdjust ? "Saldo na casa" : "Valor"}</div>
          <div className="flex items-baseline gap-2 border-b border-border pb-2">
            <span className="text-lg opacity-45">R$</span>
            <Input
              autoFocus
              inputMode="numeric"
              placeholder="0,00"
              value={typed ? centsToDisplay(cents) : ""}
              onChange={(e) => { setTyped(e.target.value !== ""); setCents(Number(e.target.value.replace(/\D/g, "")) || 0); }}
              className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-2xl tabular-nums hover:border-0 focus-visible:border-0 focus-visible:outline-none"
            />
            <span className="text-xs opacity-45 shrink-0 whitespace-nowrap">
              {isAdjust && typed
                ? `Ajuste ${diff > 0 ? "+" : ""}${formatCurrency(diff)}`
                : isAdjust
                  ? `Disponível ${formatCurrency(available)}`
                  : `Saldo atual ${formatCurrency(house.realHouseBalance)}`}
            </span>
          </div>
          {isAdjust && openStake > 0 && (
            <p className="text-xs opacity-45 mt-1.5">
              Digite o saldo disponível que a casa mostra. {formatCurrency(openStake)} em apostas abertas já ficam de fora.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" className="text-zinc-400 hover:text-foreground" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!valid || loading} className="bg-accent text-white hover:bg-accent/90">
            {loading ? "Enviando…" : "Adicionar"}
          </Button>
        </div>
      </form>
    </HouseDialog>
  );
}
