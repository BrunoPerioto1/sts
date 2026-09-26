import { useEffect, useRef, useState } from "react";
import { actionToast } from "@/lib/action-toast";
import { useTipActions } from "@/hooks/queries/use-tips";
import type { PlanilharTipDto, TipItem } from "@/api/routes/get-tips";

/** Valor que só muda depois de `ms` sem alteração (busca: uma tecla não vira uma página). */
export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Seleção em lote da fila de tips, com shift+clique pra marcar intervalo. A
 * seleção pertence à lista atual: trocar filtro/aba (`resetKey`) limpa, e
 * tip que sumiu da lista (planilhada, descartada) sai da seleção.
 */
export function useTipSelection(tips: TipItem[], resetKey: string) {
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const anchor = useRef<number | null>(null);

  useEffect(() => {
    anchor.current = null;
    setCheckedIds(new Set());
  }, [resetKey]);

  useEffect(() => {
    if (!tips.some((tip) => tip.id === anchor.current)) anchor.current = null;
    setCheckedIds((current) => {
      const next = new Set(tips.filter((tip) => current.has(tip.id)).map((tip) => tip.id));
      return next.size === current.size ? current : next;
    });
  }, [tips]);

  const clear = () => {
    anchor.current = null;
    setCheckedIds(new Set());
  };

  const toggle = (id: number, shiftKey = false) => {
    const anchorIndex = tips.findIndex((tip) => tip.id === anchor.current);
    const targetIndex = tips.findIndex((tip) => tip.id === id);
    if (targetIndex < 0) return;
    const range =
      shiftKey && anchorIndex >= 0
        ? tips.slice(Math.min(anchorIndex, targetIndex), Math.max(anchorIndex, targetIndex) + 1)
        : [tips[targetIndex]];
    if (!shiftKey || anchorIndex < 0) anchor.current = id;
    setCheckedIds((current) => {
      const next = new Set(current);
      const remove = current.has(id);
      for (const tip of range) {
        if (remove) next.delete(tip.id);
        else next.add(tip.id);
      }
      return next;
    });
  };

  const checkedTips = tips.filter((tip) => checkedIds.has(tip.id));
  return {
    checkedIds,
    setCheckedIds,
    checkedTips,
    allChecked: tips.length > 0 && checkedTips.length === tips.length,
    toggle,
    clear,
    /** Ponto de partida do próximo shift+clique (a linha aberta, ou nenhum). */
    setAnchor: (id: number | null) => {
      anchor.current = id;
    },
  };
}

/**
 * Ações da fila com o toast de cada uma. Nada de `busy` global travando a tela:
 * as ações são otimistas (a tip sai da lista no clique, ver use-tips), então a
 * gravação corre por baixo e a fila continua clicável.
 */
export function useTipPageActions({ onStart }: { onStart: () => void }) {
  const { dismiss, undismiss, planilhar, batch } = useTipActions();

  // O lote roda em background e o toast chega quando terminar; quem clicou já
  // pode continuar varrendo a fila.
  const runBatch = (action: "planilhar" | "dismiss" | "undismiss", items: TipItem[], afterStart: () => void) => {
    if (!items.length) return;
    afterStart();
    batch.mutate(
      { tips: items, action },
      {
        onSuccess: (result) => {
          if (result.succeeded.length) {
            const label = action === "planilhar" ? "planilhadas" : action === "dismiss" ? "marcadas como caiu" : "devolvidas para a fila";
            actionToast.success({ title: `${result.succeeded.length} tips ${label}` });
          }
          // As que falharem voltam pra lista sozinhas na revalidação.
          if (result.failed.length) {
            actionToast.error({
              title: `${result.failed.length} tips não concluídas`,
              description: `Continuam na fila. ${result.failed[0].message}`,
            });
          }
        },
        onError: (error: Error) =>
          actionToast.error({ description: error.message || "Não foi possível concluir o lote." }),
      },
    );
  };

  // O sheet fecha antes da resposta, não no onSuccess: a tip já saiu da lista
  // e deixar o modal aberto em "Planilhando…" era a espera mais visível da tela.
  const run = (mutation: typeof dismiss, id: number, title: string) => {
    onStart();
    mutation.mutate(id, {
      onSuccess: () => actionToast.success({ title }),
      onError: (e: Error) => actionToast.error({ description: e.message }),
    });
  };

  const doPlanilhar = (id: number, overrides: PlanilharTipDto) => {
    onStart();
    planilhar.mutate(
      { id, ...overrides },
      {
        onSuccess: (res: { alreadyExisted: boolean }) =>
          actionToast.success({
            title: res.alreadyExisted ? "Essa tip já estava planilhada" : "Aposta planilhada",
          }),
        onError: (e: Error) => actionToast.error({ description: e.message }),
      },
    );
  };

  return { dismiss, undismiss, planilhar, batch, runBatch, run, doPlanilhar };
}
