import { cn } from "@/lib/utils";

// Barras de filtro do desktop no desenho do Claude Design (Casas e Apostas
// Header v2): controles soltos de 36px, cada um na própria caixa, no tom dos
// cards (--rgb-panel) e sem sombra.

/** Caixa comum: busca, recortes e gatilhos de filtro. */
export const TOOLBAR_BOX = "h-9 rounded-[9px] border border-foreground/[0.08] bg-[rgb(var(--rgb-panel))]";

/** Gatilho de filtro ("Casas Todas ▾"). */
export const TOOLBAR_BUTTON = cn(TOOLBAR_BOX, "px-3 text-[13px] font-medium transition-colors hover:border-foreground/20");

/** Filtro com valor fora do padrão: a caixa ganha o tom do accent. */
export const TOOLBAR_BUTTON_ACTIVE = "border-accent/40 bg-accent/10 hover:border-accent/70";

/** Botões do cabeçalho (CSV, Saque em lote, Nova aposta), com Button size="sm". */
export const HEADER_BUTTON = "rounded-[9px] sm:px-3.5 text-[13px] [&_svg]:size-[15px]";

/** Variante secundária do cabeçalho (CSV): contorno no tom da barra. */
export const HEADER_BUTTON_SECONDARY = cn(
  HEADER_BUTTON,
  "border-foreground/[0.08] bg-[rgb(var(--rgb-panel))] text-zinc-300 hover:border-foreground/20",
);
