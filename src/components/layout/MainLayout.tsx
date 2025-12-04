import { useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Em mobile, sempre colapsar sidebar
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar Desktop */}
        {!isMobile && (
          <AppSidebar 
            collapsed={sidebarCollapsed} 
            setCollapsed={setSidebarCollapsed} 
          />
        )}
        
        {/* Sidebar Mobile (Drawer) */}
        {isMobile && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              <AppSidebar 
                collapsed={false} 
                setCollapsed={() => {}} 
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}
        
        {/* Conteúdo Principal */}
        <main 
          className="flex-1 bg-background transition-all duration-300 w-full"
          style={{
            marginLeft: !isMobile ? (sidebarCollapsed ? '92px' : '240px') : '0',
          }}
        >
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-16 items-center gap-4 px-4 md:px-6">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="mr-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <h1 className="text-lg md:text-xl font-semibold text-foreground">{title}</h1>
            </div>
          </header>
          
          <div className="p-3 md:p-6 bg-slate-50/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}