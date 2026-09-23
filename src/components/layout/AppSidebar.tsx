import { NavLink, useLocation } from "react-router-dom";
import {
  ChartLineUp,
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
  GearSix,
  DotsThreeVertical,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useMe } from "@/hooks/queries/use-me";
import { useSettlementQueue } from "@/hooks/apostas/use-settlement";
import { cn } from "@/lib/utils";
import { ADMIN_ROLE_ID } from "@/lib/admin-health";
import { initialsOf } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BadgeKey = "pending" | "suggestions";

interface NavItem {
  label: string;
  icon: PhosphorIcon;
  href: string;
  badge?: BadgeKey;
  // Badge em destaque (azul) em vez de neutro: pede ação do usuário.
  badgeHighlight?: boolean;
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
      { label: "Apostas", icon: Receipt, href: "/bets", badge: "pending" },
      { label: "Tips", icon: PaperPlaneTilt, href: "/tips" },
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
    ],
  },
  {
    title: "Conta",
    items: [{ label: "Configurações", icon: GearSix, href: "/profile" }],
  },
];

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
  const visible = sections.filter((s) => !s.adminOnly || isAdmin);

  const logout = () => {
    onNavigate?.();
    window.location.href = "/logout";
  };

  return (
    <div
      className="flex flex-col bg-sidebar text-sidebar-foreground border-r border-border transition-[width] duration-200"
      style={{
        width: collapsed ? "72px" : "256px",
        position: isInDrawer ? "relative" : "fixed",
        left: isInDrawer ? "auto" : 0,
        top: isInDrawer ? "auto" : 0,
        height: "100dvh",
        padding: "20px 12px 14px",
        zIndex: isInDrawer ? "auto" : 50,
      }}
    >
      <div className={cn("flex items-center mb-7 px-1.5", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg border border-accent bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] flex items-center justify-center shrink-0">
            <ChartLineUp size={18} className="text-accent-text" />
          </div>
          {!collapsed && (
            <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
              SportsBet Manager
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

      <nav className="flex flex-col gap-5 flex-1 min-h-0 overflow-y-auto">
        {visible.map((section, i) => (
          <div key={section.title} className="flex flex-col gap-0.5">
            {collapsed ? (
              i > 0 && <div className="mx-3 mb-1 border-t border-border" />
            ) : (
              <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-foreground/45">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              const badge = item.badge ? fila?.[item.badge] : undefined;
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors",
                    collapsed ? "justify-center px-0" : "px-3",
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent-text"
                      : "text-foreground/65 hover:bg-foreground/[0.06] hover:text-foreground",
                  )}
                >
                  <div className="relative shrink-0">
                    <Icon size={19} />
                    {/* Colapsado não sobra largura pro número: vira só o ponto. */}
                    {collapsed && !!badge && item.badgeHighlight && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>
                      {!!badge && (
                        <span
                          className={cn(
                            "ml-auto shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                            item.badgeHighlight ? "bg-[color-mix(in_srgb,var(--color-accent)_22%,transparent)] text-accent-text" : "bg-foreground/[0.08] text-foreground/70",
                          )}
                        >
                          {badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="pt-3 shrink-0">
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-xl border border-border bg-foreground/[0.03]",
            collapsed ? "justify-center p-1.5" : "p-2.5",
          )}
        >
          {/* Colapsado não cabe o ⋮: o avatar vira o botão de sair. */}
          <button
            type="button"
            onClick={collapsed ? logout : undefined}
            tabIndex={collapsed ? 0 : -1}
            title={collapsed ? "Sair" : undefined}
            className={cn(
              "w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold shrink-0",
              !collapsed && "cursor-default",
            )}
          >
            {user ? initialsOf(user.username) : "?"}
          </button>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">{user?.username ?? "…"}</div>
              <div className="text-xs text-foreground/50 whitespace-nowrap overflow-hidden text-ellipsis">{user?.email ?? ""}</div>
            </div>
          )}
          {!collapsed && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-md p-1 text-foreground/55 hover:text-foreground hover:bg-foreground/[0.07] transition-colors shrink-0"
                aria-label="Opções da conta"
              >
                <DotsThreeVertical size={18} weight="bold" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top">
                <DropdownMenuItem onSelect={logout}>
                  <SignOut size={16} className="mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
