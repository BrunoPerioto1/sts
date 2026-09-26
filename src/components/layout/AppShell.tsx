import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppSidebar, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH } from "./AppSidebar";
import { BottomNav } from "./BottomNav";
import { AccessExpiryBanner } from "./AccessExpiryBanner";

const COLLAPSED_KEY = "sidebar_collapsed";

// Preferência de conveniência: sem storage (aba anônima, bloqueio) a sidebar
// só abre expandida, como antes.
function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(collapsed: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
  } catch {
    // sem storage o estado vale só nesta aba
  }
}

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
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(readCollapsed);
  const [bottomNavHidden, setBottomNavHidden] = useState(false);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    writeCollapsed(collapsed);
  }, []);

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
        // clip contém o excesso horizontal sem criar um scroll container que
        // prende os headers e painéis sticky enquanto quem rola é a página.
        className="min-h-dvh flex w-full bg-background overflow-x-clip"
        style={{ "--sidebar-w": `${sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px` } as CSSProperties}
      >
        <div className="hidden sm:block">
          <AppSidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        </div>

        <main className="flex-1 w-full min-w-0 ml-0 sm:ml-[var(--sidebar-w)] transition-[margin] duration-200">
          {/* `key` no pathname existe so pra reiniciar a animacao: sem ela a
              div permanece a mesma entre rotas e o CSS nunca redispara.
              So entrada, sem saida — animar a saida obrigaria a esperar a tela
              velha sumir antes de montar a nova, o que ai sim seria atraso. */}
          <AccessExpiryBanner />
          <div key={pathname} className="animate-route-in">
            <Outlet />
          </div>
        </main>

        {!bottomNavHidden && <BottomNav />}
      </div>
    </ShellContext.Provider>
  );
}
