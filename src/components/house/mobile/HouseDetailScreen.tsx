import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ArrowSquareOut } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HouseBalanceDto } from "@/api/routes/get-houses";
import { formatMoney, formatInt, formatPercent, houseDisplayName, signColor } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { SectionLabel } from "@/components/ui/section-label";

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className={`font-medium tabular-nums ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}

interface HouseDetailScreenProps {
  house: HouseBalanceDto;
  onBack: () => void;
  onNewTransaction: (house: HouseBalanceDto) => void;
  onOpenHistory: (house: HouseBalanceDto) => void;
}

export function HouseDetailScreen({ house, onBack, onNewTransaction, onOpenHistory }: HouseDetailScreenProps) {
  const navigate = useNavigate();

  const profit = Number(house.totalBetProfit);
  const realBalance = Number(house.realHouseBalance);
  const isProfit = profit >= 0;
  const totalBets = Number(house.totalBets);
  const settledBets = Number(house.settledBets ?? Math.max(0, totalBets - Number(house.pendingBets)));
  // Sobre ganhas + perdidas: "encerradas" inclui cashout, que nao e' acerto nem erro.
  const decided = Number(house.wonBets) + Number(house.lostBets);
  const hitRate = decided > 0 ? Number(house.wonBets) / decided : 0;
  // Lucro / stake liquidado, calculado na API (mesma base do dashboard).
  const roi = Number(house.roi ?? 0);

  // Portal pro body: essa tela e um overlay de tela cheia, mas era montada
  // dentro do <div className="space-y-4"> do CasasMobileView — e o space-y do
  // Tailwind poe margin-top: 1rem em todo filho depois do primeiro, inclusive
  // num elemento `fixed`. A margem empurrava o painel 1rem pra baixo e a lista
  // de casas aparecia nessa faixa no topo.
  return createPortal(
    <div
      className="animate-screen-in fixed inset-0 z-50 isolate flex flex-col overscroll-contain bg-background"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <PageHeader
        className="px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-3"
        back={onBack}
        title={houseDisplayName(house.houseName)}
        actions={
          <Badge variant={isProfit ? "won" : "lost"} className="shrink-0">
            {isProfit ? "Lucro" : "Prejuízo"}
          </Badge>
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-6">
        <div>
          <SectionLabel as="p" className="px-0 mb-1">Saldo atual</SectionLabel>
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(Math.max(0, realBalance))}</p>
          <p className={`text-sm font-medium tabular-nums mt-0.5 ${signColor(profit)}`}>
            {formatMoney(profit, { signed: true })} de lucro · ROI {formatPercent(roi)}
          </p>
        </div>

        <div className="mt-5 border-t border-border divide-y divide-border">
          {realBalance < 0 && <StatRow label="A conferir" value={formatMoney(realBalance)} valueClass="text-danger" />}
          <StatRow label="Volume apostado" value={formatMoney(Number(house.totalStake))} />
          <StatRow label="Depósitos" value={formatMoney(Number(house.totalDeposit))} />
          <StatRow label="Saques" value={formatMoney(Number(house.totalWithdrawal))} />
          <StatRow label="Apostas encerradas" value={formatInt(settledBets)} />
          <StatRow label="Apostas abertas" value={formatInt(house.pendingBets)} />
          <StatRow label="Taxa de acerto" value={formatPercent(hitRate)} />
          <StatRow label="Lucro em apostas" value={formatMoney(profit)} valueClass={signColor(profit)} />
        </div>
      </div>

      <div
        className="shrink-0 border-t border-foreground/10 px-4 pt-3 flex flex-col gap-2"
        style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}
      >
        <Button
          size="lg"
          className="w-full"
          onClick={() => onNewTransaction(house)}
        >
          Nova movimentação
        </Button>
        <div className={house.websiteUrl ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-2"}>
          <Button variant="secondary" className="min-h-[44px]" onClick={() => navigate(`/bets?houseId=${house.houseId}&period=tudo`)}>
            Ver apostas
          </Button>
          <Button variant="secondary" className="min-h-[44px]" onClick={() => onOpenHistory(house)}>
            Histórico
          </Button>
          {house.websiteUrl && (
            <Button asChild variant="secondary" className="min-h-[44px] gap-1.5">
              <a href={house.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir site da ${houseDisplayName(house.houseName)}`}>
                Site <ArrowSquareOut size={15} />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
