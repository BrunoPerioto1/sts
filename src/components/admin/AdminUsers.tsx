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
import type { AdminUser, UpdateAdminUserParams } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatAccessDate, fromSaoPauloInput, isExpired, toSaoPauloInput } from "@/lib/access";
import { AdminPanel, FilterChip } from "@/components/admin/AdminPanel";

const GRID = "grid items-center gap-3 grid-cols-[minmax(180px,1.6fr)_236px_80px_110px_120px_196px_110px]";

const FILTERS = [
  { id: "all", label: "Todos", test: () => true },
  { id: "admin", label: "Admin", test: (u: AdminUser) => u.roleId === 1 },
  { id: "user", label: "Usuário", test: (u: AdminUser) => u.roleId === 3 },
  { id: "locked", label: "Bloqueados", test: (u: AdminUser) => isLocked(u.lockedUntil) },
  { id: "expired", label: "Vencidos", test: (u: AdminUser) => isExpired(u.accessUntil) },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const ACCESS_DAYS = 30;

// Vencimento + "+30d". Sem prazo = conta antiga ou admin; o primeiro clique
// já põe o cliente no ciclo de cobrança. Clicar na data abre o ajuste exato
// (hora de Brasília) — pra acertar quem pagou em outro dia sem ir no banco.
function AccessCell({
  user,
  isMe,
  pending,
  onExtend,
  onSetDate,
}: {
  user: AdminUser;
  isMe: boolean;
  pending: boolean;
  onExtend: () => void;
  onSetDate: (accessUntil: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const expired = isExpired(user.accessUntil);
  const label = user.accessUntil ? `${expired ? "venceu" : "até"} ${formatAccessDate(user.accessUntil)}` : "sem prazo";
  // Largura fixa no rótulo: o +30d fica na mesma coluna em todas as linhas.
  const labelClass = cn("w-[132px] shrink-0 text-left text-sm tabular-nums whitespace-nowrap", expired ? "text-negative" : "opacity-55");

  if (isMe) return <span className={labelClass}>{label}</span>;

  const apply = (accessUntil: string | null) => {
    onSetDate(accessUntil);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setValue(user.accessUntil ? toSaoPauloInput(user.accessUntil) : "");
          setOpen(next);
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={pending}
            aria-label={`Ajustar vencimento de ${user.username}`}
            className={cn(labelClass, "underline decoration-dotted underline-offset-4 hover:opacity-100 disabled:opacity-40")}
          >
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 space-y-3">
          <div className="space-y-1.5">
            <label htmlFor={`access-${user.id}`} className="text-xs text-zinc-400">Vence em (horário de Brasília)</label>
            <Input
              id={`access-${user.id}`}
              type="datetime-local"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            {user.accessUntil ? (
              <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => apply(null)}>Sem prazo</Button>
            ) : <span />}
            <Button size="sm" disabled={!value} onClick={() => apply(fromSaoPauloInput(value))}>Salvar</Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button variant="outline" size="sm" disabled={pending} onClick={onExtend} className="h-7 px-2 text-xs">
        +{ACCESS_DAYS}d
      </Button>
    </div>
  );
}

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

  // Centralizado na coluna, que tem a largura do botão: o traço cai no meio de
  // onde estaria o "Desvincular", não colado na borda direita.
  return <span className="w-full text-center text-sm opacity-25">—</span>;
}

export function AdminUsers() {
  const { data: users, isPending, isError, refetch } = useAdminUsers();
  const { me } = useMe();
  const update = useUpdateAdminUser();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  // Doze linhas: filtrar aqui é mais barato que uma rota de busca.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter)!.test;
    return (users ?? []).filter(
      (u) =>
        test(u) &&
        (!term ||
          u.username.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          (u.fullName ?? "").toLowerCase().includes(term)),
    );
  }, [users, search, filter]);

  const run = (id: number, params: UpdateAdminUserParams, done: string) =>
    update.mutate(
      { id, ...params },
      {
        onSuccess: () => actionToast.success({ title: done }),
        onError: (err) => actionToast.error({ description: getErrorMessage(err, "Não foi possível aplicar a mudança.") }),
      },
    );

  const pendingFor = (id: number) => update.isPending && update.variables?.id === id;

  const body = isPending ? (
    <div className="p-4 space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 rounded-lg" delay={i * 60} />
      ))}
    </div>
  ) : isError ? (
    <EmptyState
      bare
      title="Não foi possível carregar os usuários"
      action={
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Tentar de novo
        </Button>
      }
    />
  ) : (
    <>
      {filtered.length === 0 ? (
    <EmptyState bare title="Nenhum usuário encontrado" description={search ? `Nada bate com "${search}".` : "Ninguém neste filtro."} />
  ) : (
    <>
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className={cn(GRID, "px-6 py-2.5 border-b border-border bg-foreground/[0.02] [&>span]:text-[11px] [&>span]:uppercase [&>span]:tracking-[0.1em] [&>span]:opacity-40")}>
          <span>Usuário</span>
          <span>Papel</span>
          <span className="text-right">Apostas</span>
          <span>Último login</span>
          <span>Telegram</span>
          <span>Acesso</span>
          <span className="text-right">Ações</span>
        </div>
        {filtered.map((user) => (
          <div key={user.id} className={cn(GRID, "px-6 py-3 border-b border-border last:border-b-0")}>
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
            <AccessCell
              user={user}
              isMe={user.id === me?.id}
              pending={pendingFor(user.id)}
              onExtend={() => run(user.id, { extendDays: ACCESS_DAYS }, `Acesso liberado por +${ACCESS_DAYS} dias`)}
              onSetDate={(accessUntil) => run(user.id, { accessUntil }, accessUntil ? `Vencimento ajustado para ${formatAccessDate(accessUntil)}` : "Prazo removido")}
            />
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

      {/* Mobile: tabela de sete colunas não cabe em 390px. */}
      <div className="space-y-2 p-3 sm:hidden">
        {filtered.map((user) => (
          <div key={user.id} className="rounded-lg border border-border bg-card p-3.5 space-y-3">
            <Identity user={user} isMe={user.id === me?.id} />

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs opacity-55">
              <span>{user.betCount} apostas</span>
              <span>{formatSaoPaulo(user.lastLogin)}</span>
              <span>{user.hasTelegram ? "Telegram vinculado" : "sem Telegram"}</span>
            </div>

            <AccessCell
              user={user}
              isMe={user.id === me?.id}
              pending={pendingFor(user.id)}
              onExtend={() => run(user.id, { extendDays: ACCESS_DAYS }, `Acesso liberado por +${ACCESS_DAYS} dias`)}
              onSetDate={(accessUntil) => run(user.id, { accessUntil }, accessUntil ? `Vencimento ajustado para ${formatAccessDate(accessUntil)}` : "Prazo removido")}
            />

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
    </>
  );

  return (
    <AdminPanel
      eyebrow="Usuários"
      title={users ? `${users.length} ${users.length === 1 ? "usuário" : "usuários"}` : "Usuários"}
      description={
        <>
          Papel, bloqueio de login, vínculo com o Telegram e vencimento do acesso (PIX).
          <br />
          Você não altera o próprio papel — o servidor recusa o auto-rebaixamento.
        </>
      }
      actions={
        <div className="relative flex-1 sm:w-72">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuário ou e-mail"
            className="pl-9"
          />
        </div>
      }
      filters={
        users &&
        FILTERS.map((f) => (
          <FilterChip key={f.id} active={filter === f.id} count={users.filter(f.test).length} onClick={() => setFilter(f.id)}>
            {f.label}
          </FilterChip>
        ))
      }
      footer={users && !isError && <span className="opacity-45">{filtered.length} de {users.length}</span>}
    >
      {body}
    </AdminPanel>
  );
}
