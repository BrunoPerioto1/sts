import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminScanner,
  getAdminHouses,
  getAdminOverview,
  getAdminScanner,
  getAdminScannerSample,
  getAdminUsers,
  patchAdminHouse,
  putAdminHouseLogo,
  deleteAdminHouseLogo,
  patchAdminScanner,
  patchAdminScannerSport,
  patchAdminUser,
  postAdminHouse,
  postAdminScanner,
  type AdminHouse,
  type AdminUser,
  type CreateAdminHouseParams,
  type CreateScannerParams,
  type ScannerFlags,
  type ScannerTournament,
  type UpdateAdminHouseParams,
  type UpdateAdminUserParams,
} from "@/api/routes/get-admin";

const ADMIN_KEY = ["admin"] as const;
const USERS_KEY = [...ADMIN_KEY, "users"] as const;
const HOUSES_KEY = [...ADMIN_KEY, "houses"] as const;
const SCANNER_KEY = [...ADMIN_KEY, "scanner"] as const;

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
    // groupInvite é do momento (vira toast), não da linha: fica fora do cache.
    onSuccess: ({ groupInvite, ...updated }) => {
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

// Envia (blob) ou remove (null) o logo. A lista do admin já mostra a versão
// nova; a lista pública vem da CDN e pode levar até 1h pra trocar nas outras telas.
export function useSetAdminHouseLogo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, logo }: { id: number; logo: Blob | null }) =>
      logo ? putAdminHouseLogo(id, logo) : deleteAdminHouseLogo(id),
    onSuccess: ({ id, logoVersion }) => {
      qc.setQueryData<AdminHouse[]>(HOUSES_KEY, (old) => old?.map((h) => (h.id === id ? { ...h, logoVersion } : h)));
      void qc.invalidateQueries({ queryKey: ["houses"] });
    },
  });
}

export function useAdminScanner() {
  return useQuery({ queryKey: SCANNER_KEY, queryFn: getAdminScanner });
}

// Só busca quando o painel "Dados" abre: são ~3 KB por competição.
export function useAdminScannerSample(id: number, enabled: boolean) {
  return useQuery({ queryKey: [...SCANNER_KEY, "sample", id], queryFn: () => getAdminScannerSample(id), enabled });
}

export function useCreateAdminScanner() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateScannerParams) => postAdminScanner(params),
    // Raro: refaz o GET em vez de montar a linha (a resposta não traz o esporte).
    onSuccess: () => qc.invalidateQueries({ queryKey: SCANNER_KEY }),
  });
}

/** Uma competição (`id`) ou todas as de um esporte (`sportId`). */
export type ScannerTarget = { id: number } | { sportId: number };

/**
 * Otimista: o checkbox muda no clique e volta se a API recusar. Esperar o PATCH
 * num serverless frio deixava a tela parecendo travada.
 */
export function useUpdateAdminScanner() {
  const qc = useQueryClient();
  const hits = (t: ScannerTournament, target: ScannerTarget) =>
    "id" in target ? t.id === target.id : t.sportId === target.sportId;

  return useMutation({
    mutationFn: ({ target, flags }: { target: ScannerTarget; flags: ScannerFlags }) =>
      "id" in target
        ? patchAdminScanner(target.id, flags).then((row) => [row])
        : patchAdminScannerSport(target.sportId, flags),
    onMutate: async ({ target, flags }) => {
      await qc.cancelQueries({ queryKey: SCANNER_KEY });
      const before = qc.getQueryData<ScannerTournament[]>(SCANNER_KEY);
      qc.setQueryData<ScannerTournament[]>(SCANNER_KEY, (old) =>
        old?.map((t) => (hits(t, target) ? { ...t, ...flags } : t)),
      );
      return { before };
    },
    onError: (_err, _vars, ctx) => qc.setQueryData(SCANNER_KEY, ctx?.before),
    // A resposta é o que ficou no banco: mescla por id (sem o nome do esporte).
    onSuccess: (rows) => {
      const byId = new Map(rows.map((r) => [r.id, r]));
      qc.setQueryData<ScannerTournament[]>(SCANNER_KEY, (old) => old?.map((t) => ({ ...t, ...byId.get(t.id) })));
    },
  });
}

export function useDeleteAdminScanner() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAdminScanner(id),
    onSuccess: (_void, id) =>
      qc.setQueryData<ScannerTournament[]>(SCANNER_KEY, (old) => old?.filter((t) => t.id !== id)),
  });
}
