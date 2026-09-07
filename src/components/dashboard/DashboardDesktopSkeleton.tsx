import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mesma geometria do dashboard desktop (gráfico + grade de KPIs). O spinner
 * centralizado que ficava aqui não dizia nada sobre o que estava vindo e o
 * layout saltava inteiro quando os dados chegavam.
 */
export function DashboardDesktopSkeleton() {
  return (
    <div className="space-y-7 animate-fade-in" aria-busy="true" aria-label="Carregando dashboard">
      <div className="card elev-sm bg-card rounded-md p-[18px] space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" delay={60} />
        </div>
        <Skeleton className="h-[220px] rounded-lg" delay={120} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card elev-sm bg-card rounded-md p-[18px] space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" delay={i * 70} />
              <Skeleton className="h-3 w-28" delay={i * 70} />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" delay={i * 70 + 40} />
            <Skeleton className="h-3 w-24" delay={i * 70 + 80} />
          </div>
        ))}
      </div>
    </div>
  );
}
