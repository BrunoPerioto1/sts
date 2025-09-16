import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />
        
        {/* Ajustar o layout principal com margem à esquerda para acomodar a sidebar fixa */}
        <main 
          className="flex-1 bg-background transition-all duration-300"
          style={{
            marginLeft: sidebarCollapsed ? '92px' : '240px', // Mesmos valores da largura da sidebar
          }}
        >
          <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
            <div className="flex h-16 items-center gap-4 px-6">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>
          </header>
          
          <div className="p-6 bg-slate-50/30">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}