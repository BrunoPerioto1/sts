import { useState } from "react";
import { DotsThreeVertical } from "@phosphor-icons/react";
import { deleteTransaction, updateTransaction, type TransactionDto } from "@/api/routes/get-transaction";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { formatSignedCurrency, parsePtBrNumber } from "@/lib/format";

type Kind = "1" | "2" | "3";

const KIND_OPTIONS = [
  { value: "1", label: "Depósito" },
  { value: "2", label: "Saque" },
  { value: "3", label: "Ajuste" },
] as const;

const KIND_BY_NAME: Record<string, Kind> = { DEPOSIT: "1", WITHDRAWAL: "2", ADJUSTMENT: "3" };

/**
 * "..." de uma movimentação no histórico: corrigir tipo/valor ou excluir o
 * lançamento errado. Antes o único jeito de desfazer um depósito digitado a
 * mais era lançar um ajuste negativo por cima — e o histórico ficava com os
 * dois. Excluir pede confirmação: mexe no saldo real da casa.
 */
export function TransactionActions({ tx, onChanged }: { tx: TransactionDto; onChanged: () => void }) {
  const invalidate = useInvalidateBetData();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const initialKind: Kind = tx.transactionTypeId ? (String(tx.transactionTypeId) as Kind) : (KIND_BY_NAME[tx.transactionType] ?? "3");
  const [kind, setKind] = useState<Kind>(initialKind);
  const [raw, setRaw] = useState("");

  const openEdit = () => {
    setKind(initialKind);
    // Depósito e saque são digitados sem sinal (o back aplica); ajuste mantém.
    const value = Number(tx.value);
    setRaw((initialKind === "3" ? value : Math.abs(value)).toFixed(2).replace(".", ","));
    setEditing(true);
  };

  const parsed = parsePtBrNumber(raw);
  const valid = Number.isFinite(parsed) && (kind === "3" ? parsed !== 0 : parsed > 0);
  const preview = kind === "2" ? -Math.abs(parsed) : kind === "1" ? Math.abs(parsed) : parsed;

  const done = async (title: string) => {
    await invalidate();
    onChanged();
    actionToast.success({ title });
  };

  const save = async () => {
    setBusy(true);
    try {
      await updateTransaction(tx.id, { transactionTypeId: Number(kind), value: parsed });
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
          <DropdownMenuItem className="text-negative" onClick={() => setConfirmDelete(true)}>Excluir</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editing} onOpenChange={(open) => !busy && setEditing(open)}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Corrigir movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Segmented label="Tipo" value={kind} options={KIND_OPTIONS} onChange={setKind} disabled={busy} />
            <div className="space-y-1.5">
              <label htmlFor={`tx-value-${tx.id}`} className="text-xs text-zinc-400">
                {kind === "3" ? "Valor (use − para ajuste que tira saldo)" : "Valor"}
              </label>
              <Input
                id={`tx-value-${tx.id}`}
                inputMode="decimal"
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
                disabled={busy}
              />
              {valid && (
                <p className="text-xs text-zinc-400 tabular-nums">
                  Fica no histórico como {formatSignedCurrency(preview)}
                </p>
              )}
            </div>
            <Button className="w-full" disabled={!valid || busy} onClick={save}>
              {busy ? "Salvando…" : "Salvar correção"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !busy && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatSignedCurrency(Number(tx.value))} sai do histórico e o saldo real da casa é recalculado sem ela.
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
              className="bg-negative text-white hover:bg-negative/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
