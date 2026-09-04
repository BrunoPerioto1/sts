import { NavLink, useLocation } from "react-router-dom";
import { SquaresFour, Receipt, Buildings, UserCircle } from "@phosphor-icons/react";

const items = [
  { label: "Início", icon: SquaresFour, path: "/dashboard" },
  { label: "Apostas", icon: Receipt, path: "/bets" },
  { label: "Casas", icon: Buildings, path: "/houses" },
  { label: "Perfil", icon: UserCircle, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-border flex md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname.startsWith(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[44px]"
            style={{ color: isActive ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 50%, transparent)" }}
          >
            <Icon size={19} weight={isActive ? "fill" : "regular"} />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
