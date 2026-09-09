import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Geometria do perfil: lucro acumulado + grade 2x2 de métricas + lista de
 * atalhos. Era o mesmo bloco escrito duas vezes na PerfilPage (sem `me` e sem
 * métricas), com diferenças de espaçamento entre as duas cópias.
 */
export function PerfilSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy="true" aria-label="Carregando perfil">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-9 w-44 rounded-lg" delay={60} />
        <Skeleton className="h-4 w-52" delay={120} />
      </div>

      <div className="grid grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className={cn("py-4 space-y-2", i % 2 === 1 && "border-l border-border pl-4", i >= 2 && "border-t border-border")}
          >
            <Skeleton className="h-3 w-20" delay={i * 70} />
            <Skeleton className="h-5 w-16" delay={i * 70 + 40} />
          </div>
        ))}
      </div>

      <div>
        <Skeleton className="h-3 w-16 mb-2" />
        <div className="border-y border-border divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-none" delay={i * 90} />
          ))}
        </div>
      </div>
    </div>
  );
}
