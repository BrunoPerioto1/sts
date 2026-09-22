import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminOverview,
  getAdminUsers,
  patchAdminUser,
  type AdminUser,
  type UpdateAdminUserParams,
} from "@/api/routes/get-admin";

const ADMIN_KEY = ["admin"] as const;
const USERS_KEY = [...ADMIN_KEY, "users"] as const;

// O painel existe justamente pra flagrar coletor parado: servir número de 5
// minutos atrás (staleTime global do App.tsx) seria a própria tela mentindo.
export function useAdminOverview() {
  return useQuery({
    queryKey: [...ADMIN_KEY, "overview"],
    queryFn: getAdminOverview,
    staleTime: 0,
  });
}

export function useAdminUsers() {
  return useQuery({ queryKey: USERS_KEY, queryFn: getAdminUsers });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: UpdateAdminUserParams & { id: number }) =>
      patchAdminUser(id, params),
    // A rota devolve a linha já atualizada (com contagem de apostas): escreve
    // no cache em vez de refazer o GET da lista inteira por causa de um select.
    onSuccess: (updated) => {
      qc.setQueryData<AdminUser[]>(USERS_KEY, (old) =>
        old?.map((u) => (u.id === updated.id ? updated : u)),
      );
    },
  });
}
