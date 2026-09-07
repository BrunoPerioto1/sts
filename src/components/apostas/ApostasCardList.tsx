import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { mapResultToStatus, statusLabel, statusVariant } from "@/lib/bet-status";
import type { BetItem } from "@/api/routes/get-bets";
import { eventTextClass } from "./bet-text";
import { ReturnValue } from "./ReturnValue";

interface ApostasCardListProps {
  apostas: BetItem[];
  onOpenDetail: (aposta: BetItem) => void;
  selectedBets: number[];
  onSelectBet?: (betId: number) => void;
  showCheckboxes: boolean;
}

// Versão mobile da visão Tabela: cada aposta vira um card que abre o detalhe.
export function ApostasCardList({ apostas, onOpenDetail, selectedBets, onSelectBet, showCheckboxes }: ApostasCardListProps) {
  return (
    <div className="space-y-3">
      {apostas.map((aposta) => {
        const status = mapResultToStatus(aposta);
        return (
          <div
            key={aposta.id}
            className="bg-card rounded-md p-3 flex flex-col gap-2 active:opacity-80"
            style={{ boxShadow: "var(--shadow-sm)" }}
            onClick={() => onOpenDetail(aposta)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {showCheckboxes && onSelectBet && (
                  <span onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selectedBets.includes(aposta.id)} onCheckedChange={() => onSelectBet(aposta.id)} />
                  </span>
                )}
                <span className="text-xs opacity-50 tabular-nums shrink-0">{formatTime(aposta.betTime)}</span>
                {aposta.houseName && (
                  <span className="text-xs px-[8px] py-[2px] rounded-[5px] bg-foreground/[0.07] opacity-70 truncate">
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
              <ReturnValue aposta={aposta} className="text-sm" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
