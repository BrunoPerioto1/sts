import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, ListChecks, Question } from "@phosphor-icons/react";
import { actionToast, Trash } from "@/lib/action-toast";
import {
  computeSettlement,
  confirmSettlement,
  dismissSettlement,
  getSettlementQueue,
  getSettlementReview,
  type SettlementReviewItem,
  getSettlementSuggestions,
  type SettlementQueue,
  type SettlementSuggestion,
} from "@/api/routes/get-settlement";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";

const SETTLEMENT_KEY = ["settlement", "suggestions"] as const;
const QUEUE_KEY = ["settlement", "queue"] as const;
const REVIEW_KEY = ["settlement", "review"] as const;

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
    queryFn: getSettlementSuggestions,
  });
}

/**
 * Contadores da fila. Toda acao (compute/confirm/dismiss) mexe neles, entao
 * invalidam junto com a lista — senao o badge do menu continuaria anunciando
 * proposta que o usuario acabou de planilhar.
 */
export function useSettlementQueue() {
  return useQuery<SettlementQueue>({
    queryKey: QUEUE_KEY,
    queryFn: getSettlementQueue,
  });
}

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
        description: "Nenhum jogo com aposta pendente terminou desde a última busca. Os placares chegam todo dia às 6h.",
        duration: 3500,
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra buscar resultados", description: e.message || "Tente de novo em instantes." }),
  });

  const confirm = useMutation({
    mutationFn: confirmSettlement,
    // Planilhar altera lucro e saldo: invalida os dados de aposta junto, senão
    // o dashboard fica mostrando o total antigo.
    onSuccess: ({ confirmed }) => {
      void refresh();
      void invalidateBetData();
      actionToast.success({
        title: plural(confirmed, "aposta planilhada", "apostas planilhadas"),
        description: "Lucro e saldo já foram atualizados.",
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra planilhar", description: e.message || "Tente de novo em instantes." }),
  });

  const dismiss = useMutation({
    mutationFn: dismissSettlement,
    onSuccess: ({ dismissed }) => {
      void refresh();
      actionToast.success({
        icon: Trash,
        title: plural(dismissed, "proposta descartada", "propostas descartadas"),
        description: "As apostas seguem pendentes pra liquidar na mão.",
      });
    },
    onError: (e: Error) =>
      actionToast.error({ title: "Não deu pra descartar", description: e.message || "Tente de novo em instantes." }),
  });

  return { compute, confirm, dismiss };
}
