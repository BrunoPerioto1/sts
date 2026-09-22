import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminHouses,
  getAdminOverview,
  getAdminUsers,
  patchAdminHouse,
  patchAdminUser,
  postAdminHouse,
  type AdminHouse,
  type AdminUser,
  type CreateAdminHouseParams,
  type UpdateAdminHouseParams,
  type UpdateAdminUserParams,
} from "@/api/routes/get-admin";

const ADMIN_KEY = ["admin"] as const;
const USERS_KEY = [...ADMIN_KEY, "users"] as const;
const HOUSES_KEY = [...ADMIN_KEY, "houses"] as const;

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

export function useAdminHouses() {
  return useQuery({ queryKey: HOUSES_KEY, queryFn: getAdminHouses });
}

export function useCreateAdminHouse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateAdminHouseParams) => postAdminHouse(params),
    onSuccess: (created) => {
      qc.setQueryData<AdminHouse[]>(HOUSES_KEY, (old) =>
        [...(old ?? []), created].sort((a, b) => a.name.localeCompare(b.name)),
      );
      // A lista publica de casas (select de aposta, filtros) tem cache proprio:
      // sem isto a casa nova so' apareceria nos formularios depois de expirar.
      void qc.invalidateQueries({ queryKey: ["houses"] });
    },
  });
}

export function useUpdateAdminHouse() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...params }: UpdateAdminHouseParams & { id: number }) => patchAdminHouse(id, params),
    onSuccess: (updated) => {
      qc.setQueryData<AdminHouse[]>(HOUSES_KEY, (old) =>
        old?.map((h) => (h.id === updated.id ? updated : h)),
      );
      void qc.invalidateQueries({ queryKey: ["houses"] });
    },
  });
}
