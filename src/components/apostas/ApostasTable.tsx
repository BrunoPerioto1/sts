import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import { type BetItem, ResultIdEnum } from "@/api/routes/get-bets";
import { eventTextClass } from "./bet-text";
import { ReturnValue } from "./ReturnValue";
import { RowActions } from "./RowActions";

interface ApostasTableProps {
  apostas: BetItem[];
  onEdit?: (aposta: BetItem) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (aposta: BetItem) => void;
  onFinalize?: (id: number, resultId: ResultIdEnum, cashoutValue?: number) => void;
  selectedBets: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes: boolean;
}

export function ApostasTable({
  apostas,
  onEdit,
  onDelete,
  onDuplicate,
  onFinalize,
  selectedBets,
  onSelectBet,
  showCheckboxes,
}: ApostasTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="table w-full text-sm">
        <thead>
          <tr className="text-left border-b border-border">
            {showCheckboxes && <th className="w-8"></th>}
            <th className="py-2 pr-4 text-xs uppercase tracking-wide opacity-60 font-normal" style={{ opacity: 0.6, width: 128 }}>Data</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal min-w-[220px]">Evento</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal min-w-[160px]">Mercado</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal whitespace-nowrap">Casa</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Odd</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Stake</th>
            <th className="py-2 pl-4 text-xs uppercase tracking-wide opacity-60 font-normal whitespace-nowrap">Status</th>
            <th className="py-2 text-xs uppercase tracking-wide opacity-60 font-normal text-right whitespace-nowrap">Retorno</th>
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
                  {formatDate(aposta.betTime)} <span className="opacity-60">{formatTime(aposta.betTime)}</span>
                </td>
                <td className={cn("py-2 font-semibold", eventTextClass(aposta.game))}>{aposta.game}</td>
                <td className="py-2 opacity-70 text-sm">{aposta.market}</td>
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
