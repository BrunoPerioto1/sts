import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Superfície dos cards do dashboard: um degrau só acima do fundo e borda
 * sutil, sem sombra — o tom do Claude Design, menos cinza que o card padrão.
 */
export const DASHBOARD_PANEL = "rounded-2xl border border-foreground/[0.08] bg-[rgb(var(--rgb-panel))]";

/**
 * Bloco do dashboard: um card por assunto (gráfico, acerto, calendário), com o
 * título apagado em cima e um encaixe à direita pra legenda ou navegação.
 */
export function DashboardCard({
  title,
  right,
  children,
  className,
  style,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col p-4 md:p-6", DASHBOARD_PANEL, className)} style={style}>
      {(title || right) && (
        <div className="mb-4 flex min-h-8 items-center justify-between gap-3">
          {typeof title === "string" ? <h3 className="text-sm text-zinc-400">{title}</h3> : title}
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
