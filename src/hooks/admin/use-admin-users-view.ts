import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAdminUsers, useUpdateAdminUser } from "@/hooks/queries/use-admin";
import { useMe } from "@/hooks/queries/use-me";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { formatAccessDate } from "@/lib/access";
import { ROLE_LABELS } from "@/lib/admin-health";
import {
  activeFilterCount,
  firstName,
  inTab,
  matchesFilters,
  matchesSearch,
  NO_FILTERS,
  problemSummary,
  userState,
  USER_TABS,
  type UserFilters,
  type UserState,
  type UserTab,
} from "@/lib/admin-users";
import type { AdminUser, UpdateAdminUserParams, UpdatedAdminUser } from "@/api/routes/get-admin";

const INVITE_FAILED =
  "Confira se o bot é admin do grupo e se a pessoa não bloqueou o bot. Dá pra repetir pelo botão Convidar.";

export type UserRow = { user: AdminUser; state: UserState };

/**
 * Detalhe do usuário guardado na URL (?user=): no celular ele é uma tela
 * empilhada, e o "voltar" do sistema precisa fechá-lo em vez de sair do admin.
 */
export function useUserPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = Number(searchParams.get("user")) || null;

  return {
    userId,
    open: (id: number) => {
      const next = new URLSearchParams(searchParams);
      next.set("user", String(id));
      setSearchParams(next, { state: { userPanel: true } });
    },
    close: () => {
      if (location.state?.userPanel) return navigate(-1);
      const next = new URLSearchParams(searchParams);
      next.delete("user");
      setSearchParams(next, { replace: true });
    },
  };
}

export function useAdminUsersView() {
  const { data: users, isPending, isError, refetch } = useAdminUsers();
  const { me } = useMe();
  const update = useUpdateAdminUser();
  const panel = useUserPanel();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<UserTab>("all");
  const [filters, setFilters] = useState<UserFilters>(NO_FILTERS);
  // Promover dá acesso ao painel inteiro: pede confirmação. Rebaixar não.
  const [promoting, setPromoting] = useState<AdminUser | null>(null);

  // Ativos primeiro, inativos no fim. O sort é estável: dentro de cada grupo
  // fica a ordem que veio da API.
  const rows = useMemo<UserRow[]>(
    () =>
      (users ?? [])
        .map((user) => ({ user, state: userState(user) }))
        .sort((a, b) => Number(b.state.active) - Number(a.state.active)),
    [users],
  );

  // Doze linhas: filtrar aqui é mais barato que uma rota de busca. A contagem
  // de cada aba já respeita busca e filtros — é o que a aba mostraria.
  const term = search.trim().toLowerCase();
  const base = rows.filter(({ user, state }) => matchesSearch(user, term) && matchesFilters(user, state, filters));
  const visible = base.filter(({ state }) => inTab(state, tab));
  const tabs = USER_TABS.map((t) => ({ ...t, count: base.filter(({ state }) => inTab(state, t.id)).length }));

  const run = (
    user: AdminUser,
    params: UpdateAdminUserParams,
    title: string | ((updated: UpdatedAdminUser) => string),
    undo?: UpdateAdminUserParams,
  ) =>
    update.mutate(
      { id: user.id, ...params },
      {
        // Liberar acesso de quem estava fora do grupo Tips também manda o
        // convite: o toast diz se ele chegou.
        onSuccess: (updated) =>
          updated.groupInvite === "failed"
            ? actionToast.error({ title: "O convite do grupo Tips não saiu", description: INVITE_FAILED, duration: 6000 })
            : actionToast.success({
                title: typeof title === "string" ? title : title(updated),
                description: updated.groupInvite === "sent" ? "Convite do grupo Tips enviado no Telegram." : undefined,
                action: undo && { label: "Desfazer", onClick: () => run(user, undo, "Alteração desfeita") },
              }),
        onError: (err) => actionToast.error({ description: getErrorMessage(err, "Não foi possível aplicar a mudança.") }),
      },
    );

  const setRole = (user: AdminUser, roleId: number) =>
    run(user, { roleId }, `${firstName(user)} agora é ${ROLE_LABELS[roleId]}`, { roleId: user.roleId });

  const actions = {
    meId: me?.id,
    pendingFor: (id: number) => update.isPending && update.variables?.id === id,
    // O Desfazer volta pro vencimento anterior (ou sem prazo), não subtrai dias.
    extend: (user: AdminUser, days: number) =>
      run(
        user,
        { extendDays: days },
        (u) => `${firstName(user)}: acesso até ${u.accessUntil ? formatAccessDate(u.accessUntil).slice(0, 5) : "—"}`,
        { accessUntil: user.accessUntil },
      ),
    setAccess: (user: AdminUser, accessUntil: string | null) =>
      run(
        user,
        { accessUntil },
        accessUntil ? `${firstName(user)}: acesso até ${formatAccessDate(accessUntil).slice(0, 5)}` : `${firstName(user)} ficou sem prazo`,
        { accessUntil: user.accessUntil },
      ),
    // Sem Desfazer: o vínculo volta só pelo bot, com a pessoa gerando um código.
    unlinkTelegram: (user: AdminUser) => run(user, { unlinkTelegram: true }, `Telegram de ${firstName(user)} desvinculado`),
    // Sem Desfazer: convidar de volta exige acesso em dia, que essa pessoa não tem.
    tipsGroup: (user: AdminUser, action: "remove" | "invite") =>
      run(
        user,
        { tipsGroup: action },
        action === "remove" ? `${firstName(user)} removido do grupo Tips` : `${firstName(user)} liberado no grupo Tips`,
      ),
    // Desativar derruba login, API e tips na hora: sem diálogo de confirmação,
    // mas com Desfazer no toast pro clique errado.
    toggleActive: (user: AdminUser) => {
      const inactive = user.isActive === false;
      run(
        user,
        { isActive: inactive },
        inactive ? `Conta de ${firstName(user)} reativada` : `Conta de ${firstName(user)} desativada`,
        { isActive: !inactive },
      );
    },
    changeRole: (user: AdminUser, roleId: number) => {
      if (roleId === user.roleId) return;
      if (roleId === 1) setPromoting(user);
      else setRole(user, roleId);
    },
    unlock: (user: AdminUser) => run(user, { unlock: true }, `Login de ${firstName(user)} desbloqueado`),
  };

  const secondaryCount = activeFilterCount(filters);

  return {
    users,
    isPending,
    isError,
    refetch,
    rows,
    visible,
    tabs,
    tab,
    setTab,
    search,
    setSearch,
    filters,
    setFilters,
    secondaryCount,
    clearFilters: () => setFilters(NO_FILTERS),
    clearAll: () => {
      setSearch("");
      setTab("all");
      setFilters(NO_FILTERS);
    },
    admins: rows.filter(({ user }) => user.roleId === 1).length,
    problems: problemSummary(rows.map((r) => r.state)),
    panel,
    selected: rows.find(({ user }) => user.id === panel.userId),
    actions,
    promoting,
    confirmPromote: () => {
      if (promoting) setRole(promoting, 1);
      setPromoting(null);
    },
    cancelPromote: () => setPromoting(null),
  };
}

export type AdminUsersView = ReturnType<typeof useAdminUsersView>;
export type AdminUserActions = AdminUsersView["actions"];
