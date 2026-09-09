import { Link, useNavigate } from "react-router-dom";
import { CaretRight, IdentificationCard, SignOut, SlidersHorizontal, SquaresFour, TelegramLogo } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact, formatSignedCurrency } from "@/lib/format";
import type { MeResponse } from "@/api/routes/get-me";
import type { ProfileSummary } from "@/hooks/perfil/use-profile-summary";

function preferencesSummary(me: MeResponse): string {
  const stake = me.stake != null ? Number(me.stake) : null;
  const filter = me.minPercentFilter != null ? Number(me.minPercentFilter) : null;
  if (stake == null && filter == null) return "Não configurado";
  const parts: string[] = [];
  if (stake != null) parts.push(`Banca ${formatCurrencyCompact(stake)}`);
  if (filter != null) parts.push(`${filter.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`);
  return parts.join(" · ");
}

// "desde março de 2025 · 18 meses" — a conta é a única data que temos de
// verdade; a data da primeira aposta exigiria outra chamada só pra isso.
function sinceLabel(createdAt: MeResponse["createdAt"]): string | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const months = Math.max(
    1,
    (new Date().getFullYear() - created.getFullYear()) * 12 + new Date().getMonth() - created.getMonth()
  );
  const label = created.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return `desde ${label} · ${months} ${months === 1 ? "mês" : "meses"}`;
}

interface PerfilMobileViewProps {
  me: MeResponse;
  summary: ProfileSummary;
  metricsLoading: boolean;
  metricsError: boolean;
  metricsUnavailable: boolean;
}

export function PerfilMobileView({ me, summary, metricsLoading, metricsError, metricsUnavailable }: PerfilMobileViewProps) {
  const navigate = useNavigate();
  const isLinked = !!me.telegramUserId;
  const since = sinceLabel(me.createdAt);

  const metricTiles = [
    {
      label: "Apostas",
      value: summary.totalBets.toLocaleString("pt-BR"),
      sub: `${summary.wonBets.toLocaleString("pt-BR")} ganhas`,
    },
    {
      label: "ROI histórico",
      value: `${(summary.roi * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
      tone: summary.roi >= 0 ? "text-positive" : "text-negative",
      sub: `acerto ${(summary.hitRate * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`,
    },
    {
      label: "Casas",
      value: summary.totalHouses.toLocaleString("pt-BR"),
      sub: `${summary.housesWithBalance} com saldo`,
    },
    {
      label: "Banca",
      value: formatCurrencyCompact(summary.bankroll),
      sub: "distribuída",
    },
  ];

  const settingsRows = [
    { to: "/profile/dashboard", icon: SquaresFour, label: "Dashboard", value: "Indicadores, ícones e cores" },
    { to: "/profile/account", icon: IdentificationCard, label: "Dados da conta", value: "Nome, e-mail e segurança" },
    {
      to: "/profile/telegram",
      icon: TelegramLogo,
      label: "Telegram",
      value: isLinked ? "Vinculado" : "Não vinculado",
      valueTone: isLinked ? "text-positive" : "text-accent",
    },
    { to: "/profile/preferences", icon: SlidersHorizontal, label: "Preferências de aposta", value: preferencesSummary(me) },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100dvh-190px)] gap-6">
      {/* Lucro acumulado é o número que resume a conta — os outros quatro
          viram grade, como no dashboard. */}
      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Lucro acumulado</p>
        <p className={cn("text-3xl font-semibold tabular-nums leading-tight", !metricsUnavailable && (summary.totalProfit >= 0 ? "text-positive" : "text-negative"))}>
          {metricsLoading ? <Skeleton className="h-8 w-40 rounded-lg" /> : metricsError ? "Indisponível" : formatSignedCurrency(summary.totalProfit)}
        </p>
        {since && <p className="text-sm text-zinc-500 mt-0.5">{since}</p>}
      </div>

      <div className="grid grid-cols-2">
        {metricTiles.map((tile, i) => (
          <div
            key={tile.label}
            className={cn("py-4", i % 2 === 1 && "border-l border-border pl-4", i >= 2 && "border-t border-border")}
          >
            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{tile.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums", !metricsUnavailable && tile.tone)}>{metricsUnavailable ? "—" : tile.value}</p>
            {tile.sub && <p className="text-xs text-zinc-500 mt-0.5">{tile.sub}</p>}
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Ajustes</p>
        <div className="flex flex-col divide-y divide-border border-y border-border">
          {settingsRows.map((row) => (
            <Link key={row.to} to={row.to} className="press h-14 flex items-center gap-3">
              <row.icon size={19} className="text-zinc-400 shrink-0" />
              {/* Nome inteiro em cima e valor embaixo: em uma linha só,
                  "Preferências de aposta" era cortado no meio. */}
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white truncate">{row.label}</span>
                <span className={cn("block text-xs truncate", row.valueTone ?? "text-zinc-500")}>{row.value}</span>
              </span>
              <CaretRight size={16} className="text-zinc-500 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => navigate("/logout")}
        className="press w-full h-12 rounded-xl border border-white/10 flex items-center justify-center gap-2 text-sm text-white"
      >
        <SignOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
