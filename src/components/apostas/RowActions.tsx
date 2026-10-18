import { useState } from "react";
import { RowMenuButton } from "@/components/ui/row-menu-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { CashoutDialog } from "./CashoutDialog";

export function RowActions({
  aposta,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
}: {
  aposta: BetItem;
  onEdit?: (a: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (a: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
}) {
  const [cashoutOpen, setCashoutOpen] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RowMenuButton aria-label={`Ações da aposta ${aposta.game}`} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
        {onEdit && (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setTimeout(() => onEdit(aposta), 0);
            }}
          >
            Editar
          </DropdownMenuItem>
        )}
        {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(aposta)}>Duplicar</DropdownMenuItem>}
        {onFinalize && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Liquidar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.WON)}>Ganha</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.LOST)}>Perdida</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.HALF_WON)}>Meia Ganha</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.HALF_LOST)}>Meia Perdida</DropdownMenuItem>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setCashoutOpen(true); }}>Cashout</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.CANCELED)}>Cancelada</DropdownMenuItem>
              {/* Desfaz liquidação errada; mesmo caminho do "Pendente" do LiquidarSheet no celular. */}
              {aposta.resultId !== ResultIdEnum.PENDING && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.PENDING)}>Voltar para pendente</DropdownMenuItem>
                </>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={() => onDelete(aposta.id)}>
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
      {onFinalize && (
        <CashoutDialog
          open={cashoutOpen}
          onClose={() => setCashoutOpen(false)}
          onConfirm={(value) => onFinalize(aposta.id, ResultIdEnum.CASHOUT, value)}
        />
      )}
    </DropdownMenu>
  );
}
