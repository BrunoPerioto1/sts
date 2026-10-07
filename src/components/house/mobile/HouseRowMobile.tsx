import { useRef } from "react";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { useLongPress } from "@/hooks/apostas/use-long-press";
import { formatInt, formatMoney, houseDisplayName, signColor } from "@/lib/format";
import { HouseAvatar } from "@/components/ui/house-avatar";
import { ListRow } from "@/components/ui/list-group";
import { houseActivity } from "@/lib/house-activity";
import { houseMoney } from "@/lib/house-groups";
import { HouseActivityBadge } from "../HouseActivityBadge";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Uma linha só de contexto: "N apostas · N abertas · R$ X em aberto", ou
// "N apostas · Stake R$ X" sem nada em aberto. O que antes virava linha extra
// (em aberto, a conferir) entra aqui, pra todas as linhas terem a mesma altura.
function subtitleParts(house: HouseBalanceDto, open: number, real: number) {
  const total = Number(house.totalBets);
  const pending = Number(house.pendingBets);
  const parts = [`${formatInt(total)} aposta${total === 1 ? "" : "s"}`];
  if (pending > 0) parts.push(`${formatInt(pending)} aberta${pending === 1 ? "" : "s"}`);
  parts.push(open > 0 ? `${formatMoney(open)} em aberto` : `Stake ${formatMoney(Number(house.totalStake))}`);
  return { text: parts.join(" · "), conferir: real < 0 ? `a conferir ${formatMoney(real)}` : null };
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
  const subtitle = subtitleParts(house, money.open, real);
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
    <ListRow
      onClick={handleClick}
      {...longPress}
      className="animate-rise stagger"
      style={stagger(index)}
      leading={<HouseAvatar name={house.houseName} />}
      title={
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="truncate">{houseDisplayName(house.houseName)}</span>
          <HouseActivityBadge activity={houseActivity(house.lastBetAt, real, staleDays)} />
        </span>
      }
      subtitle={
        <>
          {subtitle.conferir && <span className="text-danger">{subtitle.conferir} · </span>}
          {subtitle.text}
        </>
      }
      trailing={
        // Disponível, como o site da casa mostra, e o lucro em apostas.
        <>
          <span className="block text-sm font-medium tabular-nums">{formatMoney(money.available)}</span>
          <span className={cn("block text-xs tabular-nums", signColor(profit))}>Lucro {formatMoney(profit, { signed: true })}</span>
        </>
      }
      chevron
    />
  );
}
