import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { centsToDisplay, formatCurrency } from "@/lib/format";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { MOVIMENTACAO_META, useNovaMovimentacao, type MovimentacaoType } from "@/hooks/house/use-nova-movimentacao";
import { HouseDialog } from "./HouseDialog";

interface NovaTransacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  house: HouseBalanceDto;
  // "Conciliar" (casa a conferir) abre direto em Saldo real.
  initialType?: MovimentacaoType;
}

export function NovaTransacaoModal({ isOpen, onClose, house, initialType }: NovaTransacaoModalProps) {
  const mov = useNovaMovimentacao(isOpen ? house : null, initialType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await mov.submit()) onClose();
  };

  return (
    <HouseDialog open={isOpen} onClose={onClose} title="Nova movimentação" houseName={house.houseName}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="text-[11px] uppercase tracking-wider opacity-45 mb-1.5">Tipo</div>
          {/* Botões no lugar do select: com só três opções, abrir uma lista
              pra escolher entre elas é um clique a mais por nada. */}
          <div className="grid grid-cols-3 rounded-lg border border-border overflow-hidden divide-x divide-border">
            {mov.types.map((t) => {
              const meta = MOVIMENTACAO_META[t.name] ?? { label: t.name, icon: MOVIMENTACAO_META.DEPOSIT.icon };
              const Icon = meta.icon;
              const active = t.id === mov.typeId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => mov.setTypeId(t.id)}
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
          <div className="text-[11px] uppercase tracking-wider opacity-45 mb-1.5">{mov.isAdjust ? "Saldo na casa" : "Valor"}</div>
          <div className="flex items-baseline gap-2 border-b border-border pb-2">
            <span className="text-lg opacity-45">R$</span>
            <Input
              autoFocus
              inputMode="numeric"
              placeholder="0,00"
              value={mov.typed ? centsToDisplay(mov.cents) : ""}
              onChange={(e) => mov.onInputChange(e.target.value)}
              className="flex-1 min-w-0 h-auto min-h-0 border-0 bg-transparent p-0 text-2xl tabular-nums hover:border-0 focus-visible:border-0 focus-visible:outline-none"
            />
            <span className="text-xs opacity-45 shrink-0 whitespace-nowrap">
              {mov.isAdjust && mov.typed
                ? `Ajuste ${mov.diff > 0 ? "+" : ""}${formatCurrency(mov.diff)}`
                : mov.isAdjust
                  ? `Disponível ${formatCurrency(mov.available)}`
                  : `Saldo atual ${formatCurrency(house.realHouseBalance)}`}
            </span>
          </div>
          {mov.isAdjust && mov.openStake > 0 && (
            <p className="text-xs opacity-45 mt-1.5">
              Digite o saldo disponível que a casa mostra. {formatCurrency(mov.openStake)} em apostas abertas já ficam de fora.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" className="text-zinc-400 hover:text-foreground" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!mov.valid || mov.loading} className="bg-accent text-white hover:bg-accent/90">
            {mov.loading ? "Enviando…" : "Adicionar"}
          </Button>
        </div>
      </form>
    </HouseDialog>
  );
}
