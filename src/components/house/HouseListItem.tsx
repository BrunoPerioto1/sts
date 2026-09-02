import { HouseBalanceDto } from "@/api/routes/get-houses";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DotsThreeOutline } from "@phosphor-icons/react";

interface HouseListItemProps {
  house: HouseBalanceDto;
  onViewDetails?: (houseId: number) => void;
  onOpenHistory?: (house: HouseBalanceDto) => void;
  onNewTransaction?: (house: HouseBalanceDto) => void;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function formatCurrency(value: string | number) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(num);
}

function formatMovementDate(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `hoje, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `ontem, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}, ${time}`;
}

export function HouseListItem({ house, onViewDetails, onOpenHistory, onNewTransaction }: HouseListItemProps) {
  const profit = Number(house.totalBetProfit);

  return (
    <tr className="border-b border-border hover:bg-foreground/[0.04]">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-[6px] bg-neutral-800 flex items-center justify-center text-[10px] shrink-0">
            {initialsOf(house.houseName)}
          </div>
          <span className="font-medium">{house.houseName}</span>
        </div>
      </td>
      <td className="py-2 text-right tabular-nums">{formatCurrency(house.houseBalance)}</td>
      <td className="py-2 text-right tabular-nums opacity-60">{formatCurrency(house.totalDeposit)}</td>
      <td className="py-2 text-right tabular-nums opacity-60">{formatCurrency(house.totalWithdrawal)}</td>
      <td className={`py-2 text-right tabular-nums font-medium ${profit >= 0 ? "text-positive" : "text-negative"}`}>
        {profit >= 0 ? "+" : ""}{formatCurrency(profit)}
      </td>
      <td className="py-2 text-right tabular-nums opacity-60">{house.totalBets}</td>
      <td className="py-2 text-[12.5px] opacity-55">
        {house.lastMovementAt ? formatMovementDate(house.lastMovementAt) : "—"}
      </td>
      <td className="py-2 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <DotsThreeOutline size={18} weight="fill" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails?.(house.houseId)}>Ver detalhes</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNewTransaction?.(house)}>Nova movimentação</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenHistory?.(house)}>Histórico</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
