import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, DotsThreeVertical, SlidersHorizontal } from "@phosphor-icons/react";
import { deleteTransaction, updateTransaction, type TransactionDto } from "@/api/routes/get-transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { useIsMobile } from "@/hooks/use-mobile";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { centsToDisplay, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HouseDialog } from "./HouseDialog";

type Kind = "1" | "2" | "3";

// Mesmos tipos, ícones e ordem da Nova movimentação. Aqui o terceiro é
// "Ajuste" e não "Saldo real": na correção se edita o valor gravado do
// ajuste, não se digita o saldo da casa pra calcular a diferença.
const KINDS: { value: Kind; label: string; icon: typeof ArrowDownLeft }[] = [
  { value: "1", label: "Depósito", icon: ArrowDownLeft },
  { value: "2", label: "Saque", icon: ArrowUpRight },
  { value: "3", label: "Ajuste", icon: SlidersHorizontal },
];

const KIND_BY_NAME: Record<string, Kind> = { DEPOSIT: "1", WITHDRAWAL: "2", ADJUSTMENT: "3" };

/**
 * "..." de uma movimentação no histórico: corrigir tipo/valor ou excluir o
 * lançamento errado. Antes o único jeito de desfazer um depósito digitado a
 * mais era lançar um ajuste negativo por cima — e o histórico ficava com os
 * dois. Excluir pede confirmação: mexe no saldo real da casa.
 *
 * A correção segue a Nova movimentação de cada tela: HouseDialog no desktop,
 * bottom sheet no mobile, com o mesmo seletor de tipo e o mesmo campo em R$.
 */
export function TransactionActions({ tx, onChanged }: { tx: TransactionDto; onChanged: () => void }) {
  const invalidate = useInvalidateBetData();
  const isMobile = useIsMobile();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const initialKind: Kind = tx.transactionTypeId ? (String(tx.transactionTypeId) as Kind) : (KIND_BY_NAME[tx.transactionType] ?? "3");
  const [kind, setKind] = useState<Kind>(initialKind);
  // Valor em centavos, sem sinal (mesma digitação da Nova movimentação). O
  // sinal só existe no ajuste, que pode tirar saldo.
  const [cents, setCents] = useState(0);
  const [negative, setNegative] = useState(false);

  const openEdit = () => {
    const value = Number(tx.value);
    setKind(initialKind);
    setCents(Math.round(Math.abs(value) * 100));
    setNegative(initialKind === "3" && value < 0);
    setEditing(true);
  };

  const isAdjust = kind === "3";
  const amount = cents / 100;
  const value = isAdjust && negative ? -amount : amount;
  const valid = cents > 0;
  // Depósito e saque vão sem sinal (o back aplica); o preview mostra como fica.
  const preview = kind === "2" ? -amount : value;

  const done = async (title: string) => {
    await invalidate();
    onChanged();
    actionToast.success({ title });
  };

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      await updateTransaction(tx.id, { transactionTypeId: Number(kind), value });
      setEditing(false);
      await done("Movimentação corrigida");
    } catch (err) {
      actionToast.error({ description: getErrorMessage(err, "Não foi possível salvar a correção.") });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteTransaction(tx.id);
      setConfirmDelete(false);
      await done("Movimentação excluída");
    } catch (err) {
      actionToast.error({ description: getErrorMessage(err, "Não foi possível excluir.") });
    } finally {
      setBusy(false);
    }
  };

  const tipo = (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider opacity-45">Tipo</div>
      <div className="grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border">
        {KINDS.map((k) => {
          const active = k.value === kind;
          return (
            <button
              key={k.value}
              type="button"
              disabled={busy}
              onClick={() => setKind(k.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-foreground/[0.10] text-foreground" : "text-zinc-400 hover:bg-foreground/[0.04] hover:text-zinc-200",
              )}
            >
              <k.icon size={14} /> {k.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const valor = (
    <div>
      <div className="mb-1.5 text-[11px] uppercase tracking-wider opacity-45">Valor</div>
      <div className="flex items-baseline gap-2 border-b border-border pb-2">
        {isAdjust && (
          // Ajuste pode tirar saldo: o sinal é um toque, não um "−" digitado
          // (o campo em centavos só aceita número).
          <button
            type="button"
            disabled={busy}
            onClick={() => setNegative((n) => !n)}
            aria-label={negative ? "Ajuste tira saldo (tocar para somar)" : "Ajuste soma saldo (tocar para tirar)"}
            className={cn(
              "self-center rounded-md border px-2 py-0.5 text-sm font-semibold tabular-nums transition-colors",
              negative ? "border-danger/40 text-danger" : "border-success/40 text-success",
            )}
          >
            {negative ? "−" : "+"}
          </button>
        )}
        <span className="text-lg opacity-45">R$</span>
        <Input
          autoFocus={!isMobile}
          inputMode="numeric"
          placeholder="0,00"
          value={cents > 0 ? centsToDisplay(cents) : ""}
          onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "")) || 0)}
          disabled={busy}
          className="h-auto min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-2xl tabular-nums hover:border-0 focus-visible:border-0 focus-visible:outline-none"
        />
        <span className="shrink-0 whitespace-nowrap text-xs opacity-45">
          Antes {formatMoney(Number(tx.value), { signed: true })}
        </span>
      </div>
      {valid && (
        <p className="mt-1.5 text-xs tabular-nums opacity-45">Fica no histórico como {formatMoney(preview, { signed: true })}</p>
      )}
    </div>
  );

  const salvarLabel = busy ? "Salvando…" : "Salvar correção";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Ações da movimentação"
            className="press h-9 w-9 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:text-foreground hover:bg-foreground/[0.06]"
          >
            <DotsThreeVertical size={18} weight="bold" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={openEdit}>Corrigir</DropdownMenuItem>
          <DropdownMenuItem className="text-danger" onClick={() => setConfirmDelete(true)}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isMobile ? (
        <BottomSheet
          open={editing}
          onOpenChange={(open) => !busy && setEditing(open)}
          title="Corrigir movimentação"
          titleExtra={
            <span className="truncate rounded-[5px] bg-foreground/[0.07] px-[8px] py-[2px] text-xs opacity-70">{tx.houseName}</span>
          }
          footer={
            <Button
              className="min-h-[44px] w-full bg-accent font-bold text-white hover:opacity-90 active:opacity-90"
              disabled={!valid || busy}
              onClick={save}
            >
              {salvarLabel}
            </Button>
          }
        >
          <div className="space-y-4 pb-4">
            {tipo}
            {valor}
          </div>
        </BottomSheet>
      ) : (
        <HouseDialog
          open={editing}
          onClose={() => !busy && setEditing(false)}
          title="Corrigir movimentação"
          houseName={tx.houseName}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="space-y-4"
          >
            {tipo}
            {valor}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="text-zinc-400 hover:text-foreground"
                disabled={busy}
                onClick={() => setEditing(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!valid || busy} className="bg-accent text-white hover:bg-accent/90">
                {salvarLabel}
              </Button>
            </div>
          </form>
        </HouseDialog>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !busy && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatMoney(Number(tx.value), { signed: true })} sai do histórico e o saldo real da casa é recalculado sem ela.
              Não dá pra desfazer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
              className="bg-danger text-white hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
