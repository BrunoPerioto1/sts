import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_PANEL as card } from "../DashboardCard";

/**
 * Esqueleto com a MESMA geometria do DashboardMobileView (título, KPIs 2×2,
 * gráfico, acerto). Trocar o spinner por isso tira o salto de layout quando os
 * dados chegam: os blocos já estão no lugar e só ganham conteúdo.
 */
export function DashboardMobileSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-96px)] px-4 pt-5 pb-6 flex flex-col gap-2.5" aria-busy="true" aria-label="Carregando dashboard">
      <div className="mb-3 flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-11 w-11 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} p-3.5`}>
            <Skeleton className="h-3 w-16" delay={i * 60} />
            <Skeleton className="mt-3 h-6 w-24" delay={i * 60 + 40} />
          </div>
        ))}
      </div>

      <div className={`${card} p-4`}>
        <Skeleton className="h-9 w-full rounded-lg" delay={120} />
        <Skeleton className="mt-4 h-[232px] rounded-lg" delay={160} />
      </div>

      <div className={`${card} p-4`}>
        <Skeleton className="h-3 w-24" delay={200} />
        <Skeleton className="mx-auto mt-5 h-[130px] w-[220px] rounded-t-full" delay={240} />
      </div>
    </div>
  );
}
