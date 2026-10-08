import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, ListChecks, Question } from "@phosphor-icons/react";
import { actionToast, Trash } from "@/lib/action-toast";
import {
  computeSettlement,
  confirmSettlement,
  dismissSettlement,
  getSettlementQueue,
  getSettlementReview,
  revertManualSettlement,
  revertSettlement,
  settleManually,
  type SettlementReviewItem,
  getSettlementSuggestions,
  type SettlementQueue,
  type SettlementSuggestion,
} from "@/api/routes/get-settlement";
import type { ResultIdEnum } from "@/api/routes/result-id";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";

const SETTLEMENT_KEY = ["settlement", "suggestions"] as const;
const QUEUE_KEY = ["settlement", "queue"] as const;
const REVIEW_KEY = ["settlement", "review"] as const;

// Quanto o "Desfazer" fica no toast. O Recusar só vai pra API depois disso.
const UNDO_MS = 5000;

// Recusas esperando a janela do "Desfazer" passar. A API não tem como
// des-recusar (dismissed_at não volta), então a proposta só some da tela e a
// chamada sai quando o toast expira. Fica fora do hook de propósito: trocar de
// tela não pode cancelar o envio, nem fazer a proposta reaparecer num refetch.
const recusasPendentes = new Set<number>();

export function useSettlementReview(enabled: boolean) {
  return useQuery<SettlementReviewItem[]>({
    queryKey: REVIEW_KEY,
    queryFn: getSettlementReview,
    enabled,
  });
}

export function useSettlementSuggestions() {
  return useQuery<SettlementSuggestion[]>({
    queryKey: SETTLEMENT_KEY,
    queryFn: async () =>
      (await getSettlementSuggestions()).filter((s) => !recusasPendentes.has(s.betId)),
  });
}

/**
 * Contadores da fila. Toda acao (compute/confirm/dismiss) mexe neles, entao
 * invalidam junto com a lista — senao o badge do menu continuaria anunciando
 * proposta que o usuario acabou de planilhar.
 *
 * A API calcula sozinha quando tem placar esperando (sem clique). Se calculou
 * algo, a lista que ja' estava em cache ficou velha: recarrega.
 */
export function useSettlementQueue() {
  const queryClient = useQueryClient();
  return useQuery<SettlementQueue>({
    queryKey: QUEUE_KEY,
    queryFn: async () => {
      const fila = await getSettlementQueue();
      if (fila.computed) {
        void queryClient.invalidateQueries({ queryKey: SETTLEMENT_KEY });
        void queryClient.invalidateQueries({ queryKey: REVIEW_KEY });
      }
      return fila;
    },
    // Aposta vira "atrasada" com o relógio e o placar chega pelo job 3x ao
    // dia: o badge do menu não pode esperar F5. Sem placar novo o endpoint só
    // conta; com a aba escondida o react-query não dispara.
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

const RESULT_LABEL: Record<number, string> = { 1: "ganhou", 2: "perdeu", 3: "anulada" };

export function useSettlementActions() {
  const queryClient = useQueryClient();
  const invalidateBetData = useInvalidateBetData();

  // A fila invalida junto com a lista: sem isso o badge do menu continuaria
  // anunciando proposta que o usuário acabou de planilhar ou descartar.
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: SETTLEMENT_KEY });
    void queryClient.invalidateQueries({ queryKey: QUEUE_KEY });
    void queryClient.invalidateQueries({ queryKey: REVIEW_KEY });
  };
  const refreshAll = () => {
    refresh();
    void invalidateBetData();
  };

  const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

  const compute = useMutation({
    mutationFn: computeSettlement,
    onSuccess: (summary) => {
      void refresh();
      if (summary.suggested) {
        actionToast.success({
          icon: ListChecks,
          title: `${plural(summary.suggested, "aposta pronta", "apostas prontas")} pra conferir`,
          description: summary.undecided
            ? `${plural(summary.undecided, "outra ficou", "outras ficaram")} sem proposta.`
            : "Revise e confirme o que estiver certo.",
          duration: 3500,
        });
        return;
      }
      // Analisar e nao saber decidir e' diferente de nao achar nada: dizer
      // "nenhum resultado" nessas horas esconde aposta que o jogo ja' terminou
      // e que continua esperando o usuario resolver na mao.
      if (summary.undecided) {
        actionToast.success({
          icon: Question,
          title: `${plural(summary.undecided, "aposta", "apostas")} sem proposta`,
          description: "O jogo acabou, mas o bot não entendeu o mercado. Liquide na tela de apostas.",
          duration: 4500,
        });
        return;
      }
      actionToast.success({
        icon: CalendarCheck,
        title: "Tudo conferido",
        description: "Nenhum jogo com aposta pendente terminou desde a última busca. Os placares chegam às 6h, 16h e 22h.",
        duration: 3500,
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra buscar resultados", description: e.message || "Tente de novo em instantes." }),
  });

  const revert = useMutation({
    mutationFn: revertSettlement,
    onSuccess: () => actionToast.success({ title: "Desfeito", description: "As apostas voltaram para pendentes." }),
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra desfazer", description: e.message || "Volte a aposta para pendente em Apostas." }),
    onSettled: refreshAll,
  });

  const confirm = useMutation({
    mutationFn: confirmSettlement,
    // Planilhar altera lucro e saldo: invalida os dados de aposta junto, senão
    // o dashboard fica mostrando o total antigo.
    onSuccess: ({ confirmed }, betIds) => {
      refreshAll();
      actionToast.success({
        title: plural(confirmed, "aposta planilhada", "apostas planilhadas"),
        description: "Lucro e saldo já foram atualizados.",
        action: { label: "Desfazer", onClick: () => revert.mutate(betIds) },
        duration: UNDO_MS,
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra planilhar", description: e.message || "Tente de novo em instantes." }),
  });

  // Recusar com envio adiado: some da lista na hora, vai pra API quando a
  // janela do "Desfazer" fecha.
  const dismiss = (betIds: number[], title?: string) => {
    if (!betIds.length) return;
    betIds.forEach((id) => recusasPendentes.add(id));
    queryClient.setQueryData<SettlementSuggestion[]>(SETTLEMENT_KEY, (lista) =>
      lista?.filter((s) => !betIds.includes(s.betId)),
    );

    const timer = window.setTimeout(async () => {
      try {
        await dismissSettlement(betIds);
      } catch (e) {
        actionToast.error({
          title: "Não deu pra recusar",
          description: (e as Error).message || "A proposta voltou para a lista.",
        });
      } finally {
        betIds.forEach((id) => recusasPendentes.delete(id));
        refresh();
      }
    }, UNDO_MS);

    actionToast.success({
      icon: Trash,
      title: title ?? plural(betIds.length, "proposta recusada", "propostas recusadas"),
      description: "As apostas seguem pendentes pra liquidar na mão.",
      action: {
        label: "Desfazer",
        onClick: () => {
          window.clearTimeout(timer);
          betIds.forEach((id) => recusasPendentes.delete(id));
          refresh();
        },
      },
      duration: UNDO_MS,
    });
  };

  const revertManual = useMutation({
    mutationFn: revertManualSettlement,
    onSuccess: () => actionToast.success({ title: "Desfeito", description: "As apostas voltaram para pendentes." }),
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra desfazer", description: e.message || "Volte a aposta para pendente em Apostas." }),
    onSettled: refreshAll,
  });

  // "Liquidar na mão" em lote: grava o resultado escolhido nas que o bot não
  // resolveu. Mexe em lucro e saldo como o Confirmar, e desfaz do mesmo jeito.
  const settleManual = useMutation({
    mutationFn: ({ betIds, resultId }: { betIds: number[]; resultId: ResultIdEnum }) =>
      settleManually(betIds, resultId),
    onSuccess: (_res, { betIds, resultId }) => {
      refreshAll();
      actionToast.success({
        title: `${plural(betIds.length, "liquidada", "liquidadas")} como ${RESULT_LABEL[resultId] ?? "resolvida"}`,
        action: { label: "Desfazer", onClick: () => revertManual.mutate(betIds) },
        duration: UNDO_MS,
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra liquidar", description: e.message || "Tente de novo em instantes." }),
  });

  return { compute, confirm, dismiss, settleManual };
}
