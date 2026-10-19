import { useState, type ReactNode } from "react";
import { LockSimple, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { SectionLabel } from "@/components/ui/section-label";
import { UserAvatar, UserBadges } from "@/components/admin/AdminUserParts";
import type { AdminUserActions, UserRow } from "@/hooks/admin/use-admin-users-view";
import { formatSaoPaulo, ROLE_LABELS, ROLE_OPTIONS } from "@/lib/admin-health";
import { fromSaoPauloInput, toSaoPauloInput } from "@/lib/access";
import { accessDetail, displayName, shortDay, TONE_TEXT } from "@/lib/admin-users";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

type Variant = "panel" | "page";

const ROLE_CHOICES = ROLE_OPTIONS.map((id) => ({ value: String(id), label: ROLE_LABELS[id] }));

const BUTTON_TONE = {
  neutral: "border-foreground/[0.12] text-foreground hover:bg-foreground/[0.07]",
  danger: "border-danger/35 text-danger hover:bg-danger/10",
  accent: "border-accent-text/45 text-accent-text hover:bg-accent/10",
} as const;

function ActionButton({
  variant,
  tone = "neutral",
  className,
  ...props
}: { variant: Variant; tone?: keyof typeof BUTTON_TONE } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "press shrink-0 border bg-transparent font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed",
        variant === "page" ? "h-11 px-3.5 rounded-[10px] text-sm" : "h-9 px-3.5 rounded-lg text-[13.5px]",
        BUTTON_TONE[tone],
        className,
      )}
    />
  );
}

function Section({ title, variant, children }: { title: string; variant: Variant; children: ReactNode }) {
  return (
    <section
      className={cn(
        "flex flex-col gap-2.5 border-b border-border last:border-b-0",
        // No celular a divisória vai de borda a borda: compensa o p-4 do corpo.
        variant === "page" ? "-mx-4 px-5 py-[18px]" : "px-6 py-5",
      )}
    >
      <SectionLabel as="h3" className="px-0">
        {title}
      </SectionLabel>
      {children}
    </section>
  );
}

const DOT = { ok: "bg-success", bad: "bg-danger", off: "bg-zinc-600" } as const;

/** Estado de uma seção: bolinha + título, nota embaixo e a ação à direita. */
function StatusLine({
  dot,
  title,
  note,
  noteBad,
  action,
}: {
  dot: keyof typeof DOT;
  title: string;
  note: string;
  noteBad?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className="text-[14.5px] font-medium flex items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", DOT[dot])} />
          {title}
        </span>
        <span className={cn("text-[12.5px]", noteBad ? "text-danger" : "text-muted")}>{note}</span>
      </div>
      {action}
    </div>
  );
}

// Ajuste exato do vencimento (hora de Brasília), pra acertar quem pagou em
// outro dia sem ir no banco. Fica recolhido: +30 e +90 resolvem quase tudo.
function AccessDateEditor({
  accessUntil,
  variant,
  disabled,
  onSave,
  onDone,
}: {
  accessUntil: string | null;
  variant: Variant;
  disabled: boolean;
  onSave: (accessUntil: string | null) => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState(accessUntil ? toSaoPauloInput(accessUntil) : "");
  const save = (next: string | null) => {
    onSave(next);
    onDone();
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-background/60 p-3">
      <label htmlFor="admin-user-access" className="text-xs text-zinc-400">
        Vence em (horário de Brasília)
      </label>
      <Input id="admin-user-access" type="datetime-local" value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="flex items-center gap-2">
        {accessUntil && (
          <Button variant="ghost" size="sm" className="text-zinc-400" disabled={disabled} onClick={() => save(null)}>
            Sem prazo
          </Button>
        )}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={onDone}>
          Cancelar
        </Button>
        <Button size="sm" disabled={disabled || !value} onClick={() => save(fromSaoPauloInput(value))}>
          {variant === "page" ? "Salvar" : "Salvar data"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Detalhe do usuário, dividido em seções. O mesmo miolo vira painel lateral no
 * desktop e tela cheia no celular — só muda o tamanho dos alvos de toque.
 */
export function AdminUserDetail({
  row: { user, state },
  actions,
  variant,
  onClose,
}: {
  row: UserRow;
  actions: AdminUserActions;
  variant: Variant;
  onClose?: () => void;
}) {
  const [editingDate, setEditingDate] = useState(false);
  const isMe = user.id === actions.meId;
  const pending = actions.pendingFor(user.id);
  const name = displayName(user);
  const page = variant === "page";
  const access = accessDetail(user, state, isMe);
  const removeFromGroup = state.groupAction === "remove";

  const header = (
    <div
      className={cn(
        "flex items-start gap-3.5 border-b border-border",
        page ? "-mx-4 px-5 pt-1 pb-5" : "flex-none py-5 pl-6 pr-4",
      )}
    >
      <UserAvatar name={name} active={state.active} size="lg" />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={cn("font-semibold tracking-tight leading-tight", page ? "text-[19px]" : "text-lg")}>{name}</span>
          <UserBadges state={state} isMe={isMe} admin={user.roleId === 1} />
        </div>
        <span className="text-[13px] text-zinc-400 break-all">{user.email}</span>
        <span className="text-[12.5px] text-muted tabular-nums">
          {formatInt(user.betCount)} apostas · {user.lastLogin ? `último login ${formatSaoPaulo(user.lastLogin)}` : "nunca entrou"}
        </span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="shrink-0 size-9 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-foreground/[0.07] hover:text-foreground"
        >
          <X size={17} />
        </button>
      )}
    </div>
  );

  const sections = (
    <>
      <Section title="Acesso" variant={variant}>
        <div className="flex flex-col gap-[3px]">
          <span className={cn("text-lg font-semibold tracking-tight tabular-nums", TONE_TEXT[access.tone])}>{access.title}</span>
          <span className="text-[12.5px] text-muted">{access.note}</span>
          {user.subscriptionStatus && user.subscriptionStatus !== "authorized" && (
            <span className="text-[12.5px] text-muted">
              Assinatura no Mercado Pago:{" "}
              {user.subscriptionStatus === "pending" ? "link criado, sem pagamento" : user.subscriptionStatus === "paused" ? "pausada" : "cancelada"}
            </span>
          )}
        </div>
        {/* A própria conta não tem prazo: o servidor recusa, então nem oferece. */}
        {!isMe &&
          (editingDate ? (
            <AccessDateEditor
              accessUntil={user.accessUntil}
              variant={variant}
              disabled={pending}
              onSave={(accessUntil) => actions.setAccess(user, accessUntil)}
              onDone={() => setEditingDate(false)}
            />
          ) : (
            <div className={cn("flex gap-2", page ? "flex-col" : "items-center")}>
              <div className={page ? "grid grid-cols-2 gap-2" : "flex gap-2"}>
                <ActionButton variant={variant} disabled={pending} onClick={() => actions.extend(user, 30)}>
                  +30 dias
                </ActionButton>
                <ActionButton variant={variant} disabled={pending} onClick={() => actions.extend(user, 90)}>
                  +90 dias
                </ActionButton>
              </div>
              <button
                type="button"
                onClick={() => setEditingDate(true)}
                className={cn("self-start text-[13px] text-accent-text hover:underline underline-offset-4", page ? "py-1" : "self-center ml-1")}
              >
                Outra data
              </button>
            </div>
          ))}
      </Section>

      <Section title="Telegram" variant={variant}>
        <StatusLine
          dot={user.hasTelegram ? "ok" : "off"}
          title={user.hasTelegram ? "Vinculado" : "Não vinculado"}
          note={user.hasTelegram ? `Vinculado em ${shortDay(user.telegramLinkedAt)}` : "O usuário vincula pelo bot"}
          action={
            user.hasTelegram && (
              <ActionButton variant={variant} tone="danger" disabled={pending} onClick={() => actions.unlinkTelegram(user)}>
                Desvincular
              </ActionButton>
            )
          }
        />
      </Section>

      <Section title="Papel" variant={variant}>
        <Segmented
          label="Papel"
          value={String(user.roleId)}
          options={ROLE_CHOICES}
          onChange={(v) => actions.changeRole(user, Number(v))}
          // A própria conta vem travada: o servidor recusa o auto-rebaixamento, e
          // oferecer o clique só pra devolver 400 seria ensinar pelo erro.
          disabled={isMe || pending}
          className={cn("flex w-full bg-background", page && "[&>button]:h-10 [&>button]:text-sm")}
        />
        {isMe && (
          <span className="text-[12.5px] leading-snug text-muted flex items-start gap-1.5">
            <LockSimple size={13} className="mt-0.5 shrink-0" />
            Você não altera o próprio papel. O servidor recusa o auto-rebaixamento.
          </span>
        )}
      </Section>

      <Section title="Grupo Tips" variant={variant}>
        {state.inGroup ? (
          <StatusLine
            dot={removeFromGroup ? "bad" : "ok"}
            title="No grupo"
            note={
              removeFromGroup
                ? state.active
                  ? "Acesso vencido e ainda no grupo"
                  : "Conta inativa e ainda no grupo"
                : `Desde ${shortDay(user.telegramLinkedAt)}`
            }
            noteBad={removeFromGroup}
            action={
              // O Telegram não esconde mensagem de membro: só sai quem está sem acesso.
              removeFromGroup && (
                <ActionButton variant={variant} tone="danger" disabled={pending} onClick={() => actions.tipsGroup(user, "remove")}>
                  {page ? "Remover" : "Remover do grupo"}
                </ActionButton>
              )
            }
          />
        ) : (
          <StatusLine
            dot="off"
            title="Fora do grupo"
            note={
              state.groupAction === "invite"
                ? "Acesso em dia, mas o convite não saiu"
                : user.hasTelegram
                  ? "Não recebe as tips do grupo"
                  : "Sem Telegram, não entra no grupo"
            }
            action={
              state.groupAction === "invite" && (
                <ActionButton variant={variant} tone="accent" disabled={pending} onClick={() => actions.tipsGroup(user, "invite")}>
                  Convidar
                </ActionButton>
              )
            }
          />
        )}
      </Section>

      <Section title="Conta" variant={variant}>
        {state.locked && (
          <StatusLine
            dot="bad"
            title="Login bloqueado"
            note={`${user.failedLoginAttempts} tentativas · até ${formatSaoPaulo(user.lockedUntil)}`}
            noteBad
            action={
              <ActionButton variant={variant} disabled={pending} onClick={() => actions.unlock(user)}>
                Desbloquear
              </ActionButton>
            }
          />
        )}
        <StatusLine
          dot={state.active ? "ok" : "off"}
          title={state.active ? "Ativa" : "Inativa"}
          note={state.active ? "Entra normalmente no app" : "Login bloqueado até reativar"}
          action={
            !page && (
              <ActiveButton variant={variant} active={state.active} isMe={isMe} pending={pending} onClick={() => actions.toggleActive(user)} />
            )
          }
        />
        {page && (
          <ActiveButton variant={variant} active={state.active} isMe={isMe} pending={pending} onClick={() => actions.toggleActive(user)} />
        )}
      </Section>
    </>
  );

  if (page) {
    return (
      <div>
        {header}
        {sections}
      </div>
    );
  }

  return (
    <>
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto">{sections}</div>
    </>
  );
}

// Desativar a própria conta trancaria o admin do lado de fora: o servidor
// recusa, e o botão já chega desabilitado.
function ActiveButton({
  variant,
  active,
  isMe,
  pending,
  onClick,
}: {
  variant: Variant;
  active: boolean;
  isMe: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <ActionButton
      variant={variant}
      tone={active ? "danger" : "accent"}
      disabled={pending || (active && isMe)}
      title={active && isMe ? "Você não pode desativar a própria conta" : undefined}
      onClick={onClick}
    >
      {active ? "Desativar conta" : "Reativar conta"}
    </ActionButton>
  );
}
