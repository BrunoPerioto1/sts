import { Link, NavLink, useLocation } from "react-router-dom";
import {
  SidebarSimple,
  SquaresFour,
  Receipt,
  Buildings,
  BuildingOffice,
  PaperPlaneTilt,
  SignOut,
  ClipboardText,
  UsersThree,
  GitFork,
  Scan,
  GearSix,
  Sparkle,
  CaretUpDown,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { LogoIcon } from "@/components/brand/LogoIcon";
import { useMe } from "@/hooks/queries/use-me";
import { useSettlementQueue } from "@/hooks/apostas/use-settlement";
import { useTipCounts } from "@/hooks/queries/use-tips";
import { cn } from "@/lib/utils";
import { ResultIdEnum } from "@/api/routes/get-bets";
import { ADMIN_ROLE_ID } from "@/lib/admin-health";
import { displayName, initialsOf } from "@/lib/format";
import { useTheme } from "next-themes";
import { THEME_OPTIONS } from "@/components/perfil/ThemeSelect";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BadgeKey = "overdue" | "suggestions" | "tips";

interface NavItem {
  label: string;
  icon: PhosphorIcon;
  href: string;
  badge?: BadgeKey;
  // Badge em destaque (azul) em vez de neutro: pede ação do usuário.
  badgeHighlight?: boolean;
  // O número vira link próprio: leva direto ao que ele conta.
  badgeHref?: string;
  badgeLabel?: string;
}

interface NavSection {
  title: string;
  // Esconder aqui só evita oferecer tela que daria 403; quem protege de
  // verdade é o AdminGuard do backend.
  adminOnly?: boolean;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Gestão",
    items: [
      { label: "Dashboard", icon: SquaresFour, href: "/dashboard" },
      // A lista abre no mês atual e o badge conta pendentes de qualquer data:
      // sem o link próprio, clicar no número caía numa lista vazia.
      { label: "Apostas", icon: Receipt, href: "/bets", badge: "overdue", badgeHref: `/bets?status=${ResultIdEnum.PENDING}&period=tudo`, badgeLabel: "pendentes de jogo encerrado" },
      { label: "Tips", icon: PaperPlaneTilt, href: "/tips", badge: "tips" },
      { label: "Conferência", icon: ClipboardText, href: "/settlement", badge: "suggestions", badgeHighlight: true },
      { label: "Casas de Apostas", icon: Buildings, href: "/houses" },
    ],
  },
  {
    title: "Administração",
    adminOnly: true,
    items: [
      { label: "Gerenciar Casas", icon: BuildingOffice, href: "/admin/houses" },
      { label: "Usuários", icon: UsersThree, href: "/admin/users" },
      { label: "Pipeline", icon: GitFork, href: "/admin/pipeline" },
      { label: "Scanner", icon: Scan, href: "/admin/scanner" },
    ],
  },
  {
    title: "Conta",
    items: [
      { label: "Plano", icon: Sparkle, href: "/plano" },
      { label: "Configurações", icon: GearSix, href: "/profile" },
    ],
  },
];

// Uma fonte só pra largura: o <main> do AppShell desloca pelo mesmo número.
// Antes eram 256px aqui e 248px lá, e a sidebar cobria 8px do conteúdo.
// 272 desde que a marca e os itens cresceram (referência: Bet Analytix).
export const SIDEBAR_WIDTH = 272;
export const SIDEBAR_COLLAPSED_WIDTH = 72;

type Me = ReturnType<typeof useMe>["me"];

function Avatar({ user }: { user: Me }) {
  return (
    <span className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center text-[13px] font-semibold shrink-0">
      {user ? initialsOf(displayName(user)) : "?"}
    </span>
  );
}

function UserLines({ user }: { user: Me }) {
  return (
    <span className="overflow-hidden flex-1 min-w-0">
      <span className="block text-sm font-semibold truncate">{user ? displayName(user) : "…"}</span>
      <span className="block text-xs text-foreground/50 truncate">{user?.email ?? ""}</span>
    </span>
  );
}

interface AppSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onNavigate?: () => void;
}

export function AppSidebar({ collapsed = false, setCollapsed = () => {}, onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const isInDrawer = !!onNavigate;
  const { me: user } = useMe();
  const isAdmin = user?.roleId === ADMIN_ROLE_ID;
  // Proposta esperando confirmação é dinheiro parado: o número no menu é o que
  // faz o usuário voltar na conferência sem precisar lembrar dela sozinho.
  const { data: fila } = useSettlementQueue();
  // Tips pendentes: neutro, não azul — é fila de oportunidade, não pendência
  // que trava dinheiro como a conferência.
  const { data: tipCounts } = useTipCounts();
  const visible = sections.filter((s) => !s.adminOnly || isAdmin);

  const { theme, setTheme } = useTheme();
  // Sem escolha salva o app abre escuro (defaultTheme do App.tsx).
  const currentTheme = theme ?? "dark";
  const CurrentThemeIcon = (THEME_OPTIONS.find((o) => o.value === currentTheme) ?? THEME_OPTIONS[0]).icon;

  const logout = () => {
    onNavigate?.();
    window.location.href = "/logout";
  };

  return (
    <div
      className="flex flex-col bg-sidebar text-sidebar-foreground border-r border-border transition-[width] duration-200"
      style={{
        width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        position: isInDrawer ? "relative" : "fixed",
        left: isInDrawer ? "auto" : 0,
        top: isInDrawer ? "auto" : 0,
        height: "100dvh",
        padding: "22px 14px 16px",
        zIndex: isInDrawer ? "auto" : 50,
      }}
    >
      {/* Marca grande, como a do Bet Analytix: ícone de 36px e o nome em 21px,
          o mesmo ícone de 36px quando recolhida. */}
      <div className={cn("flex min-h-9 items-center mb-8 px-1", collapsed ? "justify-center" : "justify-between")}>
        <div className={cn("flex items-center overflow-hidden", !collapsed && "gap-2.5")}>
          <LogoIcon className="w-9 h-9 shrink-0" />
          {!collapsed && (
            <span className="text-[21px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              Trackton
            </span>
          )}
        </div>
        {!isInDrawer && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-foreground/50 hover:text-foreground shrink-0 transition-colors"
            aria-label="Colapsar menu"
            title="Colapsar menu"
          >
            <SidebarSimple size={18} />
          </button>
        )}
      </div>

      {!isInDrawer && collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="text-foreground/50 hover:text-foreground mb-4 self-center transition-colors"
          aria-label="Expandir menu"
          title="Expandir menu"
          style={{ transform: "scaleX(-1)" }}
        >
          <SidebarSimple size={18} />
        </button>
      )}

      <nav className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
        {visible.map((section, i) => (
          <div key={section.title} className="flex flex-col gap-1">
            {collapsed ? (
              i > 0 && <div className="mx-3 mb-1 border-t border-border" />
            ) : (
              <div className="px-3 mb-1.5 text-xs font-bold uppercase tracking-[0.06em] text-foreground/50">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              const badge = item.badge === "tips" ? tipCounts?.pending : item.badge ? fila?.[item.badge] : undefined;
              const badgeClass = cn(
                "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                item.badgeHighlight ? "bg-accent/[0.22] text-accent-text" : "bg-foreground/[0.08] text-foreground/70",
              );
              return (
                <div key={item.href} className="relative">
                <NavLink
                  to={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3.5 rounded-[10px] py-2.5 text-[15px] font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    isActive
                      ? "bg-accent/[0.16] text-accent-text"
                      : "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground",
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon size={21} />
                    {/* Colapsado não sobra largura pro número: vira só o ponto. */}
                    {collapsed && !!badge && item.badgeHighlight && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                      {!!badge && !item.badgeHref && <span className={cn("ml-auto", badgeClass)}>{badge}</span>}
                    </>
                  )}
                </NavLink>
                {/* Irmão do NavLink, não filho: link dentro de link não é HTML válido. */}
                {!collapsed && !!badge && item.badgeHref && (
                  <Link
                    to={item.badgeHref}
                    onClick={onNavigate}
                    aria-label={`${badge} ${item.badgeLabel}`}
                    title={`Ver ${item.badgeLabel}`}
                    className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:bg-foreground/[0.16] hover:text-foreground", badgeClass)}
                  >
                    {badge}
                  </Link>
                )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="pt-3 shrink-0">
        {/* O card inteiro abre o menu da conta, como no colapsado (só o avatar). */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Opções da conta"
            className={cn(
              "w-full flex items-center gap-3 rounded-xl border border-border bg-foreground/[0.03] text-left hover:bg-foreground/[0.06] transition-colors",
              collapsed ? "justify-center p-1.5" : "p-3",
            )}
          >
            <Avatar user={user} />
            {!collapsed && (
              <>
                <UserLines user={user} />
                <CaretUpDown size={16} className="text-foreground/55 shrink-0" />
              </>
            )}
          </DropdownMenuTrigger>
          {/* Pra cima e na largura do card: aberto pro lado ele invadia a tela. */}
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={6}
            className={cn(collapsed ? "w-52" : "w-[var(--radix-dropdown-menu-trigger-width)]")}
          >
            {/* Recolhido, o card não mostra nome nem email: o menu mostra. */}
            {collapsed && (
              <>
                <div className="px-2 py-1.5">
                  <UserLines user={user} />
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <CurrentThemeIcon size={16} className="mr-2" />
                Tema
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {THEME_OPTIONS.map((o) => (
                  <DropdownMenuCheckboxItem
                    key={o.value}
                    checked={currentTheme === o.value}
                    onCheckedChange={() => setTheme(o.value)}
                  >
                    <o.icon size={16} className="mr-2" />
                    {o.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={logout}>
              <SignOut size={16} className="mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
