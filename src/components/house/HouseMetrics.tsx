import { ArrowRight } from "@phosphor-icons/react";
import { HouseMetricsDto } from "@/api/routes/get-houses";
import { cn } from "@/lib/utils";
import { formatMoney, signColor } from "@/lib/format";

interface HousesMetricsProps {
  metrics: HouseMetricsDto;
  // Quantas casas têm saldo — o número já é calculado na lista, não vale
  // recalcular aqui.
  withBalanceCount: number;
  /** Stake das pendentes somado: parte do saldo que está presa em aposta. */
  openStake?: number;
  isLoading?: boolean;
  /** Filtro "só as casas a conferir" ligado. */
  conferirActive?: boolean;
  /** Clicar em "A conferir" liga/desliga o filtro da lista. */
  onConferir?: () => void;
}

// Card no tom do Claude Design (Casas Header v2): um degrau acima do fundo,
// borda sutil, sem sombra.
const CARD = "flex flex-col gap-1.5 rounded-[14px] border border-foreground/[0.08] bg-[rgb(var(--rgb-panel))] px-[18px] py-4 text-left";

// "Movimentado" saiu: depósitos e saques moram no detalhe da casa. No lugar
// entrou "Em aberto", que antes ia espremido na dica do saldo.
export function HousesMetrics({
  metrics,
  withBalanceCount,
  openStake = 0,
  isLoading = false,
  conferirActive = false,
  onConferir,
}: HousesMetricsProps) {
  // Campo que não veio (conta nova, resposta parcial) conta como zero, não NaN.
  const num = (v: unknown) => Number(v) || 0;
  const profit = num(metrics.consolidatedProfit);
  const negatives = num(metrics.negativeHouses);
  const casas = (n: number) => `${n} ${n === 1 ? "casa" : "casas"}`;

  const blocks = [
    { label: "Saldo total", value: formatMoney(num(metrics.totalBalance)), hint: `em ${casas(withBalanceCount)}` },
    { label: "Em aberto", value: formatMoney(openStake), hint: "apostas pendentes" },
    {
      label: "Lucro consolidado",
      value: formatMoney(profit, { signed: true }),
      valueClass: signColor(profit),
      hint: "desde o início",
    },
    {
      // "A conferir" e não "Casas negativas": saldo real abaixo de zero não é
      // dívida com a casa, é depósito/resultado que faltou lançar. O valor do
      // buraco fica na dica — o número grande é quantas casas conferir.
      label: "A conferir",
      value: casas(negatives),
      hint: conferirActive
        ? "mostrando só essas · clique pra voltar"
        : negatives > 0
          ? `${formatMoney(num(metrics.negativeAmount))} sem lançamento`
          : "nenhuma casa no vermelho",
      // Vira botão só quando há o que conferir: é o atalho pra conciliação.
      onClick: negatives > 0 || conferirActive ? onConferir : undefined,
      active: conferirActive,
      dot: negatives > 0,
    },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
      {blocks.map((b) => {
        const clickable = !!b.onClick;
        const body = (
          <>
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              {b.dot && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
              {b.label}
              {clickable && <ArrowRight size={14} className="ml-auto text-zinc-500" />}
            </span>
            {isLoading ? (
              <span className="h-8 w-28 rounded bg-foreground/10 animate-pulse" />
            ) : (
              <span className={cn("text-[26px] leading-8 font-semibold tabular-nums", b.valueClass)}>{b.value}</span>
            )}
            <span className="text-xs text-zinc-500">{b.hint}</span>
          </>
        );
        return clickable ? (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            aria-pressed={b.active}
            className={cn(
              CARD,
              "press transition-colors hover:border-foreground/20 hover:bg-foreground/[0.02]",
              b.active && "border-warning/40 bg-warning/[0.04]",
            )}
          >
            {body}
          </button>
        ) : (
          <div key={b.label} className={CARD}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
