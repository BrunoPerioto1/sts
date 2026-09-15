import { NavLink, useLocation } from "react-router-dom";
import { SquaresFour, Receipt, Buildings, UserCircle, ClipboardText, PaperPlaneTilt } from "@phosphor-icons/react";
import { useSettlementQueue } from "@/hooks/apostas/use-settlement";
import { tapHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const items = [
  { label: "Início", icon: SquaresFour, path: "/dashboard" },
  { label: "Apostas", icon: Receipt, path: "/bets" },
  { label: "Tips", icon: PaperPlaneTilt, path: "/tips" },
  { label: "Conferência", icon: ClipboardText, path: "/settlement" },
  { label: "Casas", icon: Buildings, path: "/houses" },
  { label: "Perfil", icon: UserCircle, path: "/profile" },
];

export function BottomNav() {
  const location = useLocation();
  const { data: fila } = useSettlementQueue();
  const activeIndex = items.findIndex((item) => location.pathname.startsWith(item.path));

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden overflow-hidden border-t border-border bg-sidebar"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* Barra de 2px que escorrega entre as abas em vez de sumir e reaparecer
          — e o unico elemento da nav que mostra a transicao de uma pra outra,
          ja que a troca de tela em si e instantanea. */}
      {activeIndex >= 0 && (
        <span
          aria-hidden
          className="absolute top-0 h-[2px] rounded-full bg-accent"
          style={{
            width: `${100 / items.length}%`,
            transform: `translateX(${activeIndex * 100}%)`,
            transition: "transform var(--dur-base) var(--ease-out-soft)",
          }}
        />
      )}

      {items.map((item, index) => {
        const Icon = item.icon;
        const isActive = index === activeIndex;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => !isActive && tapHaptic()}
            className="press flex-1 flex flex-col items-center justify-center gap-1 py-2 min-h-[44px]"
            style={{
              color: isActive ? "var(--color-accent)" : "color-mix(in srgb, var(--color-text) 50%, transparent)",
              transition: "color var(--dur-base) var(--ease-out-soft), transform var(--dur-fast) var(--ease-out-soft)",
            }}
          >
            <span className="relative">
              {/* key no indice ativo remonta o icone quando a aba muda, o que
                  redispara o pop — sem isso a animacao so rodaria na montagem. */}
              <Icon
                key={isActive ? "on" : "off"}
                size={19}
                weight={isActive ? "fill" : "regular"}
                className={cn(isActive && "animate-pop-in")}
              />
              {/* Contagem de proposta esperando confirmacao. So' na aba da
                  conferencia: e' a unica que pede acao do usuario. */}
              {item.path === "/settlement" && !!fila?.suggestions && (
                <span className="absolute -right-2.5 -top-1.5 min-w-[16px] rounded-full bg-accent px-1 text-center text-[10px] font-semibold leading-4 text-white tabular-nums">
                  {fila.suggestions > 99 ? "99+" : fila.suggestions}
                </span>
              )}
            </span>
            <span className={cn("text-xs transition-opacity", isActive ? "opacity-100" : "opacity-90")}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
