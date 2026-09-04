import { useRef } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useLongPress } from "@/hooks/apostas/useLongPress";
import { formatCurrency, formatSignedCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const AVATAR_PALETTE = ["#5b7fff", "#f2555c", "#3ddc84", "#f5a623", "#a78bfa", "#22d3ee", "#fb7185", "#facc15"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function colorForHouse(id: number) {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

// "N apostas" · "N aberta(s)" quando há pendentes, ou "· liquidada" quando é
// a única aposta da casa e já foi liquidada — replica a leitura do mock.
function betsSubtitle(house: HouseBalanceDto) {
  const total = Number(house.totalBets);
  const pending = Number(house.pendingBets);
  const totalLabel = `${total} aposta${total === 1 ? "" : "s"}`;
  if (pending > 0) return `${totalLabel} · ${pending} aberta${pending === 1 ? "" : "s"}`;
  if (total === 1) return `${totalLabel} · liquidada`;
  return totalLabel;
}

interface HouseRowMobileProps {
  house: HouseBalanceDto;
  onTap: () => void;
  onLongPress: () => void;
}

export function HouseRowMobile({ house, onTap, onLongPress }: HouseRowMobileProps) {
  const profit = Number(house.totalBetProfit);
  // O toque longo dispara onLongPress, mas o navegador ainda emite o click
  // logo depois (ao soltar o dedo) — sem essa flag, esse click "fantasma"
  // também chamaria onTap e navegaria pro detalhe por cima do sheet aberto.
  const suppressNextClick = useRef(false);
  const longPress = useLongPress(() => {
    suppressNextClick.current = true;
    onLongPress();
  });

  const handleClick = () => {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    onTap();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      {...longPress}
      className="flex w-full items-center gap-3 min-h-[64px] py-2 text-left active:bg-white/[0.04] transition-colors"
    >
      <span
        className="h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center text-xs font-semibold text-white"
        style={{ background: colorForHouse(house.houseId) }}
      >
        {initialsOf(house.houseName)}
      </span>

      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{house.houseName}</span>
        <span className="block text-xs text-zinc-500 truncate">{betsSubtitle(house)}</span>
      </span>

      <span className="shrink-0 text-right">
        <span className="block text-sm font-medium tabular-nums">{formatCurrency(Number(house.houseBalance))}</span>
        <span className={cn("block text-xs tabular-nums", profit >= 0 ? "text-positive" : "text-negative")}>
          {formatSignedCurrency(profit)}
        </span>
      </span>

      <CaretRight size={14} className="shrink-0 text-zinc-600" />
    </button>
  );
}
