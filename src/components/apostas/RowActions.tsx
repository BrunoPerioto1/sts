import { useState } from "react";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/55 hover:text-foreground hover:bg-foreground/[0.07]">
          <DotsThreeOutline size={18} weight="fill" />
        </Button>
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-negative" onClick={() => onDelete(aposta.id)}>
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
