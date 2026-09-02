import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-mobile";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";

interface ApostasListProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selectedBets?: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes?: boolean;
  isLoading?: boolean;
}

export type Status = "ganha" | "perdida" | "pendente" | "cancelada" | "meiaGanha" | "meiaPerdida" | "cashout";

export function mapResultToStatus(aposta: BetItem): Status {
  switch (aposta.resultId) {
    case ResultIdEnum.WON:
      return "ganha";
    case ResultIdEnum.LOST:
      return "perdida";
    case ResultIdEnum.CANCELED:
      return "cancelada";
    case ResultIdEnum.HALF_WON:
      return "meiaGanha";
    case ResultIdEnum.HALF_LOST:
      return "meiaPerdida";
    case ResultIdEnum.CASHOUT:
      return "cashout";
    default:
      return "pendente";
  }
}

export const statusVariant = {
  ganha: "won",
  perdida: "lost",
  pendente: "pending",
  cancelada: "canceled",
  meiaGanha: "halfWon",
  meiaPerdida: "halfLost",
  cashout: "cashout",
} as const;

export const statusLabel = {
  ganha: "Ganha",
  perdida: "Perdida",
  pendente: "Pendente",
  cancelada: "Cancelada",
  meiaGanha: "Meia Ganha",
  meiaPerdida: "Meia Perdida",
  cashout: "Cashout",
};

function eventTextClass(text: string) {
  if (text.length > 70) return "text-[11.5px] leading-snug";
  if (text.length > 45) return "text-[12.5px] leading-snug";
  return "text-[14px]";
}

export function ReturnValue({ aposta, className }: { aposta: BetItem; className?: string }) {
  const status = mapResultToStatus(aposta);
  if (status === "pendente") return <span className={cn("opacity-35 tabular-nums whitespace-nowrap", className)}>—</span>;
  if (status === "cancelada")
    return <span className={cn("opacity-55 tabular-nums whitespace-nowrap", className)}>{formatCurrency(Number(aposta.stake ?? 0))}</span>;
  const lucro = Number(aposta.profit ?? 0);
  return (
    <span className={cn("tabular-nums font-medium whitespace-nowrap", lucro >= 0 ? "text-positive" : "text-negative", className)}>
      {formatSignedCurrency(lucro)}
    </span>
  );
}

export function ApostaDetailSheet({
  aposta,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
}: {
  aposta: BetItem | null;
  onClose: () => void;
  onEdit?: (a: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (a: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
}) {
  const [cashoutOpen, setCashoutOpen] = useState(false);

  if (!aposta) return null;
  const status = mapResultToStatus(aposta);
  const date = new Date(aposta.betTime);
  const stake = Number(aposta.stake);
  const profit = aposta.profit != null ? Number(aposta.profit) : null;
  const ganho = profit != null ? stake + profit : null;

  return (
    <Sheet open={!!aposta} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-lg max-h-[85vh] overflow-y-auto space-y-4">
        <SheetHeader>
          <SheetTitle className="pr-6 text-left leading-snug">{aposta.game}</SheetTitle>
        </SheetHeader>

        <div className="flex items-center gap-2 text-[12.5px] opacity-60">
          <span>{date.toLocaleDateString("pt-BR")} · {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>

        <div className="grid grid-cols-4 gap-2 border border-border rounded-md p-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Cotação</p>
            <p className="text-[14px] font-medium tabular-nums">{Number(aposta.odd).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Valor</p>
            <p className="text-[14px] font-medium tabular-nums">{formatCurrency(stake)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Ganho</p>
            <p className="text-[14px] font-medium tabular-nums">{ganho != null ? formatCurrency(ganho) : "—"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1">Lucro</p>
            <p className={cn("text-[14px] font-medium tabular-nums", profit == null ? "opacity-45" : profit >= 0 ? "text-positive" : "text-negative")}>
              {profit != null ? formatSignedCurrency(profit) : "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1.5">Seleção</p>
          <div className="flex items-start justify-between gap-2 border border-border rounded-md p-2.5">
            <div className="min-w-0">
              <p className="text-[13px] leading-snug">{aposta.market}</p>
              {aposta.houseName && <p className="text-[11.5px] opacity-55">{aposta.houseName}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[12.5px] tabular-nums opacity-70 border border-border rounded-[5px] px-[8px] py-[2px]">
                {Number(aposta.odd).toFixed(2)}
              </span>
              <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
            </div>
          </div>
        </div>

        {onFinalize && (
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-55 mb-1.5">Liquidar</p>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => { onFinalize(aposta.id, ResultIdEnum.WON); onClose(); }}>Ganha</Button>
              <Button variant="outline" onClick={() => { onFinalize(aposta.id, ResultIdEnum.LOST); onClose(); }}>Perdida</Button>
              <Button variant="outline" onClick={() => setCashoutOpen(true)}>Cashout</Button>
              <Button variant="outline" onClick={() => { onFinalize(aposta.id, ResultIdEnum.HALF_WON); onClose(); }}>Meia Ganha</Button>
              <Button variant="outline" onClick={() => { onFinalize(aposta.id, ResultIdEnum.HALF_LOST); onClose(); }}>Meia Perdida</Button>
              <Button variant="outline" onClick={() => { onFinalize(aposta.id, ResultIdEnum.CANCELED); onClose(); }}>Cancelada</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 pt-1">
          {onEdit && (
            <Button variant="outline" onClick={() => { onEdit(aposta); onClose(); }}>Editar</Button>
          )}
          {onDuplicate && (
            <Button variant="outline" onClick={() => { onDuplicate(aposta); onClose(); }}>Duplicar</Button>
          )}
          {onDelete && (
            <Button variant="destructive" onClick={() => { onDelete(aposta.id); onClose(); }}>Excluir</Button>
          )}
        </div>

        {onFinalize && (
          <CashoutDialog
            open={cashoutOpen}
            onClose={() => setCashoutOpen(false)}
            onConfirm={(value) => { onFinalize(aposta.id, ResultIdEnum.CASHOUT, value); onClose(); }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CashoutDialog({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Cashout</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="cashout-value" className="text-xs">Valor recebido (R$)</Label>
          <Input
            id="cashout-value"
            type="number"
            step="0.01"
            autoFocus
            placeholder="Ex: 45.00"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!value || Number.isNaN(Number(value))}
            onClick={() => {
              onConfirm(Number(value));
              setValue("");
              onClose();
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        <Button variant="ghost" size="icon" className="h-8 w-8">
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

export function ApostasList({
  apostas,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
  selectedBets = [],
  onSelectBet,
  showCheckboxes = false,
  isLoading = false,
}: ApostasListProps) {
  const isMobile = useIsMobile();
  const [detailAposta, setDetailAposta] = useState<BetItem | null>(null);

  if (isLoading) {
    return (
      <div className="card bg-card rounded-md p-4 space-y-3">
        {[38, 88, 72, 80, 56].map((w, i) => (
          <div key={i} className="h-[10px] rounded" style={{ width: `${w}%`, background: "color-mix(in srgb, var(--color-text) 8%, transparent)" }} />
        ))}
      </div>
    );
  }

  if (apostas.length === 0) {
    return <p className="text-center py-10 text-[12.5px] opacity-55">Nenhuma aposta encontrada com os critérios de busca.</p>;
  }

  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {apostas.map((aposta) => {
            const status = mapResultToStatus(aposta);
            const time = new Date(aposta.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <div
                key={aposta.id}
                className="bg-card rounded-md p-3 flex flex-col gap-2 active:opacity-80"
                style={{ boxShadow: "var(--shadow-sm)" }}
                onClick={() => setDetailAposta(aposta)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {showCheckboxes && onSelectBet && (
                      <span onClick={(e) => e.stopPropagation()}>
                        <Checkbox checked={selectedBets.includes(aposta.id)} onCheckedChange={() => onSelectBet(aposta.id)} />
                      </span>
                    )}
                    <span className="text-[11px] opacity-50 tabular-nums shrink-0">{time}</span>
                    {aposta.houseName && (
                      <span className="text-[10.5px] px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 truncate">
                        {aposta.houseName}
                      </span>
                    )}
                  </div>
                  <Badge variant={statusVariant[status]} className="shrink-0">{statusLabel[status]}</Badge>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn("font-medium truncate", eventTextClass(aposta.game))}>{aposta.game}</p>
                    <p className="text-xs opacity-55 truncate">{aposta.market} · odd {Number(aposta.odd).toFixed(2)}</p>
                  </div>
                  <ReturnValue aposta={aposta} className="text-[13.5px]" />
                </div>
              </div>
            );
          })}
        </div>
        <ApostaDetailSheet
          aposta={detailAposta}
          onClose={() => setDetailAposta(null)}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onFinalize={onFinalize}
        />
      </>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-sm">
        <thead>
          <tr className="text-left border-b border-border">
            {showCheckboxes && <th className="w-8"></th>}
            <th className="py-2 pr-4 text-[11px] uppercase tracking-wide opacity-60 font-normal" style={{ opacity: 0.6, width: 128 }}>Data</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal min-w-[220px]">Evento</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal min-w-[160px]">Mercado</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal whitespace-nowrap">Casa</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Odd</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Stake</th>
            <th className="py-2 pl-4 text-[11px] uppercase tracking-wide opacity-60 font-normal whitespace-nowrap">Status</th>
            <th className="py-2 text-[11px] uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Retorno</th>
            <th className="w-11"></th>
          </tr>
        </thead>
        <tbody>
          {apostas.map((aposta) => {
            const status = mapResultToStatus(aposta);
            return (
              <tr key={aposta.id} className="border-b border-border hover:bg-foreground/[0.04]">
                {showCheckboxes && onSelectBet && (
                  <td className="py-2">
                    <Checkbox checked={selectedBets.includes(aposta.id)} onCheckedChange={() => onSelectBet(aposta.id)} />
                  </td>
                )}
                <td className="py-2 pr-4 opacity-60 whitespace-nowrap">
                  {new Date(aposta.betTime).toLocaleDateString("pt-BR")}{" "}
                  <span className="opacity-60">{new Date(aposta.betTime).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                </td>
                <td className={cn("py-2 font-semibold", eventTextClass(aposta.game))}>{aposta.game}</td>
                <td className="py-2 opacity-70 text-[12.5px]">{aposta.market}</td>
                <td className="py-2 whitespace-nowrap">{aposta.houseName}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">{Number(aposta.odd).toFixed(2)}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">{formatCurrency(Number(aposta.stake))}</td>
                <td className="py-2 pl-4">
                  <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
                </td>
                <td className="py-2 text-right whitespace-nowrap">
                  <ReturnValue aposta={aposta} />
                </td>
                <td className="py-2 text-right">
                  <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
