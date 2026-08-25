import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  actions?: React.ReactNode;
}

export function MainLayout({ children, title, actions }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {!isMobile && <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />}

      <main
        className="flex-1 w-full transition-[margin] duration-200"
        style={{ marginLeft: !isMobile ? (sidebarCollapsed ? "72px" : "248px") : "0" }}
      >
        <header className="border-b border-border sticky top-0 z-40 bg-background">
          <div className="flex items-center justify-between gap-4" style={{ padding: "16px 24px" }}>
            <h1 className="text-[19px] font-medium">{title}</h1>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </header>

        <div className="p-4 md:p-6 pb-24 md:pb-6">{children}</div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
}
