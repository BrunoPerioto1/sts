import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de linhas do desktop, compartilhado pela Tabela e pelo Agrupado.
export function ApostasListSkeleton() {
  return (
    <div className="card bg-card rounded-md p-4 space-y-3">
      {[38, 88, 72, 80, 56].map((w, i) => (
        <Skeleton key={i} className="h-[10px]" style={{ width: `${w}%` }} delay={i * 90} />
      ))}
    </div>
  );
}
