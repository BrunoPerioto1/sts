import { cn } from "@/lib/utils";

/**
 * Bloco de carregamento. A animação de shimmer mora na classe `.skeleton` do
 * index.css (que já respeita prefers-reduced-motion) — este componente só
 * existe pra parar de repetir `<div className="skeleton h-x w-y rounded" />`
 * e pra padronizar o `delay` em escada das listas.
 */
export function Skeleton({
  className,
  delay,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { delay?: number }) {
  return (
    <div
      className={cn("skeleton rounded", className)}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      {...props}
    />
  );
}

/**
 * Campos de formulário (label curta + input alto), na geometria usada pelas
 * telas de perfil.
 */
export function FormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" delay={i * 90} />
          <Skeleton className="h-12 w-full rounded-lg" delay={i * 90 + 40} />
        </div>
      ))}
    </div>
  );
}
