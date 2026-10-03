import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createBet,
  deleteBet,
  deleteMultipleBets,
  finalizeBet,
  finalizeMultipleBets,
  type BetItem,
  ResultIdEnum,
} from "@/api/routes/get-bets";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";
import { previewProfit, statusLabelByResultId } from "@/lib/bet-status";
import { betsInCall, planBetUndo } from "@/lib/bet-undo";
import { actionToast, ArrowCounterClockwise, Check, CheckCircle, Copy, Trash as TrashIcon } from "@/lib/action-toast";

// Verde/vermelho no toast de finalização em lote são reservados pro resultado
// da aposta (spec Nocturne) — Pendente fica neutro.
const statusWordClassFor: Record<number, string> = {
  [ResultIdEnum.WON]: "text-positive",
  [ResultIdEnum.LOST]: "text-negative",
};

function errText(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

/**
 * Mutações da tela de apostas: chamada de API, toast, invalidação de cache e
 * (no lote de status) optimistic update com desfazer. A tela fica só com a UI.
 *
 * Os `onSuccess` existem porque quem limpa a seleção é a tela — são dois modos
 * de seleção diferentes (checkbox da Tabela e seleção múltipla do Agrupado) e o
 * ponto exato em que cada um limpa faz parte do comportamento atual.
 */
export function useBetActions() {
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

  // A lista guarda as linhas por mês aberto (useMonthBets): o optimistic
  // update escreve em todos esses caches, e o status anterior sai deles.
  const MONTH_ROWS = ["bets", "month"];
  const patchCachedBets = (fn: (b: BetItem) => BetItem) => {
    queryClient.setQueriesData<BetItem[]>({ queryKey: MONTH_ROWS }, (old) => old?.map(fn));
  };
  // Liquidação otimista: status e lucro estimado na hora, pro valor já correr
  // até o resultado em vez de mostrar R$ 0,00 até o refetch. O refetch traz o
  // lucro do backend, que é o autoritativo.
  const settle = (a: BetItem, resultId: ResultIdEnum, cashoutValue?: number): BetItem => {
    const stake = Number(a.stake ?? 0);
    const profit =
      resultId === ResultIdEnum.PENDING
        ? null
        : resultId === ResultIdEnum.CASHOUT
          ? cashoutValue != null ? cashoutValue - stake : a.profit
          : previewProfit(resultId, stake, Number(a.odd ?? 0));
    return {
      ...a,
      resultId,
      resultName: statusLabelByResultId[resultId] ?? a.resultName,
      profit,
      ...(resultId === ResultIdEnum.CASHOUT && cashoutValue != null ? { cashoutValue } : {}),
    };
  };
  const cachedBets = () => {
    const byId = new Map<number, BetItem>();
    for (const [, rows] of queryClient.getQueriesData<BetItem[]>({ queryKey: MONTH_ROWS }))
      for (const bet of rows ?? []) byId.set(bet.id, bet);
    return [...byId.values()];
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

  const finalizeOne = async (id: number, resultId: ResultIdEnum, cashoutValue?: number) => {
    patchCachedBets((a) => (a.id === id ? settle(a, resultId, cashoutValue) : a));
    try {
      await finalizeBet(id, { resultId, cashoutValue });
      actionToast.success({ icon: Check, title: "Aposta liquidada" });
    } catch (e) {
      actionToast.error({ description: errText(e, "Falha ao liquidar aposta") });
    }
    // Com erro também: o refetch desfaz o otimista.
    await reload();
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
  // desfazer por ~5s. Undo restaura o status original de cada aposta: um lote
  // por status, e cada Cashout sozinho com o valor recebido (ver planBetUndo).
  const bulkFinalize = async (ids: number[], resultId: ResultIdEnum, onSuccess?: () => void) => {
    if (ids.length === 0) return;
    const previous = cachedBets()
      .filter((a) => ids.includes(a.id))
      .map((a) => ({
        id: a.id,
        resultId: a.resultId,
        resultName: a.resultName,
        profit: a.profit,
        cashoutValue: a.cashoutValue,
      }));

    patchCachedBets((a) => (ids.includes(a.id) ? settle(a, resultId) : a));
    setBulkLoading(true);
    try {
      await finalizeMultipleBets({ betIds: ids, resultId });
      onSuccess?.();

      // allSettled: uma chamada recusada não pode esconder as outras nem
      // passar como "desfeita" — antes o erro sumia e a tela não dizia nada.
      const undo = async () => {
        const calls = planBetUndo(previous);
        const results = await Promise.allSettled(
          calls.map((call) =>
            call.kind === "batch"
              ? finalizeMultipleBets({ betIds: call.betIds, resultId: call.resultId })
              : finalizeBet(call.id, { resultId: call.resultId, cashoutValue: call.cashoutValue }),
          ),
        );
        await reload();
        const failed = results.reduce((n, r, i) => (r.status === "rejected" ? n + betsInCall(calls[i]) : n), 0);
        if (failed === 0) {
          actionToast.success({ icon: ArrowCounterClockwise, title: "Alteração desfeita" });
        } else {
          const firstError = results.find((r): r is PromiseRejectedResult => r.status === "rejected")?.reason;
          actionToast.error({
            description: `${failed === previous.length ? "Não deu pra desfazer" : `${failed} de ${previous.length} apostas não voltaram`}: ${errText(firstError, "erro ao desfazer")}`,
          });
        }
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
        return orig ? { ...a, resultId: orig.resultId, resultName: orig.resultName, profit: orig.profit } : a;
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

  return { mutating, bulkLoading, reload, deleteOne, finalizeOne, duplicate, bulkFinalize, bulkDelete };
}
