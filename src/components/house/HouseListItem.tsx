import { HouseBalanceDto } from "@/api/routes/get-houses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsThreeOutline, Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { colorForHouse, initialsOf, formatCurrency, formatSignedCurrency } from "@/lib/format";
import { formatIdleDays, houseActivity } from "@/lib/house-activity";
import { HouseActivityBadge } from "./HouseActivityBadge";

interface HouseListItemProps {
  house: HouseBalanceDto;
  // Maior saldo exibido na lista — a barra é proporcional a ele, então a
  // escala é a mesma pra todas as linhas.
  maxBalance: number;
  onViewDetails?: (houseId: number) => void;
  onOpenHistory?: (house: HouseBalanceDto) => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
}

export const HOUSE_GRID =
  "grid items-center gap-3 grid-cols-[28px_minmax(140px,1fr)_minmax(120px,1.4fr)_110px_96px_32px_32px]";

export function HouseListItem({ house, maxBalance, onViewDetails, onOpenHistory, onNewTransaction }: HouseListItemProps) {
  // Casa não fica te devendo: saldo real negativo é lançamento faltando, não
  // dinheiro. A linha mostra o saldo clampado em zero e marca "a conferir"; o
  // valor negativo em si fica no detalhe da casa.
  const real = Number(house.realHouseBalance);
  const balance = Math.max(0, real);
  const shortfall = Math.min(0, real);
  const profit = Number(house.totalBetProfit);
  const stake = Number(house.totalStake);
  const bets = Number(house.totalBets);
  // Saldo zerado não ganha barra: um traço de 2px em "R$ 0,00" só polui.
  const width = maxBalance > 0 ? (balance / maxBalance) * 100 : 0;
  const activity = houseActivity(house.lastBetAt, real);

  return (
    <div className={cn(HOUSE_GRID, "px-2 -mx-2 py-2.5 rounded-md border-b border-border last:border-b-0 hover:bg-foreground/[0.03] transition-colors")}>
      <div
        className="w-7 h-7 rounded-[7px] flex items-center justify-center text-[11px] font-semibold text-white"
        style={{ background: colorForHouse(house.houseId) }}
      >
        {initialsOf(house.houseName)}
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium uppercase tracking-wide truncate">{house.houseName}</p>
          <HouseActivityBadge activity={activity} />
        </div>
        <p className="text-xs opacity-45 truncate">
          {bets} {bets === 1 ? "aposta" : "apostas"} · Stake {formatCurrency(stake)}
          {shortfall < 0 && (
            <span className="text-negative opacity-100"> · a conferir {formatCurrency(shortfall)}</span>
          )}
        </p>
      </div>

      {/* A barra é o que faz a lista ser lida de relance: compara saldos sem
          o olho ter que ler número por número. */}
      <div className="h-[3px] rounded-full bg-foreground/[0.08] overflow-hidden">
        <div className={cn("h-full rounded-full", shortfall < 0 ? "bg-negative" : "bg-accent")} style={{ width: `${width}%` }} />
      </div>

      <span className="text-right">
        <span className={cn("block text-sm tabular-nums", balance === 0 && "opacity-45")}>
          {formatCurrency(balance)}
        </span>
        <span className={cn("block text-xs tabular-nums", profit >= 0 ? "text-positive" : "text-negative")}>
          {formatSignedCurrency(profit)}
        </span>
      </span>

      {/* Última aposta, não última movimentação: é o que diz se a casa está em uso. */}
      <span className="text-right text-xs tabular-nums" title="Última aposta">
        {activity.kind === "never" ? (
          <span className="opacity-45">—</span>
        ) : (
          <span className={activity.kind === "withdraw" ? "text-amber-400" : "opacity-45"}>
            aposta {formatIdleDays(activity.days)}
          </span>
        )}
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-foreground/55 hover:text-foreground hover:bg-foreground/[0.07]"
        aria-label={`Nova movimentação em ${house.houseName}`}
        onClick={() => onNewTransaction?.(house)}
      >
        <Plus size={16} />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/55 hover:text-foreground hover:bg-foreground/[0.07]">
            <DotsThreeOutline size={18} weight="fill" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onViewDetails?.(house.houseId)}>Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onNewTransaction?.(house)}>Nova movimentação</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onOpenHistory?.(house)}>Histórico</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
