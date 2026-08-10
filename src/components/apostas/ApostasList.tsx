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
import { DotsThreeOutline } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";

interface ApostasListProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum) => void;
  selectedBets?: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes?: boolean;
  isLoading?: boolean;
}

function mapResultToStatus(aposta: BetItem): "ganha" | "perdida" | "pendente" | "cancelada" {
  if (aposta.resultName) {
    const rn = aposta.resultName.toLowerCase();
    if (rn.includes("won") || rn.includes("ganh")) return "ganha";
    if (rn.includes("lost") || rn.includes("perdid")) return "perdida";
    if (rn.includes("cancel")) return "cancelada";
  }
  switch (aposta.resultId) {
    case ResultIdEnum.WON:
      return "ganha";
    case ResultIdEnum.LOST:
      return "perdida";
    case ResultIdEnum.CANCELED:
      return "cancelada";
    default:
      return "pendente";
  }
}

const statusVariant = {
  ganha: "won",
  perdida: "lost",
  pendente: "pending",
  cancelada: "canceled",
} as const;

const statusLabel = {
  ganha: "Ganha",
  perdida: "Perdida",
  pendente: "Pendente",
  cancelada: "Cancelada",
};

function eventTextClass(text: string) {
  if (text.length > 70) return "text-[11.5px] leading-snug";
  if (text.length > 45) return "text-[12.5px] leading-snug";
  return "text-[14px]";
}

function ReturnValue({ aposta }: { aposta: BetItem }) {
  const status = mapResultToStatus(aposta);
  if (status === "pendente") return <span className="opacity-35 tabular-nums">—</span>;
  if (status === "cancelada")
    return <span className="opacity-55 tabular-nums">R$ {Number(aposta.stake ?? 0).toFixed(2)}</span>;
  const lucro = Number(aposta.profit ?? 0);
  return (
    <span className={cn("tabular-nums font-medium", lucro >= 0 ? "text-positive" : "text-negative")}>
      {lucro >= 0 ? "+" : ""}R$ {lucro.toFixed(2)}
    </span>
  );
}

function RowActions({
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
  onFinalize?: (id: number, resultId: ResultIdEnum) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <DotsThreeOutline size={18} weight="fill" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onEdit && <DropdownMenuItem onClick={() => onEdit(aposta)}>Editar</DropdownMenuItem>}
        {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(aposta)}>Duplicar</DropdownMenuItem>}
        {onFinalize && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Liquidar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.WON)}>Ganha</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onFinalize(aposta.id, ResultIdEnum.LOST)}>Perdida</DropdownMenuItem>
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
      <div className="space-y-2">
        {apostas.map((aposta) => {
          const status = mapResultToStatus(aposta);
          return (
            <div key={aposta.id} className="card bg-card rounded-md p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {showCheckboxes && onSelectBet && (
                    <Checkbox checked={selectedBets.includes(aposta.id)} onCheckedChange={() => onSelectBet(aposta.id)} />
                  )}
                  <div className="min-w-0">
                    <p className={cn("font-medium truncate", eventTextClass(aposta.game))}>{aposta.game}</p>
                    <p className="text-xs opacity-55 truncate">{aposta.market}</p>
                  </div>
                </div>
                <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
              </div>
              <div className="flex items-center justify-between text-[11.5px]">
                <span className="opacity-60">{aposta.houseName} · odd {Number(aposta.odd).toFixed(2)}</span>
                <ReturnValue aposta={aposta} />
              </div>
              <div className="flex justify-end">
                <RowActions aposta={aposta} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onFinalize={onFinalize} />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-sm">
        <thead>
          <tr className="text-left border-b border-border">
            {showCheckboxes && <th className="w-8"></th>}
            <th className="py-2 pr-4 text-[11px] uppercase tracking-wide opacity-60 font-normal" style={{ opacity: 0.6, width: 88 }}>Data</th>
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
                <td className="py-2 pr-4 opacity-60 whitespace-nowrap">{new Date(aposta.betTime).toLocaleDateString("pt-BR")}</td>
                <td className={cn("py-2 font-semibold", eventTextClass(aposta.game))}>{aposta.game}</td>
                <td className="py-2 opacity-70 text-[12.5px]">{aposta.market}</td>
                <td className="py-2 whitespace-nowrap">{aposta.houseName}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">{Number(aposta.odd).toFixed(2)}</td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">R$ {Number(aposta.stake).toFixed(2)}</td>
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
