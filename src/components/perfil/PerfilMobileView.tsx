import { Link, useNavigate } from "react-router-dom";
import { ThemeSelect } from "./ThemeSelect";
import { Bank, CaretRight, IdentificationCard, Palette, Pulse, SignOut, SlidersHorizontal, SquaresFour, TelegramLogo, Users, type Icon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE_ID } from "@/lib/admin-health";
import { displayName, formatCurrencyCompact, formatSignedCurrency, initialsOf } from "@/lib/format";
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

// "em 2 meses · desde 21 ago 2026" — a conta é a única data que temos de
// verdade; a data da primeira aposta exigiria outra chamada só pra isso.
function sinceLabel(createdAt: MeResponse["createdAt"]): string | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const months = Math.max(
    1,
    (new Date().getFullYear() - created.getFullYear()) * 12 + new Date().getMonth() - created.getMonth()
  );
  const label = created
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
  return `em ${months} ${months === 1 ? "mês" : "meses"} · desde ${label}`;
}

const pct = (v: number) => `${(v * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

/** Avatar + nome + "e-mail · admin" — vai no mobileHeader do PerfilPage. */
export function PerfilMobileHeader({ me }: { me: MeResponse }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-10 h-10 shrink-0 rounded-full bg-card border border-border flex items-center justify-center text-sm font-medium text-accent-text">
        {initialsOf(displayName(me))}
      </span>
      <div className="min-w-0">
        <h1 className="text-[17px] font-semibold tracking-tight truncate">{displayName(me)}</h1>
        <p className="text-xs text-zinc-500 truncate">
          {me.email}
          {me.roleId === ADMIN_ROLE_ID && " · admin"}
        </p>
      </div>
    </div>
  );
}

interface PerfilMobileViewProps {
  me: MeResponse;
  summary: ProfileSummary;
  metricsLoading: boolean;
  metricsError: boolean;
  metricsUnavailable: boolean;
}

interface Row {
  to?: string;
  icon: Icon;
  label: string;
  value?: string;
  valueTone?: string;
  trailing?: React.ReactNode;
}

function RowGroup({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="space-y-2">
      <p className="px-1 text-xs text-zinc-500">{title}</p>
      <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
        {rows.map((row) => {
          const inner = (
            <>
              <span className="w-8 h-8 shrink-0 rounded-[9px] bg-foreground/[0.06] flex items-center justify-center">
                <row.icon size={16} className="text-accent-text" />
              </span>
              {/* Nome inteiro em cima e valor embaixo: em uma linha só,
                  "Preferências de aposta" era cortado no meio. */}
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] text-foreground truncate">{row.label}</span>
                {row.value && (
                  <span className={cn("block text-xs tabular-nums truncate", row.valueTone ?? "text-zinc-500")}>{row.value}</span>
                )}
              </span>
              {row.trailing ?? <CaretRight size={13} className="text-zinc-600 shrink-0" />}
            </>
          );
          return row.to ? (
            <Link key={row.label} to={row.to} className="press h-[60px] px-3.5 flex items-center gap-3 hover:bg-foreground/[0.03]">
              {inner}
            </Link>
          ) : (
            <div key={row.label} className="h-[60px] px-3.5 flex items-center gap-3">
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PerfilMobileView({ me, summary, metricsLoading, metricsError, metricsUnavailable }: PerfilMobileViewProps) {
  const navigate = useNavigate();
  const isLinked = !!me.telegramUserId;
  const since = sinceLabel(me.createdAt);
  const stake = me.stake != null ? Number(me.stake) : null;
  const filter = me.minPercentFilter != null ? Number(me.minPercentFilter) : null;
  const tone = !metricsUnavailable && (summary.totalProfit >= 0 ? "text-positive" : "text-negative");

  // "Em casas" é saldo real; "Banca" é a referência do stake nas preferências.
  // Antes as duas apareciam como "Banca" com valores diferentes.
  const stats = [
    {
      label: "Apostas",
      value: metricsUnavailable ? "—" : summary.totalBets.toLocaleString("pt-BR"),
      hint: `${summary.wonBets.toLocaleString("pt-BR")} ganhas · ${pct(summary.hitRate)}`,
    },
    {
      label: "Em casas",
      value: formatCurrencyCompact(summary.bankroll),
      hint: `${summary.housesWithBalance} de ${summary.totalHouses} com saldo`,
    },
    {
      label: "Banca",
      value: stake != null ? formatCurrencyCompact(stake) : "—",
      hint: filter != null ? `stake ${filter.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%` : "não configurada",
    },
  ];

  const contaRows: Row[] = [
    { to: "/profile/account", icon: IdentificationCard, label: "Dados da conta", value: "Nome, e-mail e senha" },
    { to: "/profile/preferences", icon: SlidersHorizontal, label: "Preferências de aposta", value: preferencesSummary(me) },
    {
      to: "/profile/telegram",
      icon: TelegramLogo,
      label: "Telegram",
      value: isLinked ? "Vinculado" : "Não vinculado",
      valueTone: isLinked ? "text-positive" : "text-accent-text",
    },
    { to: "/profile/dashboard", icon: SquaresFour, label: "Dashboard", value: "Indicadores, ícones e cores" },
    { icon: Palette, label: "Tema", trailing: <ThemeSelect /> },
  ];

  // Admin entra por aqui no celular, e não na bottom nav: sétima aba deixaria
  // cada alvo com menos de 56px, e a tela é de manutenção, não de uso diário.
  const adminRows: Row[] = [
    { to: "/admin/houses", icon: Bank, label: "Casas", value: "Catálogo e apelidos" },
    { to: "/admin/users", icon: Users, label: "Usuários", value: "Papéis e bloqueios" },
    { to: "/admin/pipeline", icon: Pulse, label: "Pipeline", value: "Saúde da coleta" },
  ];

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
        <div className="space-y-1">
          <p className="text-xs text-zinc-500">Lucro acumulado</p>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className={cn("text-[32px] leading-none font-semibold tracking-tight tabular-nums", tone)}>
              {metricsLoading ? (
                <Skeleton className="h-8 w-40 rounded-lg" />
              ) : metricsError ? (
                "Indisponível"
              ) : (
                formatSignedCurrency(summary.totalProfit)
              )}
            </span>
            {!metricsUnavailable && <span className={cn("text-[12.5px] tabular-nums", tone)}>ROI {pct(summary.roi)}</span>}
          </div>
          {since && <p className="text-xs text-zinc-500">{since}</p>}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          {stats.map((s) => (
            <div key={s.label} className="min-w-0 space-y-0.5">
              <p className="text-[11.5px] text-zinc-500">{s.label}</p>
              <p className="text-lg font-semibold tracking-tight tabular-nums truncate">{s.value}</p>
              <p className="text-[11px] text-zinc-500 tabular-nums truncate">{s.hint}</p>
            </div>
          ))}
        </div>
      </div>

      <RowGroup title="Conta" rows={contaRows} />
      {me.roleId === ADMIN_ROLE_ID && <RowGroup title="Administração" rows={adminRows} />}

      <button
        type="button"
        onClick={() => navigate("/logout")}
        className="press w-full h-[46px] rounded-xl border border-border flex items-center justify-center gap-2 text-[14.5px] text-zinc-400 hover:bg-card"
      >
        <SignOut size={16} /> Sair da conta
      </button>
    </div>
  );
}
