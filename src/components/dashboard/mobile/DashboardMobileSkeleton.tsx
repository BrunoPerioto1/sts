/**
 * Esqueleto com a MESMA geometria do DashboardMobileView (titulo + chip de
 * periodo, valor grande, grafico, grade 2x4). Trocar o spinner por isso tira o
 * salto de layout quando os dados chegam: os blocos ja estao no lugar e so
 * ganham conteudo.
 */
export function DashboardMobileSkeleton() {
  return (
    <div className="min-h-[calc(100dvh-96px)] px-4 pt-5 pb-6 flex flex-col" aria-busy="true" aria-label="Carregando dashboard">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="space-y-2">
          <div className="skeleton h-8 w-40 rounded" />
          <div className="skeleton h-4 w-40 rounded" />
        </div>
        <div className="skeleton h-11 w-24 rounded-lg" />
      </div>

      <div className="mt-8 shrink-0 space-y-2">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-12 w-52 rounded" style={{ animationDelay: "80ms" }} />
        <div className="skeleton h-4 w-52 rounded" style={{ animationDelay: "160ms" }} />
      </div>

      <div className="mt-5">
        <div className="skeleton h-[180px] rounded-lg" style={{ animationDelay: "120ms" }} />
      </div>

      <div className="grid grid-cols-2 auto-rows-fr gap-2.5 mt-6">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={[
              "min-h-[76px] rounded-xl border border-white/[0.07] p-3 flex items-center gap-2",
            ].join(" ")}
          >
            <div className="skeleton h-9 w-9 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-3 w-full rounded" style={{ animationDelay: `${i * 60}ms` }} />
            <div className="skeleton h-7 w-16 rounded" style={{ animationDelay: `${i * 60 + 40}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
