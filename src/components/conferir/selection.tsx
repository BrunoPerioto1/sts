import { useCallback, useEffect, useState, type ReactNode } from "react";
import { SelectCheck } from "@/components/ui/select-check";
import { cn } from "@/lib/utils";

// Barra do lote da Conferência e do "Liquidar na mão". O botão que liga o modo
// é o mesmo de Tips (ui/select-toggle-button).

/** Barra do lote: flutua acima da borda no celular, rodapé largo no desktop. */
export function SelectionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="toolbar"
      aria-label="Ações das selecionadas"
      className={cn(
        "fixed z-50 flex flex-col gap-2.5 rounded-2xl border border-foreground/10 bg-zinc-900/95 p-3 backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 duration-200",
        "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
        "md:inset-x-auto md:bottom-6 md:left-1/2 md:w-[calc(100%-3rem)] md:max-w-[960px] md:-translate-x-1/2 md:flex-row md:items-center md:gap-3 md:py-2.5 md:pl-5 md:pr-2.5",
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <span aria-live="polite" className="px-1 text-[13px] tabular-nums text-zinc-300 md:mr-auto md:px-0 md:text-[13.5px]">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Seleção sob demanda das duas abas: liga com "Selecionar", e o que sai da
 * lista (confirmado, recusado, refetch) sai da seleção junto.
 */
export function useSelecao(ids: readonly number[]) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const chave = ids.join(",");

  useEffect(() => {
    const vivos = new Set(ids);
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => vivos.has(id)));
      return next.size === prev.size ? prev : next;
    });
    if (!ids.length) setSelecting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `chave` resume `ids`
  }, [chave]);

  const sair = useCallback(() => {
    setSelecting(false);
    setSelected(new Set());
  }, []);
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const todas = ids.length > 0 && selected.size === ids.length;
  const toggleTodas = () => setSelected(todas ? new Set() : new Set(ids));

  return {
    selecting,
    ligar: () => setSelecting(true),
    sair,
    selected,
    ids: [...selected],
    toggle,
    todas,
    toggleTodas,
  };
}

/** "Selecionar todas" do celular, acima da lista (no desktop mora no cabeçalho da tabela). */
export function SelecionarTodas({ sel, total }: { sel: ReturnType<typeof useSelecao>; total: number }) {
  const n = sel.selected.size;
  return (
    <div className="flex items-center gap-3 px-1 text-[13.5px] tabular-nums">
      <button
        type="button"
        onClick={sel.toggleTodas}
        aria-label={sel.todas ? "Desmarcar todas" : "Selecionar todas"}
        className="press rounded-full"
      >
        <SelectCheck checked={sel.todas} indeterminate={!sel.todas && n > 0} />
      </button>
      {n} de {total} selecionadas
    </div>
  );
}
