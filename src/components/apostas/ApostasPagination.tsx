import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface ApostasPaginationProps {
  page: number;
  totalPages: number;
  perPage: number;
  loadedCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

// Rodapé de paginação do desktop: "1–30 de N" + janela de páginas em volta da
// atual (primeira e última sempre visíveis, com "…" nos buracos).
export function ApostasPagination({ page, totalPages, perPage, loadedCount, total, onPageChange }: ApostasPaginationProps) {
  const pageWindow = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2
  );

  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm opacity-45">
        {loadedCount > 0 ? `${(page - 1) * perPage + 1}–${(page - 1) * perPage + loadedCount}` : "0"} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => page > 1 && onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
        >
          <CaretLeft size={14} />
        </button>
        {pageWindow.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && pageWindow[i - 1] !== p - 1 && <span className="px-1 opacity-35 text-xs">…</span>}
            <button
              onClick={() => onPageChange(p)}
              className="w-8 h-8 rounded-md text-sm"
              style={
                p === page
                  ? { boxShadow: "inset 0 0 0 1px var(--color-accent)", color: "var(--color-accent)" }
                  : { opacity: 0.62 }
              }
            >
              {p}
            </button>
          </span>
        ))}
        <button
          onClick={() => page < totalPages && onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-foreground/[0.07] disabled:opacity-35"
        >
          <CaretRight size={14} />
        </button>
      </div>
    </div>
  );
}
