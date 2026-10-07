import { useId } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeSelect } from "./ThemeSelect";
import { Bank, IdentificationCard, Palette, Pulse, ShieldCheck, SignOut, SlidersHorizontal, SquaresFour, TelegramLogo, Users, type Icon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ListGroup, ListIcon, ListRow } from "@/components/ui/list-group";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE_ID } from "@/lib/admin-health";
import { displayName, formatInt, formatMoney, formatPercent, initialsOf } from "@/lib/format";
import { useProfitSparkline } from "@/hooks/perfil/use-profit-sparkline";
import type { MeResponse } from "@/api/routes/get-me";
import type { ProfileSummary } from "@/hooks/perfil/use-profile-summary";

function preferencesSummary(me: MeResponse): string {
  const stake = me.stake != null ? Number(me.stake) : null;
  const filter = me.minPercentFilter != null ? Number(me.minPercentFilter) : null;
  if (stake == null && filter == null) return "Não configurado";
  const parts: string[] = [];
  if (stake != null) parts.push(`Banca ${formatMoney(stake, { cents: false })}`);
  if (filter != null) parts.push(`stake ${formatPercent(filter / 100, { decimals: 2, minDecimals: 0 })}`);
  return parts.join(" · ");
}

// "desde 21 ago" — a conta é a única data que temos de verdade; a data da
// primeira aposta exigiria outra chamada só pra isso. Ano só se não for o atual.
function sinceLabel(createdAt: MeResponse["createdAt"]): string | null {
  if (!createdAt) return null;
  const created = new Date(createdAt);
  const sameYear = created.getFullYear() === new Date().getFullYear();
  const label = created
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", ...(sameYear ? {} : { year: "numeric" }) })
    .replace(/\./g, "")
    .replace(/ de /g, " ");
  return `desde ${label}`;
}

/** Avatar + nome + e-mail e badge de admin — vai no mobileHeader do PerfilPage. */
export function PerfilMobileHeader({ me }: { me: MeResponse }) {
  return (
    <div className="flex items-center gap-3.5 min-w-0">
      <span className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-accent-text to-accent flex items-center justify-center text-lg font-semibold text-white">
        {initialsOf(displayName(me))}
      </span>
      <div className="min-w-0 space-y-1">
        <h1 className="text-[19px] leading-tight font-semibold tracking-tight truncate">{displayName(me)}</h1>
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-xs text-zinc-500 truncate">{me.email}</p>
          {me.roleId === ADMIN_ROLE_ID && (
            <span className="shrink-0 rounded-full bg-foreground/[0.08] px-2 py-px text-[11px] font-medium text-zinc-300">admin</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Linha do lucro acumulado, com gradiente sumindo pra transparente. */
function Sparkline({ values, className }: { values: number[]; className?: string }) {
  const gradientId = useId();
  if (values.length < 2) return null;
  const w = 300;
  const h = 40;
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 2 - ((v - min) / range) * (h - 4)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("w-full h-10", className)} aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
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
  to: string;
  icon: Icon;
  label: string;
  value?: React.ReactNode;
  trailing?: React.ReactNode;
}

/** Linhas de navegação do Perfil: ícone tingido · nome · resumo · chevron. */
function rows(list: Row[], tone: "accent" | "neutral" = "accent") {
  return list.map((row) => (
    <ListRow
      key={row.label}
      to={row.to}
      leading={<ListIcon icon={row.icon} tone={tone} />}
      title={row.label}
      subtitle={row.value}
      trailing={row.trailing}
    />
  ));
}

export function PerfilMobileView({ me, summary, metricsLoading, metricsError, metricsUnavailable }: PerfilMobileViewProps) {
  const navigate = useNavigate();
  const isLinked = !!me.telegramUserId;
  const since = sinceLabel(me.createdAt);
  const sparkline = useProfitSparkline(me.createdAt);
  const positive = summary.totalProfit >= 0;
  const tone = !metricsUnavailable && (positive ? "text-success" : "text-danger");

  // Banca/stake ficam só em Preferências de aposta; aqui entra a taxa de
  // acerto, que antes era só subtexto. Quantas casas têm saldo fica na tela de Casas.
  const stats = [
    {
      label: "Apostas",
      value: metricsUnavailable ? "—" : formatInt(summary.totalBets),
      hint: `${formatInt(summary.wonBets)} ganhas`,
    },
    {
      label: "Acerto",
      value: metricsUnavailable ? "—" : formatPercent(summary.hitRate),
      hint: `de ${formatInt(summary.settledBets)} resolvidas`,
    },
    {
      label: "Saldo nas casas",
      value: formatMoney(summary.bankroll, { cents: false }),
    },
  ];

  const contaRows: Row[] = [
    { to: "/profile/account", icon: IdentificationCard, label: "Dados da conta", value: "Nome, e-mail e senha" },
    { to: "/profile/preferences", icon: SlidersHorizontal, label: "Preferências de aposta", value: preferencesSummary(me) },
    isLinked
      ? {
          to: "/profile/telegram",
          icon: TelegramLogo,
          label: "Telegram",
          value: me.telegramUsername ? `@${me.telegramUsername}` : "Conta sem @",
          trailing: (
            <span className="shrink-0 flex items-center gap-1.5 text-xs text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" /> Vinculado
            </span>
          ),
        }
      : { to: "/profile/telegram", icon: TelegramLogo, label: "Telegram", value: <span className="text-accent-text">Não vinculado</span> },
    { to: "/profile/dashboard", icon: SquaresFour, label: "Dashboard", value: "Indicadores, ícones e cores" },
  ];

  // Admin entra por aqui no celular, e não na bottom nav: sétima aba deixaria
  // cada alvo com menos de 56px, e a tela é de manutenção, não de uso diário.
  const adminRows: Row[] = [
    { to: "/admin/houses", icon: Bank, label: "Casas", value: "Catálogo e apelidos" },
    { to: "/admin/users", icon: Users, label: "Usuários", value: "Papéis e bloqueios" },
    { to: "/admin/pipeline", icon: Pulse, label: "Pipeline", value: "Saúde da coleta" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3.5">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Lucro acumulado</p>
            {since && <p className="text-xs text-zinc-500">{since}</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={cn("text-[32px] leading-none font-semibold tracking-tight tabular-nums", tone)}>
              {metricsLoading ? (
                <Skeleton className="h-8 w-40 rounded-lg" />
              ) : metricsError ? (
                "Indisponível"
              ) : (
                formatMoney(summary.totalProfit, { signed: true })
              )}
            </span>
            {!metricsUnavailable && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[12px] font-medium tabular-nums",
                  positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                )}
              >
                ROI {formatPercent(summary.roi)}
              </span>
            )}
          </div>
          {!metricsUnavailable && <Sparkline values={sparkline} className={cn("pt-1", tone)} />}
        </div>
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          {stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} hint={s.hint} />
          ))}
        </div>
      </div>

      <ListGroup title="Conta">
        {rows(contaRows)}
        {/* Tema quebra o padrão da linha: label em cima e o seletor ocupando
            a largura toda embaixo, em vez de espremido ao lado do título. */}
        <div className="px-3.5 py-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <ListIcon icon={Palette} />
            <span className="text-sm font-medium text-foreground">Tema</span>
          </div>
          <ThemeSelect className="flex w-full" />
        </div>
      </ListGroup>
      {me.roleId === ADMIN_ROLE_ID && (
        // Só admin vê esta seção: escudo e ícones em cinza marcam a diferença.
        <ListGroup title="Administração" titleIcon={<ShieldCheck size={13} weight="fill" className="text-zinc-400" />}>
          {rows(adminRows, "neutral")}
        </ListGroup>
      )}

      {/* Ação destrutiva fecha a tela como botão ghost, não com peso de card. */}
      <div className="flex flex-col items-center gap-1 pb-2">
        <Button variant="destructive" className="h-11 px-4 gap-2" onClick={() => navigate("/logout")}>
          <SignOut size={16} /> Sair da conta
        </Button>
        <p className="text-xs text-zinc-600 tabular-nums">v{__APP_VERSION__}</p>
      </div>
    </div>
  );
}
