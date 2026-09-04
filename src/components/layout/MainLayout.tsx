import { useLayoutEffect } from "react";
import { useShell } from "./AppShell";
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

/**
 * Header + respiro do corpo de uma tela. A casca (sidebar/bottom nav) NAO mora
 * mais aqui: subiu pro <AppShell />, que fica acima do <Outlet /> e por isso
 * sobrevive as navegacoes.
 *
 * Nenhuma decisao de layout passa por JS aqui — as duas versoes do header sao
 * renderizadas e o `sm:` escolhe qual aparece.
 */
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
  const { setBottomNavHidden } = useShell();

  // useLayoutEffect, nao useEffect: roda antes da pintura, entao a nav nunca
  // chega a aparecer num quadro nas telas que a escondem (perfil/conta) nem a
  // sumir com atraso ao entrar no modo de selecao.
  useLayoutEffect(() => {
    setBottomNavHidden(hideBottomNav);
    return () => setBottomNavHidden(false);
  }, [hideBottomNav, setBottomNavHidden]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 bg-background",
          !hideHeaderBorder && "border-b border-border",
          mobileFullBleed && "hidden sm:block"
        )}
      >
        {mobileHeader && (
          <div className="sm:hidden" style={{ padding: "12px 16px" }}>
            {mobileHeader}
          </div>
        )}
        <div
          className={cn("items-center justify-between gap-4", mobileHeader ? "hidden sm:flex" : "flex")}
          style={{ padding: "16px 24px" }}
        >
          <div className={titleWrapperClassName}>
            <h1 className={titleClassName}>{title}</h1>
            {subtitle && <span className={subtitleClassName}>{subtitle}</span>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </header>

      <div
        className={cn(
          "min-w-0",
          mobileFullBleed ? "pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6" : "p-4 md:p-6 pb-24 md:pb-6"
        )}
      >
        {children}
      </div>
    </>
  );
}
