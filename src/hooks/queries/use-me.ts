import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, type MeResponse } from "@/api/routes/get-me";

export const ME_KEY = ["me"] as const;

// O usuario logado e pedido pela sidebar e por TODAS as telas de Perfil. Antes
// cada uma chamava getMe() na montagem — trocar de aba refazia o GET. Com uma
// chave unica o react-query serve as outras do cache (staleTime global de 5
// min, ver App.tsx).
export function useMe() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({ queryKey: ME_KEY, queryFn: getMe });

  return {
    me: data ?? null,
    // patchMe / desvincular telegram devolvem o usuario ja atualizado: escreve
    // direto no cache em vez de gastar outro GET. O plano só vem no GET: sem
    // ele na resposta, fica o que já estava.
    setMe: (me: MeResponse) =>
      qc.setQueryData<MeResponse>(ME_KEY, (prev) => ({ ...me, plan: me.plan ?? prev?.plan })),
    reloadMe: () => void refetch(),
  };
}
