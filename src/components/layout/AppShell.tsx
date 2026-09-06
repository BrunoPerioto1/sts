import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { BottomNav } from "./BottomNav";

interface ShellContextValue {
  setBottomNavHidden: (hidden: boolean) => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell precisa estar dentro de <AppShell />");
  return ctx;
}

/**
 * Casca da aplicacao: sidebar (>=640px) e bottom nav (<640px).
 *
 * Fica numa pathless layout route, ACIMA do <Outlet />, por dois motivos:
 *
 * 1. Nao remonta entre navegacoes. Antes cada pagina renderizava seu proprio
 *    <MainLayout>, entao a casca inteira era destruida e recriada a cada troca
 *    de rota — que era o que repetia o flash de layout a cada navegacao.
 * 2. Com a nav persistente, a barra indicadora da BottomNav de fato desliza de
 *    uma aba pra outra; remontando, ela so reaparecia ja na posicao nova.
 *
 * As duas cascas sao SEMPRE renderizadas e quem escolhe e o CSS (`sm:`), nao o
 * JS. Assim a decisao acontece na pintura e nao existe frame intermediario.
 */
export function AppShell() {
  const { pathname } = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);

  const setBottomNavHiddenStable = useCallback((hidden: boolean) => {
    setBottomNavHidden(hidden);
  }, []);

  const contextValue = useMemo<ShellContextValue>(
    () => ({ setBottomNavHidden: setBottomNavHiddenStable }),
    [setBottomNavHiddenStable]
  );

  return (
    <ShellContext.Provider value={contextValue}>
      {/* A largura da sidebar vira variavel CSS pro <main> deslocar sozinho no
          breakpoint — antes o deslocamento vinha de um marginLeft calculado em
          JS a partir do isMobile, e era ele que animava de 248px ate 0 quando o
          hook se corrigia, refluindo o texto no meio do caminho. */}
      <div
        className="min-h-dvh flex w-full bg-background overflow-x-hidden"
        style={{ "--sidebar-w": sidebarCollapsed ? "72px" : "248px" } as CSSProperties}
      >
        <div className="hidden sm:block">
          <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>

        <main className="flex-1 w-full min-w-0 ml-0 sm:ml-[var(--sidebar-w)] transition-[margin] duration-200">
          {/* `key` no pathname existe so pra reiniciar a animacao: sem ela a
              div permanece a mesma entre rotas e o CSS nunca redispara.
              So entrada, sem saida — animar a saida obrigaria a esperar a tela
              velha sumir antes de montar a nova, o que ai sim seria atraso. */}
          <div key={pathname} className="animate-route-in">
            <Outlet />
          </div>
        </main>

        {!bottomNavHidden && <BottomNav />}
      </div>
    </ShellContext.Provider>
  );
}
