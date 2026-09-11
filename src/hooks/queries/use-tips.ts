import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dismissTip,
  getTips,
  planilharTip,
  undismissTip,
  type PlanilharTipDto,
  type TipStatus,
} from "@/api/routes/get-tips";

const TIPS_KEY = ["tips"] as const;
// Sem paginacao na tela: a fila e' curta (o canal manda dezenas, nao milhares)
// e o backend ja pagina em memoria, entao "carregar mais" so adicionava um
// clique. 200 e' o teto que o TipFilterDto aceita.
const PER_PAGE = 200;

// staleTime curto contra o global de 5 min do App.tsx: tip e' o unico dado do
// app que chega de fora (fan-out do canal no Telegram) sem o usuario ter feito
// nada, entao uma lista de 5 minutos atras ja nao vale.
export function useTips(status?: TipStatus, q?: string, houseIds: number[] = []) {
  const query = useQuery({
    // Chave pelos VALORES do filtro (não pelo array), senão cada render pediria
    // uma query nova.
    queryKey: [...TIPS_KEY, status ?? "all", q ?? "", houseIds.join(",")],
    queryFn: () => getTips({ status, q, houseIds, page: 1, perPage: PER_PAGE }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  return {
    ...query,
    tips: query.data?.data ?? [],
    summary: query.data?.summary ?? null,
    total: query.data?.total ?? 0,
  };
}

export function useTipActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: TIPS_KEY });
  // Planilhar cria aposta: mexe na lista de apostas, no saldo da casa e nas
  // métricas do dashboard, exatamente como registrar uma aposta pela tela de
  // Apostas — sem isso a outra aba mostra número velho até o cache expirar.
  const invalidateAll = () =>
    Promise.all([
      invalidate(),
      qc.invalidateQueries({ queryKey: ["bets"] }),
      qc.invalidateQueries({ queryKey: ["houses"] }),
      qc.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);

  return {
    dismiss: useMutation({ mutationFn: dismissTip, onSuccess: invalidate }),
    undismiss: useMutation({ mutationFn: undismissTip, onSuccess: invalidate }),
    planilhar: useMutation({
      mutationFn: ({ id, ...overrides }: PlanilharTipDto & { id: number }) =>
        planilharTip(id, overrides),
      onSuccess: invalidateAll,
    }),
  };
}
