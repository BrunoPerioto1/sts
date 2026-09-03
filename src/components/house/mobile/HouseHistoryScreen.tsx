import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CaretLeft, SlidersHorizontal, WarningCircle } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { getTransactions, type TransactionDto } from "@/api/routes/get-transaction";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";

const TYPE_META: Record<string, { label: string; icon: typeof ArrowDownLeft }> = {
  DEPOSIT: { label: "Depósito", icon: ArrowDownLeft },
  WITHDRAWAL: { label: "Saque", icon: ArrowUpRight },
  ADJUSTMENT: { label: "Ajuste", icon: SlidersHorizontal },
};

function dayLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Hoje";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

interface HouseHistoryScreenProps {
  house: HouseBalanceDto;
  onBack: () => void;
}

export function HouseHistoryScreen({ house, onBack }: HouseHistoryScreenProps) {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTransactions({ houseId: house.houseId })
      .then((txs) => setTransactions(txs || []))
      .catch(() => setError("Não foi possível carregar o histórico."))
      .finally(() => setLoading(false));
  }, [house.houseId]);

  const entrou = transactions.filter((t) => Number(t.value) > 0).reduce((sum, t) => sum + Number(t.value), 0);
  const saiu = transactions.filter((t) => Number(t.value) < 0).reduce((sum, t) => sum + Number(t.value), 0);

  // Saldo resultante = soma corrida das movimentações (não inclui lucro de apostas),
  // calculada da mais antiga pra mais recente e depois exibida em ordem reversa.
  const ascending = [...transactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let running = 0;
  const withRunningBalance = ascending.map((t) => {
    running += Number(t.value);
    return { ...t, runningBalance: running };
  });
  const descending = [...withRunningBalance].reverse();

  const groups: { day: string; items: typeof descending }[] = [];
  for (const t of descending) {
    const label = dayLabel(t.createdAt);
    const last = groups[groups.length - 1];
    if (last && last.day === label) last.items.push(t);
    else groups.push({ day: label, items: [t] });
  }

  return (
    <div
      className="fixed inset-0 z-50 isolate flex flex-col overscroll-contain bg-background"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <div className="flex items-center gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3">
        <button type="button" onClick={onBack} aria-label="Voltar" className="p-1 -ml-1 text-zinc-400 hover:text-white">
          <CaretLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-[19px] font-semibold truncate">Histórico</h1>
          <p className="text-[12.5px] text-zinc-500 truncate">
            {house.houseName} · {transactions.length} movimentaç{transactions.length === 1 ? "ão" : "ões"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Entrou</p>
            <p className="text-[19px] font-medium tabular-nums text-positive">{formatSignedCurrency(entrou)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Saiu</p>
            <p className="text-[19px] font-medium tabular-nums text-negative">{formatCurrency(saiu)}</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 pt-2">
            {[80, 60, 70].map((w, i) => (
              <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: "color-mix(in srgb, var(--color-text) 8%, transparent)" }} />
            ))}
          </div>
        ) : error ? (
          <div
            className="flex items-start gap-2 rounded-md p-3 text-[13px]"
            style={{ background: "var(--color-surface)", boxShadow: "inset 2px 0 0 var(--color-negative)" }}
          >
            <WarningCircle size={18} className="text-negative shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center py-10 text-[12.5px] opacity-55">Nenhuma movimentação registrada</p>
        ) : (
          groups.map((g) => (
            <div key={g.day}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1.5">{g.day}</p>
              <div className="flex flex-col gap-1">
                {g.items.map((t) => {
                  const meta = TYPE_META[t.transactionType] ?? { label: t.transactionType, icon: SlidersHorizontal };
                  const Icon = meta.icon;
                  const value = Number(t.value);
                  return (
                    <div key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-3 min-h-[56px]">
                      <Icon size={18} className="text-accent shrink-0" />
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] text-white truncate">{meta.label}</span>
                        <span className="block text-[13px] text-zinc-500 truncate">
                          {new Date(t.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className={`block text-[15px] font-medium tabular-nums ${value >= 0 ? "text-positive" : "text-negative"}`}>
                          {formatSignedCurrency(value)}
                        </span>
                        <span className="block text-[13px] text-zinc-500 tabular-nums">{formatCurrency(t.runningBalance)}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
