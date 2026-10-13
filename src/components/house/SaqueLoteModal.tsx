import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { HouseAvatar } from "@/components/ui/house-avatar";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { createTransaction, getTransactionTypes } from "@/api/routes/get-transaction";
import { actionToast } from "@/lib/action-toast";
import { centsToDisplay, formatMoney, houseDisplayName } from "@/lib/format";
import { houseMoney } from "@/lib/house-groups";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { HouseDialog } from "./HouseDialog";

// Mesma casca do HouseDialog, no formato do celular (mesmo par usado na
// correção de movimentação).
function SheetShell({ open, onClose, title, houseName, footer, children }: React.ComponentProps<typeof HouseDialog>) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={title}
      titleExtra={<span className="truncate rounded-[5px] bg-foreground/[0.07] px-[8px] py-[2px] text-xs opacity-70">{houseName}</span>}
      footer={footer}
    >
      <div className="pb-4">{children}</div>
    </BottomSheet>
  );
}

interface SaqueLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  houses: HouseBalanceDto[];
}

/**
 * Saque em várias casas de uma vez. Só entra casa com saldo disponível (o
 * preso em aposta aberta não sai). Cada linha vem com o disponível inteiro;
 * editar o valor vira saque parcial. "Sacar tudo" ignora a seleção e zera
 * todas.
 */
export function SaqueLoteModal({ isOpen, onClose, houses }: SaqueLoteModalProps) {
  const withBalance = useMemo(
    () =>
      houses
        .map((house) => ({ house, cents: Math.round(houseMoney(house).available * 100) }))
        .filter((h) => h.cents > 0)
        .sort((a, b) => b.cents - a.cents),
    [houses]
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [amounts, setAmounts] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const isMobile = useIsMobile();
  const Shell = isMobile ? SheetShell : HouseDialog;

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    setAmounts(Object.fromEntries(withBalance.map((h) => [h.house.houseId, h.cents])));
    // Só ao abrir: refetch das casas no meio da edição não pode apagar o que foi digitado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allChecked = withBalance.length > 0 && selected.size === withBalance.length;
  const totalAll = withBalance.reduce((sum, h) => sum + h.cents, 0);
  const picked = withBalance.filter((h) => selected.has(h.house.houseId) && (amounts[h.house.houseId] ?? 0) > 0);
  const totalPicked = picked.reduce((sum, h) => sum + amounts[h.house.houseId], 0);

  const withdraw = async (items: { houseId: number; cents: number }[]) => {
    if (items.length === 0) return;
    setBusy(true);
    try {
      const types = await getTransactionTypes();
      const typeId = types.find((t) => t.name === "WITHDRAWAL")?.id;
      if (!typeId) throw new Error("Tipo saque não encontrado");
      const results = await Promise.allSettled(
        items.map((i) => createTransaction({ houseId: i.houseId, transactionTypeId: typeId, value: i.cents / 100 }))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      const total = formatMoney(items.reduce((sum, i) => sum + i.cents, 0) / 100);
      if (failed === 0) {
        actionToast.success({ title: `Saque de ${total} em ${items.length} ${items.length === 1 ? "casa" : "casas"}` });
      } else {
        actionToast.error({ description: `${failed} de ${items.length} saques falharam. Confira o histórico das casas.` });
      }
      onClose();
    } catch {
      actionToast.error({ description: "Não foi possível registrar os saques." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      open={isOpen}
      onClose={() => !busy && onClose()}
      title="Saque em lote"
      houseName={`${withBalance.length} ${withBalance.length === 1 ? "casa" : "casas"} com saldo`}
      footer={
        <div className="space-y-2">
          <Button
            className={cn("w-full", isMobile && "min-h-[44px]")}
            disabled={busy || picked.length === 0}
            onClick={() => withdraw(picked.map((h) => ({ houseId: h.house.houseId, cents: amounts[h.house.houseId] })))}
          >
            {picked.length === 0 ? "Selecione as casas" : `Sacar selecionadas · ${formatMoney(totalPicked / 100)}`}
          </Button>
          <Button
            variant="ghost"
            className={cn("w-full text-zinc-300 hover:text-foreground", isMobile && "min-h-[44px]")}
            disabled={busy || withBalance.length === 0}
            onClick={() => withdraw(withBalance.map((h) => ({ houseId: h.house.houseId, cents: h.cents })))}
          >
            Sacar tudo de todas · {formatMoney(totalAll / 100)}
          </Button>
        </div>
      }
    >
      {withBalance.length === 0 ? (
        <p className="text-sm text-zinc-400">Nenhuma casa com saldo disponível.</p>
      ) : (
        <div>
          <label className="flex items-center gap-3 pb-2 border-b border-border text-sm text-zinc-300 cursor-pointer">
            <Checkbox
              checked={allChecked ? true : selected.size > 0 ? "indeterminate" : false}
              onCheckedChange={() => setSelected(allChecked ? new Set() : new Set(withBalance.map((h) => h.house.houseId)))}
              disabled={busy}
            />
            Selecionar todas
          </label>
          {withBalance.map(({ house, cents }) => {
            const id = house.houseId;
            const value = amounts[id] ?? 0;
            const over = value > cents;
            return (
              <div key={id} className="flex items-center gap-3 py-2 max-md:py-3 border-b border-border last:border-b-0">
                <Checkbox checked={selected.has(id)} onCheckedChange={() => toggle(id)} disabled={busy} aria-label={`Selecionar ${house.houseName}`} />
                <HouseAvatar name={house.houseName} className="h-6 w-6 rounded-[6px] text-[10px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{houseDisplayName(house.houseName)}</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setAmounts((a) => ({ ...a, [id]: cents }))}
                    className="text-xs tabular-nums text-zinc-500 hover:text-zinc-300"
                    title="Usar o saldo todo"
                  >
                    disponível {formatMoney(cents / 100)}
                  </button>
                </div>
                <div className="flex items-baseline gap-1 border-b border-border pb-0.5 w-[110px] shrink-0">
                  <span className="text-xs opacity-45">R$</span>
                  <Input
                    inputMode="numeric"
                    placeholder="0,00"
                    value={value > 0 ? centsToDisplay(value) : ""}
                    disabled={busy}
                    onFocus={() => !selected.has(id) && toggle(id)}
                    onChange={(e) => setAmounts((a) => ({ ...a, [id]: Number(e.target.value.replace(/\D/g, "")) || 0 }))}
                    className={cn("h-auto min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-sm tabular-nums hover:border-0 focus-visible:border-0 focus-visible:outline-none", over && "text-warning")}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
