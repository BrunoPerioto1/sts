import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_PANEL as card } from "./DashboardCard";

/**
 * Mesma geometria do dashboard desktop (KPIs, gráfico + acerto, calendário +
 * por casa), pra que o layout não salte quando os dados chegam.
 */
export function DashboardDesktopSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} px-[22px] py-5`}>
            <Skeleton className="h-3.5 w-20" delay={i * 40} />
            <Skeleton className="mt-3.5 h-7 w-32 rounded" delay={40 + i * 40} />
          </div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className={`${card} p-6`}>
          <Skeleton className="h-8 w-72 rounded-lg" delay={160} />
          <Skeleton className="mt-4 h-[312px] rounded-lg" delay={200} />
        </div>
        <div className={`${card} p-6`}>
          <Skeleton className="h-3 w-24" delay={180} />
          <Skeleton className="mx-auto mt-6 h-[150px] w-[240px] rounded-t-full" delay={220} />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-full" delay={260 + i * 40} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className={`${card} p-6`}>
          <Skeleton className="h-3 w-40" delay={320} />
          <div className="mt-5 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" delay={360 + (i % 7) * 20} />
            ))}
          </div>
        </div>
        <div className={`${card} p-6 space-y-7`}>
          <Skeleton className="h-3 w-20" delay={340} />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-full" delay={380 + i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}
