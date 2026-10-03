import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/profile", label: "Perfil" },
  { to: "/profile/dashboard", label: "Dashboard" },
];

// Abas do desktop, logo abaixo do título. O -mb-4 anula o padding do header
// para o sublinhado da aba ativa encostar na borda de baixo.
function SettingsTabs() {
  return (
    <nav className="flex gap-6 -mb-4" aria-label="Seções das configurações">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end
          className={({ isActive }) =>
            cn(
              "pb-2.5 pt-1 text-sm border-b-2 transition-colors",
              isActive ? "border-accent text-foreground font-medium" : "border-transparent text-zinc-400 hover:text-foreground"
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Casca das abas de Configurações no desktop: título + abas Perfil/Dashboard. */
export function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <MainLayout
      title="Configurações"
      subtitle={<SettingsTabs />}
      titleWrapperClassName="flex flex-col gap-3 min-w-0"
      subtitleClassName="block"
    >
      {children}
    </MainLayout>
  );
}
