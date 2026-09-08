import { Skeleton } from "@/components/ui/skeleton";

/**
 * Mesma geometria do dashboard desktop (faixa de resultado, régua de KPIs e a
 * dupla banca/por casa), pra que o layout não salte quando os dados chegam.
 */
export function DashboardDesktopSkeleton() {
  return (
    <div
      className="rounded-xl border border-white/[0.06] bg-white/[0.012] overflow-hidden animate-fade-in"
      aria-busy="true"
      aria-label="Carregando dashboard"
    >
      <div className="grid lg:grid-cols-[minmax(280px,340px)_1fr]">
        <div className="p-6 border-b border-white/[0.05] lg:border-b-0 lg:border-r">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-12 w-52 rounded-lg mt-2" delay={60} />
          <Skeleton className="h-3 w-44 mt-4" delay={120} />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-full" delay={160 + i * 50} />
            ))}
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-3 w-32" delay={140} />
          <Skeleton className="h-[300px] rounded-lg mt-4" delay={200} />
        </div>
      </div>

      <div className="flex border-t border-white/[0.05]">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex-1 px-5 py-4 border-l border-white/[0.05] first:border-l-0">
            <Skeleton className="h-3 w-16" delay={260 + i * 40} />
            <Skeleton className="h-6 w-20 rounded mt-2" delay={280 + i * 40} />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_minmax(280px,360px)] border-t border-white/[0.05]">
        <div className="p-6 border-b border-white/[0.05] lg:border-b-0 lg:border-r">
          <Skeleton className="h-3 w-36" delay={420} />
          <Skeleton className="h-[240px] rounded-lg mt-4" delay={460} />
        </div>
        <div className="p-6 space-y-4">
          <Skeleton className="h-3 w-20" delay={480} />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-full" delay={520 + i * 40} />
          ))}
        </div>
      </div>
    </div>
  );
}
