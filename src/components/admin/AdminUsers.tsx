import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useAdminUsers, useUpdateAdminUser } from "@/hooks/queries/use-admin";
import { useMe } from "@/hooks/queries/use-me";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import { formatSaoPaulo, isLocked, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/admin-health";
import { initialsOf } from "@/lib/format";
import type { AdminUser } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

const GRID = "grid items-center gap-3 grid-cols-[minmax(180px,1.6fr)_236px_80px_110px_120px_110px]";

function RoleChoice({
  user,
  disabled,
  pending,
  onChange,
}: {
  user: AdminUser;
  disabled: boolean;
  pending: boolean;
  onChange: (roleId: number) => void;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-md border border-border p-0.5",
        (disabled || pending) && "opacity-50",
      )}
      // A própria linha vem travada: o servidor recusa o auto-rebaixamento, e
      // oferecer o clique só pra devolver 400 seria ensinar pelo erro.
      title={disabled ? "Você não pode alterar o próprio papel" : undefined}
    >
      {ROLE_OPTIONS.map((roleId) => (
        <button
          key={roleId}
          type="button"
          disabled={disabled || pending}
          onClick={() => roleId !== user.roleId && onChange(roleId)}
          className={cn(
            "px-2.5 py-1 text-xs rounded-[5px] transition-colors disabled:cursor-not-allowed",
            user.roleId === roleId
              ? "bg-accent/15 text-accent-text"
              : "opacity-45 hover:opacity-80",
          )}
        >
          {ROLE_LABELS[roleId]}
        </button>
      ))}
    </div>
  );
}

function LockLine({ user }: { user: AdminUser }) {
  if (!isLocked(user.lockedUntil)) return null;

  return (
    <p className="text-xs text-negative">
      bloqueado · {user.failedLoginAttempts} tentativas · até {formatSaoPaulo(user.lockedUntil)}
    </p>
  );
}

function Identity({ user, isMe }: { user: AdminUser; isMe: boolean }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 shrink-0 rounded-full bg-accent/15 text-accent-text flex items-center justify-center text-[11px] font-medium">
        {/* fullName é opcional no banco — sem ele as iniciais saem do username. */}
        {initialsOf(user.fullName || user.username)}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium flex items-center gap-2">
          {/* O truncate precisa estar no span: num container flex ele não
              alcança o texto solto, e o nome comprido saía cortado sem "…". */}
          <span className="truncate">{user.fullName || user.username}</span>
          {isMe && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 opacity-70 shrink-0">você</span>
          )}
          {user.isActive === false && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10 opacity-50 shrink-0">inativo</span>
          )}
        </p>
        <p className="text-xs opacity-45 truncate">{user.email}</p>
        <LockLine user={user} />
      </div>
    </div>
  );
}

function Actions({
  user,
  pending,
  onUnlock,
  onUnlink,
}: {
  user: AdminUser;
  pending: boolean;
  onUnlock: () => void;
  onUnlink: () => void;
}) {
  if (isLocked(user.lockedUntil)) {
    return (
      <Button variant="outline" size="sm" disabled={pending} onClick={onUnlock} className="text-[var(--dashboard-orange)] border-[var(--dashboard-orange)]/40">
        Desbloquear
      </Button>
    );
  }

  if (user.hasTelegram) {
    return (
      <Button variant="outline" size="sm" disabled={pending} onClick={onUnlink}>
        Desvincular
      </Button>
    );
  }

  return <span className="text-sm opacity-25">—</span>;
}

export function AdminUsers() {
  const { data: users, isPending, isError, refetch } = useAdminUsers();
  const { me } = useMe();
  const update = useUpdateAdminUser();
  const [search, setSearch] = useState("");

  // Doze linhas: filtrar aqui é mais barato que uma rota de busca.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.fullName ?? "").toLowerCase().includes(term),
    );
  }, [users, search]);

  const counts = useMemo(() => {
    const by = (roleId: number) => (users ?? []).filter((u) => u.roleId === roleId).length;
    return { admin: by(1), moderator: by(2), user: by(3) };
  }, [users]);

  const run = (id: number, params: { roleId?: number; unlock?: boolean; unlinkTelegram?: boolean }, done: string) =>
    update.mutate(
      { id, ...params },
      {
        onSuccess: () => actionToast.success({ title: done }),
        onError: (err) => actionToast.error({ description: getErrorMessage(err, "Não foi possível aplicar a mudança.") }),
      },
    );

  const pendingFor = (id: number) => update.isPending && update.variables?.id === id;

  if (isPending) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" delay={i * 60} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Não foi possível carregar os usuários"
        action={
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs uppercase tracking-wider opacity-45">
          Usuários{" "}
          <span className="normal-case tracking-normal">
            · {counts.admin} admin · {counts.moderator} moderador · {counts.user} usuário
          </span>
        </p>
        <div className="relative sm:w-72">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário ou e-mail"
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" description={`Nada bate com "${search}".`} />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden sm:block rounded-lg border border-border">
            <div className={cn(GRID, "px-4 py-2.5 border-b border-border text-[11px] uppercase tracking-wider opacity-40")}>
              <span>Usuário</span>
              <span>Papel</span>
              <span className="text-right">Apostas</span>
              <span>Último login</span>
              <span>Telegram</span>
              <span className="text-right">Ações</span>
            </div>
            {filtered.map((user) => (
              <div key={user.id} className={cn(GRID, "px-4 py-3 border-b border-border last:border-b-0")}>
                <Identity user={user} isMe={user.id === me?.id} />
                <RoleChoice
                  user={user}
                  disabled={user.id === me?.id}
                  pending={pendingFor(user.id)}
                  onChange={(roleId) => run(user.id, { roleId }, `Papel alterado para ${ROLE_LABELS[roleId]}`)}
                />
                <span className="text-sm tabular-nums text-right">{user.betCount}</span>
                <span className="text-sm opacity-55">{formatSaoPaulo(user.lastLogin)}</span>
                <span className="text-sm opacity-55">
                  {user.hasTelegram ? `vinculado ${formatSaoPaulo(user.telegramLinkedAt).slice(0, 5)}` : "—"}
                </span>
                <div className="flex justify-end">
                  <Actions
                    user={user}
                    pending={pendingFor(user.id)}
                    onUnlock={() => run(user.id, { unlock: true }, "Conta desbloqueada")}
                    onUnlink={() => run(user.id, { unlinkTelegram: true }, "Telegram desvinculado")}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Mobile: tabela de seis colunas não cabe em 390px. */}
          <div className="space-y-2 sm:hidden">
            {filtered.map((user) => (
              <div key={user.id} className="rounded-lg border border-border bg-card p-3.5 space-y-3">
                <Identity user={user} isMe={user.id === me?.id} />

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-55">
                  <span>{user.betCount} apostas</span>
                  <span>{formatSaoPaulo(user.lastLogin)}</span>
                  <span>{user.hasTelegram ? "Telegram vinculado" : "sem Telegram"}</span>
                </div>

                <RoleChoice
                  user={user}
                  disabled={user.id === me?.id}
                  pending={pendingFor(user.id)}
                  onChange={(roleId) => run(user.id, { roleId }, `Papel alterado para ${ROLE_LABELS[roleId]}`)}
                />

                {(isLocked(user.lockedUntil) || user.hasTelegram) && (
                  <div className="[&>button]:w-full">
                    <Actions
                      user={user}
                      pending={pendingFor(user.id)}
                      onUnlock={() => run(user.id, { unlock: true }, "Conta desbloqueada")}
                      onUnlink={() => run(user.id, { unlinkTelegram: true }, "Telegram desvinculado")}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
