/**
 * Esqueleto com a MESMA geometria do DashboardMobileView (titulo + chip de
 * periodo, valor grande, grafico, grade 2x3). Trocar o spinner por isso tira o
 * salto de layout quando os dados chegam: os blocos ja estao no lugar e so
 * ganham conteudo.
 */
export function DashboardMobileSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-96px)] px-4 pt-4 flex flex-col" aria-busy="true" aria-label="Carregando dashboard">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-2">
          <div className="skeleton h-5 w-28 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>

      <div className="mt-6 shrink-0 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-9 w-44 rounded" style={{ animationDelay: "80ms" }} />
        <div className="skeleton h-4 w-52 rounded" style={{ animationDelay: "160ms" }} />
      </div>

      <div className="mt-6 flex-1">
        <div className="skeleton h-[220px] rounded-lg" style={{ animationDelay: "120ms" }} />
      </div>

      <div className="grid grid-cols-2 mt-6 shrink-0">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className={[
              "py-5 space-y-2",
              i % 2 === 1 ? "border-l border-border pl-4" : "",
              i >= 2 ? "border-t border-border" : "",
            ].join(" ")}
          >
            <div className="skeleton h-3 w-20 rounded" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="skeleton h-5 w-16 rounded" style={{ animationDelay: `${i * 60 + 40}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
