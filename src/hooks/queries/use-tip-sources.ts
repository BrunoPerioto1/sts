import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTipSource,
  getMyTipSources,
  getTipSources,
  patchTipSource,
  postTipSource,
  previewTipSource,
  putMyTipSource,
  type MyTipSource,
  type TipSource,
  type TipSourceParams,
  type TipSourcePreviewParams,
} from "@/api/routes/tip-sources";

const SOURCES_KEY = ["admin", "sources"] as const;
// Fora de ["tips"] de propósito: o otimista da lista de tips percorre tudo
// sob essa chave esperando o formato da lista.
const MY_SOURCES_KEY = ["tip-sources"] as const;

export function useTipSources() {
  return useQuery({ queryKey: SOURCES_KEY, queryFn: getTipSources });
}

export function useSaveTipSource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: TipSourceParams & { id?: number }) =>
      id === undefined ? postTipSource(params) : patchTipSource(id, params),
    // A resposta é a linha crua (sem as contagens da semana): refaz a lista.
    onSuccess: () => qc.invalidateQueries({ queryKey: SOURCES_KEY }),
  });
}

/** Pausa/reativa na própria lista. Otimista, como as flags do scanner. */
export function useToggleTipSource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => patchTipSource(id, { isActive }),
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: SOURCES_KEY });
      const before = qc.getQueryData<TipSource[]>(SOURCES_KEY);
      qc.setQueryData<TipSource[]>(SOURCES_KEY, (old) => old?.map((s) => (s.id === id ? { ...s, isActive } : s)));
      return { before };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(SOURCES_KEY, ctx?.before),
  });
}

export function useDeleteTipSource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTipSource(id),
    onSuccess: (_void, id) => qc.setQueryData<TipSource[]>(SOURCES_KEY, (old) => old?.filter((s) => s.id !== id)),
  });
}

/**
 * Leitura do exemplo com o modelo em edição. É um POST, mas só lê: vai como
 * query pra reaproveitar cache e não piscar entre uma tecla e outra.
 */
export function useTipSourcePreview(params: TipSourcePreviewParams | null) {
  return useQuery({
    queryKey: [...SOURCES_KEY, "preview", params],
    queryFn: () => previewTipSource(params!),
    enabled: params !== null,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    retry: false,
  });
}

export function useMyTipSources() {
  return useQuery({ queryKey: MY_SOURCES_KEY, queryFn: getMyTipSources });
}

/** Liga/desliga uma fonte no perfil. Otimista; a lista de tips muda junto. */
export function useSetMyTipSource() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, enabled }: { id: number; enabled: boolean }) => putMyTipSource(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await qc.cancelQueries({ queryKey: MY_SOURCES_KEY });
      const before = qc.getQueryData<MyTipSource[]>(MY_SOURCES_KEY);
      qc.setQueryData<MyTipSource[]>(MY_SOURCES_KEY, (old) => old?.map((s) => (s.id === id ? { ...s, enabled } : s)));
      return { before };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(MY_SOURCES_KEY, ctx?.before),
    // Desligar some com as pendentes da fonte; religar traz de volta.
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tips"] });
      void qc.invalidateQueries({ queryKey: ["tip-counts"] });
    },
  });
}
