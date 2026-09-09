import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dismissTip, getTips, undismissTip, type TipStatus } from "@/api/routes/get-tips";

const TIPS_KEY = ["tips"] as const;
const PER_PAGE = 20;

// staleTime curto contra o global de 5 min do App.tsx: tip é o único dado do
// app que chega de fora (fan-out do canal no Telegram) sem o usuário ter feito
// nada, então uma lista de 5 minutos atrás já não vale.
export function useTips(status?: TipStatus) {
  const query = useInfiniteQuery({
    queryKey: [...TIPS_KEY, status ?? "all"],
    queryFn: ({ pageParam }) => getTips({ status, page: pageParam, perPage: PER_PAGE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.perPage < last.total ? last.page + 1 : undefined),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const pages = query.data?.pages ?? [];

  return {
    ...query,
    tips: pages.flatMap((p) => p.data),
    // Os contadores das abas são iguais em toda página; a primeira já basta.
    summary: pages[0]?.summary ?? null,
    total: pages[0]?.total ?? 0,
  };
}

export function useTipActions() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: TIPS_KEY });

  return {
    dismiss: useMutation({ mutationFn: dismissTip, onSuccess: invalidate }),
    undismiss: useMutation({ mutationFn: undismissTip, onSuccess: invalidate }),
  };
}
