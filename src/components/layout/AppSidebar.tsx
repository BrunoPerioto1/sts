import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ChartLineUp,
  SidebarSimple,
  SquaresFour,
  Receipt,
  Buildings,
  Ranking,
  UserCircle,
  SignOut,
} from "@phosphor-icons/react";
import { getMe } from "@/api/routes/get-me";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: SquaresFour, path: "/dashboard" },
  { id: "apostas", label: "Apostas", icon: Receipt, path: "/apostas" },
  { id: "casas", label: "Casas de Apostas", icon: Buildings, path: "/casas" },
  { id: "comparador", label: "Comparador", icon: Ranking, path: "/comparador" },
  { id: "perfil", label: "Perfil", icon: UserCircle, path: "/perfil" },
];

interface AppSidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  onNavigate?: () => void;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AppSidebar({ collapsed = false, setCollapsed = () => {}, onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const isInDrawer = !!onNavigate;
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    getMe()
      .then((me) => setUser({ username: me.username, email: me.email }))
      .catch(() => setUser(null));
  }, []);

  return (
    <div
      className="flex flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-200"
      style={{
        width: collapsed ? "72px" : "248px",
        position: isInDrawer ? "relative" : "fixed",
        left: isInDrawer ? "auto" : 0,
        top: isInDrawer ? "auto" : 0,
        height: "100vh",
        padding: "18px 12px",
        zIndex: isInDrawer ? "auto" : 50,
      }}
    >
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-[26px] h-[26px] rounded-md border border-accent flex items-center justify-center shrink-0">
            <ChartLineUp size={16} className="text-accent" />
          </div>
          {!collapsed && (
            <span className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              SportsBet Manager
            </span>
          )}
        </div>
        {!isInDrawer && !collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-foreground/50 hover:text-foreground shrink-0 transition-transform"
            aria-label="Colapsar menu"
            title="Colapsar menu"
          >
            <SidebarSimple size={18} />
          </button>
        )}
      </div>

      {!isInDrawer && collapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-foreground/50 hover:text-foreground mb-4 px-1 self-start transition-transform"
          aria-label="Expandir menu"
          title="Expandir menu"
          style={{ transform: "scaleX(-1)" }}
        >
          <SidebarSimple size={18} />
        </button>
      )}

      <nav className="flex flex-col gap-[2px] flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-[10px] py-2 text-[13px] transition-colors"
              style={{
                color: isActive ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 62%, transparent)",
                background: isActive ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
                boxShadow: isActive ? "inset 2px 0 0 var(--color-accent)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "color-mix(in srgb, var(--color-text) 7%, transparent)";
                  e.currentTarget.style.color = "var(--color-text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "color-mix(in srgb, var(--color-text) 62%, transparent)";
                }
              }}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="pt-3 mt-2 border-t border-border">
        <button
          onClick={() => {
            if (onNavigate) onNavigate();
            window.location.href = "/logout";
          }}
          className="flex items-center gap-2 w-full rounded-lg px-1 py-1 hover:bg-foreground/[0.07] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-accent-800 text-accent-100 flex items-center justify-center text-[11px] font-medium shrink-0">
            {user ? initialsOf(user.username) : "?"}
          </div>
          {!collapsed && (
            <div className="text-left overflow-hidden flex-1">
              <div className="text-xs whitespace-nowrap overflow-hidden text-ellipsis">{user?.username ?? "…"}</div>
              <div className="text-[10px] opacity-55 whitespace-nowrap overflow-hidden text-ellipsis">{user?.email ?? ""}</div>
            </div>
          )}
          {!collapsed && <SignOut size={16} className="opacity-55 shrink-0" />}
        </button>
      </div>
    </div>
  );
}
