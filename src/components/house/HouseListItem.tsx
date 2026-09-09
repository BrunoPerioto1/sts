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
import { initialsOf, formatCurrency, formatTime } from "@/lib/format";

interface HouseListItemProps {
  house: HouseBalanceDto;
  // Maior saldo absoluto da lista — a barra é proporcional a ele, então a
  // escala é a mesma pra todas as linhas.
  maxBalance: number;
  onViewDetails?: (houseId: number) => void;
  onOpenHistory?: (house: HouseBalanceDto) => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
}

export const HOUSE_GRID =
  "grid items-center gap-3 grid-cols-[28px_minmax(140px,1fr)_minmax(120px,1.4fr)_110px_96px_32px_32px]";

function formatMovementDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = formatTime(date);
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `hoje, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `ontem, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

export function HouseListItem({ house, maxBalance, onViewDetails, onOpenHistory, onNewTransaction }: HouseListItemProps) {
  // `houseBalance` vem do backend clampado em zero (Math.max(0, real)), então
  // casa no vermelho aparecia como "R$ 0,00" e nunca batia com o KPI de casas
  // negativas, que conta pelo saldo real. A lista usa o real.
  const balance = Number(house.realHouseBalance);
  const negative = balance < 0;
  const bets = Number(house.totalBets);
  // Saldo zerado não ganha barra: um traço de 2px em "R$ 0,00" só polui.
  const width = maxBalance > 0 ? (Math.abs(balance) / maxBalance) * 100 : 0;

  return (
    <div className={cn(HOUSE_GRID, "px-2 -mx-2 py-2.5 rounded-md border-b border-border last:border-b-0 hover:bg-foreground/[0.03] transition-colors")}>
      <div className="w-7 h-7 rounded-[7px] bg-neutral-800 flex items-center justify-center text-[11px] font-medium">
        {initialsOf(house.houseName)}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium uppercase tracking-wide truncate">{house.houseName}</p>
        <p className="text-xs opacity-45">{bets} {bets === 1 ? "aposta" : "apostas"}</p>
      </div>

      {/* A barra é o que faz a lista ser lida de relance: compara saldos sem
          o olho ter que ler número por número. */}
      <div className="h-[3px] rounded-full bg-foreground/[0.08] overflow-hidden">
        <div className={cn("h-full rounded-full", negative ? "bg-negative" : "bg-accent")} style={{ width: `${width}%` }} />
      </div>

      <span className={cn("text-right text-sm tabular-nums", negative ? "text-negative" : balance === 0 && "opacity-45")}>
        {formatCurrency(balance)}
      </span>

      <span className="text-right text-xs opacity-45 tabular-nums">
        {house.lastMovementAt ? formatMovementDate(house.lastMovementAt) : "—"}
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
