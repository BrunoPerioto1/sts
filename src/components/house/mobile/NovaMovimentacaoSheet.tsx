import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { MOVIMENTACAO_META, useNovaMovimentacao } from "@/hooks/house/use-nova-movimentacao";
import { centsToDisplay, formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_AMOUNTS = [50, 100, 500];

interface NovaMovimentacaoSheetProps {
  house: HouseBalanceDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function NovaMovimentacaoSheet({ house, onClose, onSuccess }: NovaMovimentacaoSheetProps) {
  const mov = useNovaMovimentacao(house);

  if (!house) return null;

  const meta = mov.selectedType ? MOVIMENTACAO_META[mov.selectedType.name] : undefined;
  const projectedBalance = mov.selectedType?.name === "WITHDRAWAL" ? mov.balance - mov.amount : mov.balance + mov.amount;

  const addAmount = (amount: number) => mov.setCents((c) => c + amount * 100);

  // "Tudo" usa o disponível: a casa já mostra o saldo sem as apostas em aberto.
  const useFullBalance = () => mov.setCents(Math.round(Math.max(mov.available, 0) * 100));

  const handleSubmit = async () => {
    if (await mov.submit()) onSuccess();
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
          disabled={mov.loading || !mov.valid}
          onClick={handleSubmit}
        >
          {mov.loading ? "Enviando…" : meta?.submitLabel ?? "Confirmar"}
        </Button>
      }
    >
      <div className="pb-4 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1.5">Tipo</p>
          <div className="inline-flex w-full overflow-hidden rounded-md border border-border">
            {mov.types.map((t, i) => {
              const m = MOVIMENTACAO_META[t.name] ?? { label: t.name, icon: MOVIMENTACAO_META.ADJUSTMENT.icon };
              const active = t.id === mov.typeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => mov.setTypeId(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm whitespace-nowrap transition-colors",
                    i > 0 && "border-l border-border",
                    active ? "text-foreground" : "text-zinc-400 hover:bg-foreground/[0.04]"
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
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{mov.isAdjust ? "Saldo na casa" : "Valor"}</p>
            {mov.isAdjust ? (
              <p className="text-xs text-zinc-500">
                {mov.typed
                  ? `Ajuste ${mov.diff > 0 ? "+" : ""}${formatCurrency(mov.diff)}`
                  : `Disponível ${formatCurrency(mov.available)}`}
              </p>
            ) : mov.amount > 0 && (
              <p className="text-xs text-zinc-500">Saldo passa a {formatCurrency(projectedBalance)}</p>
            )}
          </div>
          <Input
            inputMode="numeric"
            placeholder="0,00"
            value={mov.typed ? centsToDisplay(mov.cents) : ""}
            onChange={(e) => mov.onInputChange(e.target.value)}
            className="text-3xl font-semibold h-auto py-2 tabular-nums"
          />
          {mov.isAdjust && mov.openStake > 0 && (
            <p className="text-xs text-zinc-500 px-1 pt-1.5">
              Digite o saldo disponível que a casa mostra. {formatCurrency(mov.openStake)} em apostas abertas já ficam de fora.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => addAmount(amount)}
                className="px-3 py-1.5 rounded-full text-sm font-medium border border-foreground/10 text-zinc-300 hover:bg-foreground/[0.06]"
              >
                +{amount}
              </button>
            ))}
            <button
              type="button"
              onClick={useFullBalance}
              className="px-3 py-1.5 rounded-full text-sm font-medium border border-foreground/10 text-zinc-300 hover:bg-foreground/[0.06]"
            >
              Tudo
            </button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
