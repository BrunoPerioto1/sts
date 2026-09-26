import { useRef } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useLongPress } from "@/hooks/apostas/use-long-press";
import { colorForHouse, initialsOf, formatCurrency, formatSignedCurrency } from "@/lib/format";
import { houseActivity } from "@/lib/house-activity";
import { houseMoney } from "@/lib/house-groups";
import { HouseActivityBadge } from "../HouseActivityBadge";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";


// "N apostas" · "N aberta(s)" quando há pendentes, ou "· liquidada" quando é
// a única aposta da casa e já foi liquidada — replica a leitura do mock.
function betsSubtitle(house: HouseBalanceDto) {
  const total = Number(house.totalBets);
  const pending = Number(house.pendingBets);
  const stake = `Stake ${formatCurrency(Number(house.totalStake))}`;
  const totalLabel = `${total} aposta${total === 1 ? "" : "s"}`;
  if (pending > 0) return `${totalLabel} · ${pending} aberta${pending === 1 ? "" : "s"} · ${stake}`;
  return `${totalLabel} · ${stake}`;
}

interface HouseRowMobileProps {
  house: HouseBalanceDto;
  onTap: () => void;
  onLongPress: () => void;
  /** Posicao na lista — define o degrau da cascata de entrada. */
  index?: number;
  /** Dias sem apostar até sugerir saque (preferência do usuário). */
  staleDays: number;
}

export function HouseRowMobile({ house, onTap, onLongPress, index = 0, staleDays }: HouseRowMobileProps) {
  const profit = Number(house.totalBetProfit);
  // Saldo clampado em zero: casa no vermelho é lançamento faltando, o valor
  // real negativo aparece como "a conferir" e no detalhe da casa.
  const real = Number(house.realHouseBalance);
  const money = houseMoney(house);
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
      className="press animate-rise stagger flex w-full items-center gap-3 min-h-[64px] py-2 text-left active:bg-foreground/[0.04]"
      style={stagger(index)}
    >
      <span
        className="h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center text-xs font-semibold text-white"
        style={{ background: colorForHouse(house.houseId) }}
      >
        {initialsOf(house.houseName)}
      </span>

      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium truncate">{house.houseName}</span>
          <HouseActivityBadge activity={houseActivity(house.lastBetAt, real, staleDays)} />
        </span>
        <span className="block text-xs text-zinc-400 leading-snug truncate">{betsSubtitle(house)}</span>
        {real < 0 && (
          <span className="block text-xs text-negative leading-snug">a conferir {formatCurrency(real)}</span>
        )}
      </span>

      <span className="shrink-0 text-right">
        {/* Disponível, como o site da casa mostra; o preso em aposta aberta
            vem embaixo quando existe. */}
        <span className="block text-sm font-medium tabular-nums">{formatCurrency(money.available)}</span>
        {money.open > 0 && (
          <span className="block text-xs text-zinc-400 tabular-nums">+{formatCurrency(money.open)} em aberto</span>
        )}
        <span className={cn("block text-xs tabular-nums", profit >= 0 ? "text-positive" : "text-negative")}>
          Lucro {formatSignedCurrency(profit)}
        </span>
      </span>

      <CaretRight size={14} className="shrink-0 text-zinc-600" />
    </button>
  );
}
