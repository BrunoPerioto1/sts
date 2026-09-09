import { TrendUp, Coins, Database, Clock, CreditCard, ChartBar, Target, ChartLine, Percent, Pulse, Stack, List, Ticket, Timer, Hourglass, Wallet, Money, Crosshair, Trophy, CheckCircle } from "@phosphor-icons/react";
import { DASHBOARD_KPI_REGISTRY, type IconId, type KpiId } from "@/lib/dashboard-preferences";

export const ICON_REGISTRY = {
  "trending-up": { icon: TrendUp, label: "Tendência" }, coins: { icon: Coins, label: "Moedas" },
  database: { icon: Database, label: "Base de dados" }, clock: { icon: Clock, label: "Relógio" },
  "credit-card": { icon: CreditCard, label: "Cartão" }, "chart-bar": { icon: ChartBar, label: "Barras" },
  target: { icon: Target, label: "Alvo" }, "chart-line": { icon: ChartLine, label: "Gráfico" },
  percent: { icon: Percent, label: "Porcentagem" }, activity: { icon: Pulse, label: "Atividade" },
  layers: { icon: Stack, label: "Camadas" }, list: { icon: List, label: "Lista" }, ticket: { icon: Ticket, label: "Bilhete" },
  timer: { icon: Timer, label: "Cronômetro" }, hourglass: { icon: Hourglass, label: "Ampulheta" },
  wallet: { icon: Wallet, label: "Carteira" }, banknote: { icon: Money, label: "Cédula" },
  crosshair: { icon: Crosshair, label: "Mira" }, trophy: { icon: Trophy, label: "Troféu" },
  "check-circle": { icon: CheckCircle, label: "Confirmação" },
} satisfies Record<IconId, { icon: typeof TrendUp; label: string }>;

export function resolveKpiIcon(id: KpiId, icon: string) {
  return (Object.prototype.hasOwnProperty.call(ICON_REGISTRY, icon) ? ICON_REGISTRY[icon as IconId] : ICON_REGISTRY[DASHBOARD_KPI_REGISTRY[id].defaultIcon]).icon;
}
