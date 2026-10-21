import { Skeleton } from "@/components/ui/skeleton";
import { DASHBOARD_PANEL as card } from "./DashboardCard";

/**
 * Mesma geometria do dashboard desktop (KPIs, lucro acumulado na largura
 * toda, calendário + acerto), pra que o layout não salte quando os dados chegam.
 */
export function DashboardDesktopSkeleton() {
  return (
    <div className="space-y-3 animate-fade-in" aria-busy="true" aria-label="Carregando dashboard">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${card} px-5 pb-4 pt-3.5`}>
            <Skeleton className="h-3.5 w-20" delay={i * 40} />
            <Skeleton className="mt-3 h-7 w-32 rounded" delay={40 + i * 40} />
          </div>
        ))}
      </div>

      <div className={`${card} p-6`}>
        <Skeleton className="h-8 w-72 rounded-lg" delay={160} />
        <Skeleton className="mt-4 h-[250px] rounded-lg" delay={200} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)] 2xl:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)]">
        <div className={`${card} p-6`}>
          <Skeleton className="h-3 w-28" delay={240} />
          <div className="mt-5 grid grid-cols-7 gap-[5px] xl:grid-cols-[repeat(7,80px)]">
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="h-11 rounded-lg" delay={280 + (i % 7) * 20} />
            ))}
          </div>
        </div>
        <div className={`${card} p-6`}>
          <Skeleton className="h-3 w-24" delay={260} />
          <Skeleton className="mx-auto mt-6 h-[150px] w-[260px] max-w-full rounded-t-full" delay={300} />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-full" delay={340 + i * 40} />
            ))}
          </div>
        </div>
        <div className={`${card} p-6 space-y-5 xl:col-span-2 2xl:col-span-1`}>
          <Skeleton className="h-3 w-32" delay={280} />
          <Skeleton className="h-3 w-full rounded-full" delay={320} />
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-full" delay={360 + i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}
