import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { runTipBatch, tipPlanilharDefaults } from "@/lib/tip-batch";
import {
  dismissTip,
  getTips,
  planilharTip,
  undismissTip,
  type PlanilharTipDto,
  type TipsListResponse,
  type TipStatus,
  type TipItem,
} from "@/api/routes/get-tips";

const TIPS_KEY = ["tips"] as const;
// Chave comum das gravações, pra lista saber quais tips estão em voo.
const TIP_WRITE_KEY = ["tips", "write"] as const;
// Sem paginacao na tela: a fila e' curta (o canal manda dezenas, nao milhares)
// e o backend ja pagina em memoria, entao "carregar mais" so adicionava um
// clique. 200 e' o teto que o TipFilterDto aceita.
const PER_PAGE = 200;

type TipAction = "planilhar" | "dismiss" | "undismiss";

// As variáveis de cada mutation carregam a tip de um jeito diferente; aqui vira
// sempre uma lista de ids.
function idsOfVariables(variables: unknown): number[] {
  if (typeof variables === "number") return [variables];
  if (!variables || typeof variables !== "object") return [];
  const v = variables as { id?: number; tips?: { id: number }[] };
  if (Array.isArray(v.tips)) return v.tips.map((tip) => tip.id);
  return typeof v.id === "number" ? [v.id] : [];
}

// staleTime curto contra o global de 5 min do App.tsx: tip e' o unico dado do
// app que chega de fora (fan-out do canal no Telegram) sem o usuario ter feito
// nada, entao uma lista de 5 minutos atras ja nao vale.
export function useTips(status?: TipStatus, q?: string, houseIds: number[] = []) {
  // Tips com gravação em voo ficam fora da lista mesmo que uma revalidação
  // (foco na janela, invalidate de outra ação) traga elas de volta como
  // pendentes: o servidor ainda não confirmou, mas a decisão já foi tomada e
  // ver a linha reaparecer por um instante é pior que esperar.
  const inFlight = useMutationState({
    filters: { mutationKey: TIP_WRITE_KEY, status: "pending" },
    select: (mutation) => idsOfVariables(mutation.state.variables),
  });

  const query = useQuery({
    // Chave pelos VALORES do filtro (não pelo array), senão cada render pediria
    // uma query nova.
    queryKey: [...TIPS_KEY, status ?? "all", q ?? "", houseIds.join(",")],
    queryFn: () => getTips({ status, q, houseIds, page: 1, perPage: PER_PAGE }),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const escondidas = new Set(inFlight.flat());

  return {
    ...query,
    tips: (query.data?.data ?? []).filter((tip) => !escondidas.has(tip.id)),
    summary: query.data?.summary ?? null,
    total: query.data?.total ?? 0,
  };
}

const down = (value: number, by: number) => Math.max(0, value - by);

// Tira as tips das listas em cache e corrige o resumo no instante do clique. A
// gravação leva centenas de ms (planilhar ainda cria aposta e mexe em saldo) e
// a fila é pra ser varrida no ritmo do dedo — esperar o servidor pra sumir com
// a linha fazia cada tip parecer travada.
//
// Devolve o desfazer, chamado quando a gravação falha.
function applyTipActionOptimistic(qc: QueryClient, ids: number[], action: TipAction) {
  const idSet = new Set(ids);
  const entries = qc.getQueriesData<TipsListResponse>({ queryKey: TIPS_KEY });
  const snapshot = entries.map(([key, data]) => [key, data] as const);

  // O stake sai do objeto em cache, não do que a tela mandou: o resumo precisa
  // do valor de cada tip e o id sozinho não conta essa parte.
  const moved = new Map<number, TipItem>();
  for (const [, data] of entries) {
    for (const tip of data?.data ?? []) {
      if (idSet.has(tip.id) && !moved.has(tip.id)) moved.set(tip.id, tip);
    }
  }
  if (moved.size === 0) return () => {};

  const count = moved.size;
  const stake = [...moved.values()].reduce((sum, tip) => sum + (tip.recommendedStake ?? 0), 0);

  for (const [key, data] of entries) {
    if (!data) continue;
    const rest = data.data.filter((tip) => !idSet.has(tip.id));
    const summary = { ...data.summary };
    if (action === "undismiss") {
      summary.caidas = down(summary.caidas, count);
      summary.pending += count;
      summary.pendingStake += stake;
    } else {
      summary.pending = down(summary.pending, count);
      summary.pendingStake = down(summary.pendingStake, stake);
      if (action === "planilhar") summary.planilhadas += count;
      else summary.caidas += count;
    }
    qc.setQueryData<TipsListResponse>(key, {
      ...data,
      data: rest,
      total: down(data.total, data.data.length - rest.length),
      summary,
    });
  }

  return () => {
    for (const [key, data] of snapshot) if (data) qc.setQueryData(key, data);
  };
}

export function useTipActions() {
  const qc = useQueryClient();

  // Sem await: a revalidação corre por baixo e a tela já está no estado final
  // desde o clique. Esperar aqui só prenderia o `isPending` da mutation.
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: TIPS_KEY });
  };
  // Planilhar cria aposta: mexe na lista de apostas, no saldo da casa e nas
  // métricas do dashboard, exatamente como registrar uma aposta pela tela de
  // Apostas — sem isso a outra aba mostra número velho até o cache expirar.
  const invalidateAll = () => {
    invalidate();
    void qc.invalidateQueries({ queryKey: ["bets"] });
    void qc.invalidateQueries({ queryKey: ["houses"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  // cancelQueries antes de mexer no cache: um refetch em voo chegaria depois e
  // repintaria a tip que acabou de sair da lista.
  const optimistic = async (ids: number[], action: TipAction) => {
    await qc.cancelQueries({ queryKey: TIPS_KEY });
    return { rollback: applyTipActionOptimistic(qc, ids, action) };
  };

  return {
    dismiss: useMutation({
      mutationKey: TIP_WRITE_KEY,
      mutationFn: dismissTip,
      onMutate: (id: number) => optimistic([id], "dismiss"),
      onError: (_error, _id, context) => context?.rollback(),
      onSettled: invalidate,
    }),
    undismiss: useMutation({
      mutationKey: TIP_WRITE_KEY,
      mutationFn: undismissTip,
      onMutate: (id: number) => optimistic([id], "undismiss"),
      onError: (_error, _id, context) => context?.rollback(),
      onSettled: invalidate,
    }),
    planilhar: useMutation({
      mutationKey: TIP_WRITE_KEY,
      mutationFn: ({ id, ...overrides }: PlanilharTipDto & { id: number }) =>
        planilharTip(id, overrides),
      onMutate: ({ id }) => optimistic([id], "planilhar"),
      onError: (_error, _vars, context) => context?.rollback(),
      onSettled: invalidateAll,
    }),
    batch: useMutation({
      mutationKey: TIP_WRITE_KEY,
      mutationFn: ({ tips, action }: { tips: TipItem[]; action: TipAction }) =>
        runTipBatch(tips, async (tip) => {
          if (action === "undismiss") {
            if (tip.status !== "caiu") throw new Error("Esta tip não está marcada como caiu.");
            return undismissTip(tip.id);
          }
          if (tip.status !== "pending") throw new Error("Esta tip não está pendente.");
          return action === "planilhar"
            ? planilharTip(tip.id, tipPlanilharDefaults(tip))
            : dismissTip(tip.id);
        }, action === "planilhar" ? 1 : 6),
      onMutate: ({ tips, action }) => optimistic(tips.map((tip) => tip.id), action),
      // O lote inteiro sai da lista no clique; as que falharem voltam sozinhas
      // na revalidação do onSettled, com o toast explicando o que sobrou.
      onError: (_error, _vars, context) => context?.rollback(),
      onSettled: invalidateAll,
    }),
  };
}
