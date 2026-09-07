import { Skeleton } from "@/components/ui/skeleton";

export function ApostasMobileSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando apostas">
      <Skeleton className="h-12 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-lg" delay={i * 90} />
        ))}
      </div>
    </div>
  );
}
