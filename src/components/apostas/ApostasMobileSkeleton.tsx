export function ApostasMobileSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Carregando apostas">
      <div className="skeleton h-12 rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="skeleton h-[104px] rounded-lg" style={{ animationDelay: `${i * 90}ms` }} />
        ))}
      </div>
    </div>
  );
}
