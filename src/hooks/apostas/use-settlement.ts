import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  computeSettlement,
  confirmSettlement,
  dismissSettlement,
  getSettlementSuggestions,
  type SettlementSuggestion,
} from "@/api/routes/get-settlement";
import { useInvalidateBetData } from "@/hooks/queries/use-invalidate";

const SETTLEMENT_KEY = ["settlement", "suggestions"] as const;

export function useSettlementSuggestions() {
  return useQuery<SettlementSuggestion[]>({
    queryKey: SETTLEMENT_KEY,
    queryFn: getSettlementSuggestions,
  });
}

export function useSettlementActions() {
  const queryClient = useQueryClient();
  const invalidateBetData = useInvalidateBetData();

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: SETTLEMENT_KEY });

  const compute = useMutation({
    mutationFn: computeSettlement,
    onSuccess: (summary) => {
      void refresh();
      if (summary.suggested) {
        const n = summary.suggested;
        toast.success(
          `${n} aposta${n === 1 ? "" : "s"} pronta${n === 1 ? "" : "s"} pra conferir`,
        );
        return;
      }
      // Analisar e nao saber decidir e' diferente de nao achar nada: dizer
      // "nenhum resultado" nessas horas esconde aposta que o jogo ja' terminou
      // e que continua esperando o usuario resolver na mao.
      if (summary.undecided) {
        const n = summary.undecided;
        toast.info(
          `${n} aposta${n === 1 ? "" : "s"} com placar que o bot não soube resolver`,
        );
        return;
      }
      toast.success("Nenhum resultado novo encontrado");
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao buscar resultados"),
  });

  const confirm = useMutation({
    mutationFn: confirmSettlement,
    // Planilhar altera lucro e saldo: invalida os dados de aposta junto, senão
    // o dashboard fica mostrando o total antigo.
    onSuccess: ({ confirmed }) => {
      void refresh();
      void invalidateBetData();
      toast.success(`${confirmed} aposta${confirmed === 1 ? "" : "s"} planilhada${confirmed === 1 ? "" : "s"}`);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao planilhar"),
  });

  const dismiss = useMutation({
    mutationFn: dismissSettlement,
    onSuccess: ({ dismissed }) => {
      void refresh();
      toast.success(`${dismissed} sugestão${dismissed === 1 ? "" : "ões"} descartada${dismissed === 1 ? "" : "s"}`);
    },
    onError: (e: Error) => toast.error(e.message || "Falha ao descartar"),
  });

  return { compute, confirm, dismiss };
}
