import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  hideHeaderBorder?: boolean;
  hideBottomNav?: boolean;
  titleWrapperClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  // Header mobile totalmente à parte (voltar/título/ícone), pra telas que não
  // cabem no padrão título+ações genérico em telas estreitas.
  mobileHeader?: React.ReactNode;
  // Mobile sem header e sem padding no corpo — a tela desenha de ponta a ponta
  // (Dashboard, onde o próprio conteúdo já é o "card" da tela toda).
  mobileFullBleed?: boolean;
}

export function MainLayout({
  children,
  title,
  subtitle,
  actions,
  hideHeaderBorder = false,
  hideBottomNav = false,
  titleWrapperClassName = "flex items-baseline gap-3 min-w-0",
  titleClassName = "text-lg font-medium shrink-0",
  subtitleClassName = "text-sm opacity-50 truncate",
  mobileHeader,
  mobileFullBleed = false,
}: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  return (
    <div className="min-h-dvh flex w-full bg-background overflow-x-hidden">
      {!isMobile && <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}

      <main
        className="flex-1 w-full min-w-0 transition-[margin] duration-200"
        style={{ marginLeft: !isMobile ? (sidebarCollapsed ? "72px" : "248px") : "0" }}
      >
        <header
          className={cn(
            "sticky top-0 z-40 bg-background",
            !hideHeaderBorder && "border-b border-border",
            isMobile && mobileFullBleed && "hidden"
          )}
        >
          {isMobile && mobileHeader ? (
            <div style={{ padding: "12px 16px" }}>{mobileHeader}</div>
          ) : (
            <div className="flex items-center justify-between gap-4" style={{ padding: "16px 24px" }}>
              <div className={titleWrapperClassName}>
                <h1 className={titleClassName}>{title}</h1>
                {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
              </div>
              {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>
          )}
        </header>

        <div className={cn("min-w-0", isMobile && mobileFullBleed ? "pb-24" : "p-4 md:p-6 pb-24 md:pb-6")}>{children}</div>
      </main>

      {isMobile && !hideBottomNav && <BottomNav />}
    </div>
  );
}
