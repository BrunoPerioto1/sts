import { HouseMetricsDto } from "@/api/routes/get-houses";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

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

// Depositado e Sacado viraram um bloco só ("Movimentado"): separados ocupavam
// dois quintos do topo pra dizer "R$ 0,00" duas vezes. O detalhe da casa abre
// os dois.
export function HousesMetrics({
  metrics,
  withBalanceCount,
  openStake = 0,
  isLoading = false,
  conferirActive = false,
  onConferir,
}: HousesMetricsProps) {
  const moved = Number(metrics.totalDeposit) + Number(metrics.totalWithdrawal);
  const profit = Number(metrics.consolidatedProfit);
  const negatives = Number(metrics.negativeHouses);

  const blocks = [
    {
      label: "Saldo total",
      value: formatCurrency(metrics.totalBalance),
      hint:
        openStake > 0
          ? `${formatCurrency(openStake)} em aberto · ${withBalanceCount} ${withBalanceCount === 1 ? "casa" : "casas"}`
          : `em ${withBalanceCount} ${withBalanceCount === 1 ? "casa" : "casas"}`,
    },
    {
      label: "Lucro consolidado",
      value: `${profit >= 0 ? "+" : ""}${formatCurrency(profit)}`,
      valueClass: profit >= 0 ? "text-positive" : "text-negative",
      hint: "desde o início",
    },
    {
      label: "Movimentado",
      value: formatCurrency(moved),
      hint: moved === 0 ? "nenhum depósito ou saque" : "depósitos + saques",
    },
    {
      // "A conferir" e não "Casas negativas": saldo real abaixo de zero não é
      // dívida com a casa, é depósito/resultado que faltou lançar. O valor do
      // buraco fica na hint — o número grande é quantas casas conferir.
      label: "A conferir",
      value: `${negatives} de ${metrics.totalHousesUsed}`,
      valueClass: negatives > 0 ? "text-negative" : undefined,
      hint: conferirActive
        ? "mostrando só essas · clique pra voltar"
        : negatives > 0
          ? `${formatCurrency(metrics.negativeAmount)} sem lançamento · ver casas`
          : "nenhuma casa no vermelho",
      // Vira botão só quando há o que conferir: é o atalho pra conciliação.
      onClick: negatives > 0 || conferirActive ? onConferir : undefined,
      active: conferirActive,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border-y border-border">
      {blocks.map((b, i) => {
        const body = (
          <>
            <div className="text-[11px] uppercase tracking-wider opacity-45">{b.label}</div>
            {isLoading ? (
              <div className="h-7 w-24 my-1 rounded bg-foreground/10 animate-pulse" />
            ) : (
              <div className={cn("text-[26px] leading-tight font-medium tabular-nums", b.valueClass)}>{b.value}</div>
            )}
            <div className="text-xs opacity-40">{b.hint}</div>
          </>
        );
        const cell = cn("py-3.5 pr-4 text-left", i > 0 && "md:pl-5 md:border-l border-border");
        return "onClick" in b && b.onClick ? (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            aria-pressed={b.active}
            className={cn(cell, "press transition-colors hover:bg-foreground/[0.03]", b.active && "bg-negative/[0.06]")}
          >
            {body}
          </button>
        ) : (
          <div key={b.label} className={cell}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
