import { useState } from "react";
import { Prohibit, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileChip, MobileChips, MobileSearch } from "@/components/admin/AdminPanel";
import { formatSaoPaulo, isLocked, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/admin-health";
import { daysUntilAccess, formatAccessDate, isExpired, tipsGroupAction } from "@/lib/access";
import { initialsOf } from "@/lib/format";
import type { AdminUser } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

export interface UserActions {
  meId?: number;
  pendingFor: (id: number) => boolean;
  changeRole: (user: AdminUser, roleId: number) => void;
  toggleActive: (user: AdminUser) => void;
  accessCell: (user: AdminUser) => React.ReactNode;
  extend: (user: AdminUser, days: number) => void;
  actions: (user: AdminUser) => React.ReactNode;
}

// "JOAO VICTOR ALVES" e "rafael lima" viram "Joao Victor Alves" / "Rafael Lima".
// Nome já com caixa mista fica como a pessoa escreveu.
function niceName(name: string): string {
  if (name !== name.toUpperCase() && name !== name.toLowerCase()) return name;
  return name
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/ (De|Da|Do|Dos|Das|E) /g, (m) => m.toLowerCase());
}

function status(user: AdminUser): { label: string; tone: "bad" | "warn" | "muted" } {
  if (isLocked(user.lockedUntil)) return { label: "bloqueado", tone: "bad" };
  if (user.paymentClaimedAt) return { label: "avisou pagamento", tone: "warn" };
  if (isExpired(user.accessUntil)) return { label: `vencido há ${-daysUntilAccess(user.accessUntil!)}d`, tone: "bad" };
  if (user.accessUntil) return { label: `até ${formatAccessDate(user.accessUntil).slice(0, 5)}`, tone: "muted" };
  return { label: "sem prazo", tone: "muted" };
}

function groupHint(user: AdminUser): { text: string; bad?: boolean } {
  if (!user.hasTelegram) return { text: "Sem Telegram vinculado" };
  if (tipsGroupAction(user) === "remove") return { text: "Sem acesso e ainda está no grupo", bad: true };
  if (user.tipsGroupRemovedAt) return { text: "Fora do grupo" };
  return { text: `No grupo · vinculado ${formatSaoPaulo(user.telegramLinkedAt).slice(0, 5)}` };
}

function UserRow({ user, open, onToggle, act }: { user: AdminUser; open: boolean; onToggle: () => void; act: UserActions }) {
  const isMe = user.id === act.meId;
  const name = niceName(user.fullName || user.username);
  const st = status(user);
  const hint = groupHint(user);
  const pending = act.pendingFor(user.id);
  const inactive = user.isActive === false;

  return (
    <div className={cn(open && "bg-foreground/[0.03]")}>
      <button type="button" onClick={onToggle} className="w-full px-3.5 py-3 flex items-center gap-[11px] text-left">
        <span className="w-9 h-9 shrink-0 rounded-full bg-foreground/[0.07] flex items-center justify-center text-[12.5px] font-medium text-accent-text">
          {initialsOf(name)}
        </span>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn("text-[14.5px] truncate", inactive && "text-zinc-500")}>{name}</span>
            {user.roleId === 1 && <span className="shrink-0 text-[10.5px] px-1.5 rounded-[5px] bg-accent/20 text-accent-text">admin</span>}
            {isMe && <span className="shrink-0 text-[10.5px] px-1.5 rounded-[5px] bg-foreground/10 text-zinc-400">você</span>}
            {inactive && <span className="shrink-0 text-[10.5px] px-1.5 rounded-[5px] border border-border text-zinc-500">inativo</span>}
          </div>
          <p className="text-[11.5px] text-zinc-500 truncate">
            {user.betCount.toLocaleString("pt-BR")} apostas · {user.lastLogin ? `visto ${formatSaoPaulo(user.lastLogin).slice(0, 5)}` : "nunca entrou"} ·{" "}
            {user.hasTelegram ? "Telegram ok" : "sem Telegram"}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 text-[11.5px] tabular-nums",
            st.tone === "bad" && "text-negative px-[7px] py-0.5 rounded-md bg-negative/10",
            st.tone === "warn" && "text-[var(--dashboard-orange)]",
            st.tone === "muted" && "text-zinc-500",
          )}
        >
          {st.label}
        </span>
      </button>

      {open && (
        <div className="pl-[61px] pr-3.5 pb-3.5 pt-0.5 space-y-3.5">
          <div className="space-y-0.5">
            <p className="text-[11.5px] text-zinc-500 break-all">{user.email}</p>
            {user.paymentClaimedAt && (
              <p className="text-[11.5px] text-[var(--dashboard-orange)]">
                avisou que pagou · {formatSaoPaulo(user.paymentClaimedAt)} · PIX STS{user.id}
              </p>
            )}
            {isLocked(user.lockedUntil) && (
              <p className="text-[11.5px] text-negative">
                bloqueado · {user.failedLoginAttempts} tentativas · até {formatSaoPaulo(user.lockedUntil)}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11.5px] text-zinc-500">Acesso</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {act.accessCell(user)}
              {!isMe && (
                <Button variant="outline" size="sm" disabled={pending} onClick={() => act.extend(user, 90)} className="h-7 px-2 text-xs">
                  +90d
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-[11.5px] text-zinc-500">Papel</p>
            <div className={cn("flex p-[3px] rounded-[10px] border border-border bg-background", (isMe || pending) && "opacity-45")}>
              {ROLE_OPTIONS.map((roleId) => (
                <button
                  key={roleId}
                  type="button"
                  // O servidor recusa o auto-rebaixamento: a própria linha vem travada.
                  disabled={isMe || pending}
                  onClick={() => roleId !== user.roleId && act.changeRole(user, roleId)}
                  className={cn(
                    "flex-1 h-8 rounded-[7px] text-[13px] transition-colors",
                    user.roleId === roleId ? "bg-foreground/10 text-foreground" : "text-zinc-500",
                  )}
                >
                  {ROLE_LABELS[roleId]}
                </button>
              ))}
            </div>
            {isMe && <p className="text-[11px] text-zinc-500">É a sua conta: você não pode mudar o próprio papel.</p>}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-[13.5px]">Grupo Tips</p>
              <p className={cn("text-[11.5px]", hint.bad ? "text-negative" : "text-zinc-500")}>{hint.text}</p>
            </div>
            <div className="shrink-0">{act.actions(user)}</div>
          </div>

          {!isMe && (
            <button
              type="button"
              disabled={pending}
              onClick={() => act.toggleActive(user)}
              className={cn(
                "h-8 flex items-center gap-1.5 text-[13px] disabled:opacity-40",
                inactive ? "text-accent-text" : "text-negative",
              )}
            >
              <Prohibit size={14} />
              {inactive ? "Reativar conta" : "Desativar conta"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminUsersMobile<F extends string>({
  users,
  filtered,
  isPending,
  isError,
  onRetry,
  search,
  setSearch,
  filters,
  filter,
  setFilter,
  expiredFilter,
  act,
}: {
  users?: AdminUser[];
  filtered: AdminUser[];
  isPending: boolean;
  isError: boolean;
  onRetry: () => void;
  search: string;
  setSearch: (value: string) => void;
  filters: readonly { id: F; label: string; test: (u: AdminUser) => boolean }[];
  filter: F;
  setFilter: (id: F) => void;
  expiredFilter: F;
  act: UserActions;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const expired = (users ?? []).filter((u) => isExpired(u.accessUntil)).length;
  const stillInGroup = (users ?? []).filter((u) => tipsGroupAction(u) === "remove").length;

  return (
    <div className="space-y-2.5">
      {/* A única ação urgente da tela: vencido que continua lendo as tips. */}
      {expired > 0 && (
        <button
          type="button"
          onClick={() => setFilter(expiredFilter)}
          className="w-full h-12 px-3 rounded-xl border border-negative/30 bg-negative/[0.07] flex items-center gap-2.5 text-left"
        >
          <WarningCircle size={17} weight="fill" className="shrink-0 text-negative" />
          <span className="flex-1 text-[13.5px]">
            {expired} {expired === 1 ? "acesso vencido" : "acessos vencidos"}
            {stillInGroup > 0 && `, ${stillInGroup} ainda no grupo Tips`}
          </span>
          <span className="text-[13px] text-negative">Ver</span>
        </button>
      )}

      <MobileSearch value={search} onChange={setSearch} placeholder="Nome ou e-mail" />
      {users && (
        <MobileChips>
          {filters.map((f) => (
            <MobileChip key={f.id} active={filter === f.id} count={users.filter(f.test).length} onClick={() => setFilter(f.id)}>
              {f.label}
            </MobileChip>
          ))}
        </MobileChips>
      )}

      {isPending ? (
        <div className="space-y-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-xl" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar os usuários"
          action={
            <Button variant="outline" size="sm" onClick={onRetry}>
              Tentar de novo
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="Nenhum usuário encontrado" description={search ? `Nada bate com "${search}".` : "Ninguém neste filtro."} />
      ) : (
        <div className="mt-1 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
          {filtered.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              open={openId === user.id}
              onToggle={() => setOpenId(openId === user.id ? null : user.id)}
              act={act}
            />
          ))}
        </div>
      )}
    </div>
  );
}
