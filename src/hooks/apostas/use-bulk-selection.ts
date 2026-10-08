import { useCallback, useEffect, useState } from "react";

export function useBulkSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [lastId, setLastId] = useState<number | null>(null);


  // `id` obrigatório: o modo de seleção sempre começa com a aposta que o
  // usuário tocou. Entrar vazio agora seria desfeito na hora pelo efeito abaixo.
  const enter = useCallback((id: number) => {
    setSelectionMode(true);
    setSelected(new Set([id]));
    setLastId(id);
  }, []);

  // Desmarcar a última aposta na mão sai do modo de seleção. Antes só o botão
  // "Cancelar" saía: com 0 selecionadas a barra de ações some, então a tela
  // ficava com os checkboxes abertos e nenhuma saída visível.
  //
  // Vale pra todo caminho que desmarca (item, dia, semana, mês), por isso mora
  // aqui e não em cada `toggle`.
  useEffect(() => {
    if (selectionMode && selected.size === 0) {
      setSelectionMode(false);
      setLastId(null);
    }
  }, [selectionMode, selected]);

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

  // Shift+clique: aplica o intervalo entre a última clicada e a atual, usando
  // a ordem visual da lista (orderedIds). Igual à tela de Tips: se a atual já
  // estava marcada, o intervalo é desmarcado; senão, marcado. Também serve
  // pra começar a seleção, sem precisar entrar no modo antes.
  const selectRange = useCallback(
    (orderedIds: number[], toId: number) => {
      setSelectionMode(true);
      setSelected((prev) => {
        const next = new Set(prev);
        const remove = prev.has(toId);
        const from = lastId === null ? -1 : orderedIds.indexOf(lastId);
        const to = orderedIds.indexOf(toId);
        const range =
          from === -1 || to === -1 ? [toId] : orderedIds.slice(Math.min(from, to), Math.max(from, to) + 1);
        for (const id of range) {
          if (remove) next.delete(id);
          else next.add(id);
        }
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

  // "Limpar" da barra: desmarca tudo, e ficar sem nada marcado já sai do modo
  // (efeito acima).
  const clearSelected = useCallback(() => {
    setSelected(new Set());
    setLastId(null);
  }, []);

  const isSelected = useCallback((id: number) => selected.has(id), [selected]);

  return { selectionMode, selected, enter, toggle, toggleMany, selectRange, clear, clearSelected, isSelected };
}

export type BulkSelection = ReturnType<typeof useBulkSelection>;
