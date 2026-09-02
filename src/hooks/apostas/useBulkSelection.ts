import { useCallback, useState } from "react";

export function useBulkSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastId, setLastId] = useState<number | null>(null);

  const enter = useCallback((id?: number) => {
    setSelectionMode(true);
    if (id !== undefined) {
      setSelected(new Set([id]));
      setLastId(id);
    }
  }, []);

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastId(id);
  }, []);

  // Marca/desmarca um grupo inteiro de uma vez (cabeçalho de dia/semana/mês) —
  // se já estiverem todas marcadas, desmarca; senão marca as que faltam.
  const toggleMany = useCallback((ids: number[]) => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      for (const id of ids) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, []);

  // Shift+clique: seleciona o intervalo entre a última marcada e a atual,
  // usando a ordem visual da lista (orderedIds) pra achar os índices.
  const selectRange = useCallback(
    (orderedIds: number[], toId: number) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (lastId === null) {
          next.add(toId);
          return next;
        }
        const from = orderedIds.indexOf(lastId);
        const to = orderedIds.indexOf(toId);
        if (from === -1 || to === -1) {
          next.add(toId);
          return next;
        }
        const [start, end] = from < to ? [from, to] : [to, from];
        for (let i = start; i <= end; i++) next.add(orderedIds[i]);
        return next;
      });
      setLastId(toId);
    },
    [lastId]
  );

  const clear = useCallback(() => {
    setSelectionMode(false);
    setSelected(new Set());
    setLastId(null);
  }, []);

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  return { selectionMode, selected, enter, toggle, toggleMany, selectRange, clear, isSelected };
}
