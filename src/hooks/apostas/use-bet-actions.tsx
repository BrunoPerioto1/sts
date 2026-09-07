import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  createBet,
  deleteBet,
  deleteMultipleBets,
  finalizeBet,
  finalizeMultipleBets,
  type BetItem,
  type PaginatedBetsResponseDto,
  ResultIdEnum,
} from "@/api/routes/get-bets";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { statusLabelByResultId } from "@/lib/bet-status";
import { actionToast, ArrowCounterClockwise, Check, CheckCircle, Copy, Trash as TrashIcon } from "@/lib/action-toast";

// Verde/vermelho no toast de finalização em lote são reservados pro resultado
// da aposta (spec Nocturne) — Pendente fica neutro.
const statusWordClassFor: Record<number, string> = {
  [ResultIdEnum.WON]: "text-[#4ADE80]",
  [ResultIdEnum.LOST]: "text-[#F87171]",
};

function errText(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

interface UseBetActionsArgs {
  // Chave da lista exibida — o optimistic update em lote escreve nela.
  queryKey: readonly unknown[];
  apostas: BetItem[];
}

/**
 * Mutações da tela de apostas: chamada de API, toast, invalidação de cache e
 * (no lote de status) optimistic update com desfazer. A tela fica só com a UI.
 *
 * Os `onSuccess` existem porque quem limpa a seleção é a tela — são dois modos
 * de seleção diferentes (checkbox da Tabela e seleção múltipla do Agrupado) e o
 * ponto exato em que cada um limpa faz parte do comportamento atual.
 */
export function useBetActions({ queryKey, apostas }: UseBetActionsArgs) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateBetData();
  // `mutating` cobre a janela do próprio request de excluir/liquidar, antes do
  // refetch começar — é o que mantém os botões desabilitados o tempo todo.
  const [mutating, setMutating] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Toda mutação passa por aqui: invalida bets/houses/dashboard (as outras
  // telas leem do cache agora). A lista desta tela está montada, então o
  // próprio invalidate já a refaz.
  const reload = () => invalidate();

  // Optimistic update da lista sem sair do cache do react-query.
  const patchCachedBets = (fn: (b: BetItem) => BetItem) => {
    queryClient.setQueryData<InfiniteData<PaginatedBetsResponseDto>>(queryKey, (old) =>
      old ? { ...old, pages: old.pages.map((p) => ({ ...p, data: (p.data ?? []).map(fn) })) } : old
    );
  };

  const deleteOne = async (id: number, onSuccess?: () => void) => {
    setMutating(true);
    try {
      await deleteBet(id);
      onSuccess?.();
      await reload();
      actionToast.success({ icon: TrashIcon, title: "Sucesso", description: "Aposta excluída!" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao excluir aposta") });
    } finally {
      setMutating(false);
    }
  };

  const deleteMany = async (ids: number[], onSuccess?: () => void) => {
    if (ids.length === 0) return;
    setMutating(true);
    try {
      await deleteMultipleBets(ids);
      onSuccess?.();
      await reload();
      actionToast.success({ icon: TrashIcon, title: "Sucesso", description: "Apostas excluídas!" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao excluir apostas") });
    } finally {
      setMutating(false);
    }
  };

  const changeStatusMany = async (ids: number[], resultId: number, onSuccess?: () => void) => {
    if (ids.length === 0) return;
    setMutating(true);
    try {
      await finalizeMultipleBets({ betIds: ids, resultId });
      await reload();
      onSuccess?.();
      actionToast.success({ icon: Check, title: "Status atualizado", description: "Apostas alteradas!" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao atualizar status") });
    } finally {
      setMutating(false);
    }
  };

  const finalizeOne = async (id: number, resultId: ResultIdEnum, cashoutValue?: number) => {
    try {
      await finalizeBet(id, { resultId, cashoutValue });
      await reload();
      actionToast.success({ icon: Check, title: "Aposta liquidada" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao liquidar aposta") });
    }
  };

  const duplicate = async (aposta: BetItem) => {
    try {
      await createBet({
        game: aposta.game,
        stake: Number(aposta.stake),
        odd: Number(aposta.odd),
        houseId: aposta.houseId,
        market: aposta.market,
        sport: aposta.sport,
        betTime: new Date().toISOString(),
      });
      await reload();
      actionToast.success({ icon: Copy, title: "Aposta duplicada" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao duplicar aposta") });
    }
  };

  // Ação em lote da seleção múltipla (Agrupado): optimistic update na lista +
  // desfazer por ~5s. Undo restaura o status original de cada aposta — usa o
  // endpoint em lote de novo quando os originais eram todos iguais (comum:
  // marcar um grupo de pendentes), senão cai pra 1 chamada por aposta (só no
  // desfazer, já que aí os valores realmente diferem por item).
  const bulkFinalize = async (ids: number[], resultId: ResultIdEnum, onSuccess?: () => void) => {
    if (ids.length === 0) return;
    const previous = apostas
      .filter((a) => ids.includes(a.id))
      .map((a) => ({ id: a.id, resultId: a.resultId, resultName: a.resultName }));

    patchCachedBets((a) => (ids.includes(a.id) ? { ...a, resultId, resultName: statusLabelByResultId[resultId] ?? a.resultName } : a));
    setBulkLoading(true);
    try {
      await finalizeMultipleBets({ betIds: ids, resultId });
      onSuccess?.();

      const undo = async () => {
        const uniqueOriginal = new Set(previous.map((p) => p.resultId));
        if (uniqueOriginal.size === 1) {
          await finalizeMultipleBets({ betIds: previous.map((p) => p.id), resultId: previous[0].resultId });
        } else {
          await Promise.all(previous.map((p) => finalizeBet(p.id, { resultId: p.resultId })));
        }
        await reload();
        actionToast.success({ icon: ArrowCounterClockwise, title: "Alteração desfeita" });
      };

      actionToast.success({
        icon: CheckCircle,
        title: (
          <>
            {ids.length} apostas marcadas como{" "}
            <span className={statusWordClassFor[resultId] ?? undefined}>{statusLabelByResultId[resultId] ?? "atualizada"}</span>
          </>
        ),
        action: { label: "Desfazer", onClick: undo },
      });
      await reload();
    } catch (e) {
      patchCachedBets((a) => {
        const orig = previous.find((p) => p.id === a.id);
        return orig ? { ...a, resultId: orig.resultId, resultName: orig.resultName } : a;
      });
      actionToast.error({ description: errText(e, "Falha ao atualizar status") });
    } finally {
      setBulkLoading(false);
    }
  };

  // Exclusão em lote da seleção múltipla (Agrupado) — sem "desfazer" real: ao
  // contrário do status, não há endpoint pra recriar apostas excluídas, então
  // oferecer um botão de desfazer aqui seria enganoso.
  const bulkDelete = async (ids: number[], onSuccess?: () => void) => {
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await deleteMultipleBets(ids);
      onSuccess?.();
      await reload();
      actionToast.success({ icon: TrashIcon, title: `${ids.length} apostas excluídas` });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao excluir apostas") });
    } finally {
      setBulkLoading(false);
    }
  };

  return { mutating, bulkLoading, reload, deleteOne, deleteMany, changeStatusMany, finalizeOne, duplicate, bulkFinalize, bulkDelete };
}
