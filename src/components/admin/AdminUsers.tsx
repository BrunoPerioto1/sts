import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowCounterClockwise,
  CalendarBlank,
  LinkBreak,
  LockSimpleOpen,
  MagnifyingGlass,
  Plus,
  Prohibit,
  SlidersHorizontal,
  User,
  UserMinus,
  type Icon,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChip } from "@/components/ui/filter-chips";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RowMenuButton } from "@/components/ui/row-menu-button";
import { COLUMN_HEAD } from "@/components/admin/AdminPanel";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { ProblemsBanner, UserAvatar, UserBadges, UserFilterGroups } from "@/components/admin/AdminUserParts";
import { AdminUsersMobile } from "@/components/admin/AdminUsersMobile";
import { useAdminUsersView, type AdminUserActions, type AdminUsersView, type UserRow } from "@/hooks/admin/use-admin-users-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { ROLE_LABELS } from "@/lib/admin-health";
import { accessLabel, accountsHeadline, displayName, TONE_TEXT } from "@/lib/admin-users";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

// O Telegram virou a segunda linha do Acesso e o último login foi pro detalhe:
// cinco colunas cabem em ~760px, sem a rolagem lateral da versão de sete.
const GRID = "grid items-center grid-cols-[minmax(200px,1fr)_150px_120px_230px_56px]";

const MENU_TONE = {
  neutral: "focus:text-foreground",
  danger: "text-danger focus:text-danger",
  accent: "text-accent-text focus:text-accent-text",
} as const;

function MenuItem({
  icon: IconComponent,
  tone = "neutral",
  children,
  ...props
}: { icon: Icon; tone?: keyof typeof MENU_TONE; children: string } & ComponentPropsWithoutRef<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem
      {...props}
      className={cn(
        "h-9 gap-2.5 rounded-lg px-2.5 text-[13.5px] focus:bg-foreground/[0.07]",
        // Ação que não se aplica fica no menu, apagada — não some.
        "data-[disabled]:opacity-100 data-[disabled]:text-zinc-600",
        MENU_TONE[tone],
      )}
    >
      <IconComponent size={15} className="shrink-0" />
      {children}
    </DropdownMenuItem>
  );
}

/** O •••: acesso em cima, destrutivas em vermelho embaixo dos separadores. */
function UserMenu({ row: { user, state }, actions, onOpen }: { row: UserRow; actions: AdminUserActions; onOpen: () => void }) {
  const isMe = user.id === actions.meId;
  const pending = actions.pendingFor(user.id);
  // O painel só abre quando o menu sai da tela. Aberto durante a animação de
  // saída, ele cobre o menu, o ponteiro "sai" do item, o Radix devolve o foco
  // pro menu — e o painel lê isso como foco fora e fecha na hora.
  const openAfterClose = useRef(false);
  const openLater = () => {
    openAfterClose.current = true;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <RowMenuButton
          aria-label={`Ações de ${displayName(user)}`}
          // O clique não pode chegar na linha, que abriria o detalhe junto.
          onClick={(e) => e.stopPropagation()}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-60 rounded-xl p-1.5"
        // Dispara depois que o conteúdo do menu desmonta, fim da animação.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (!openAfterClose.current) return;
          openAfterClose.current = false;
          onOpen();
        }}
      >
        <MenuItem icon={User} onSelect={openLater}>
          Ver usuário
        </MenuItem>
        <MenuItem icon={CalendarBlank} onSelect={openLater}>
          Editar acesso
        </MenuItem>
        <MenuItem icon={Plus} disabled={isMe || pending} onSelect={() => actions.extend(user, 30)}>
          +30 dias
        </MenuItem>
        <MenuItem icon={Plus} disabled={isMe || pending} onSelect={() => actions.extend(user, 90)}>
          +90 dias
        </MenuItem>
        {state.locked && (
          <MenuItem icon={LockSimpleOpen} disabled={pending} onSelect={() => actions.unlock(user)}>
            Desbloquear login
          </MenuItem>
        )}
        <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        <MenuItem icon={LinkBreak} tone="danger" disabled={!user.hasTelegram || pending} onSelect={() => actions.unlinkTelegram(user)}>
          Desvincular Telegram
        </MenuItem>
        <MenuItem
          icon={UserMinus}
          tone="danger"
          disabled={state.groupAction !== "remove" || pending}
          onSelect={() => actions.tipsGroup(user, "remove")}
        >
          Remover do grupo Tips
        </MenuItem>
        <DropdownMenuSeparator className="-mx-1.5 my-1.5" />
        {state.active ? (
          <MenuItem icon={Prohibit} tone="danger" disabled={isMe || pending} onSelect={() => actions.toggleActive(user)}>
            Desativar conta
          </MenuItem>
        ) : (
          <MenuItem icon={ArrowCounterClockwise} tone="accent" disabled={pending} onSelect={() => actions.toggleActive(user)}>
            Reativar conta
          </MenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserTableRow({ row, actions, onOpen }: { row: UserRow; actions: AdminUserActions; onOpen: () => void }) {
  const { user, state } = row;
  const name = displayName(user);
  const access = accessLabel(user, state);
  const admin = user.roleId === 1;

  return (
    <div
      role="button"
      tabIndex={0}
      // Menu e diálogos vêm por portal, mas o clique deles sobe pela árvore do
      // React até aqui: só conta o que aconteceu dentro da linha de verdade.
      onClick={(e) => e.currentTarget.contains(e.target as Node) && onOpen()}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
        e.preventDefault();
        onOpen();
      }}
      className={cn(
        GRID,
        "min-h-16 py-2.5 pl-5 pr-3 cursor-pointer transition-colors hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:bg-foreground/[0.04]",
      )}
    >
      <div className="min-w-0 flex items-center gap-3">
        <UserAvatar name={name} active={state.active} />
        <div className="min-w-0 flex flex-col gap-0.5">
          <div className="min-w-0 flex items-center gap-1.5">
            {/* O truncate precisa estar no span: num container flex ele não
                alcança o texto solto, e o nome comprido saía cortado sem "…". */}
            <span className={cn("truncate text-sm font-semibold", !state.active && "text-zinc-400")}>{name}</span>
            <UserBadges state={state} isMe={user.id === actions.meId} />
          </div>
          <span className="truncate text-[12.5px] text-muted">{user.email}</span>
        </div>
      </div>
      <span className={cn("text-[13.5px]", admin ? "font-medium text-foreground" : "text-zinc-400")}>{ROLE_LABELS[user.roleId]}</span>
      <span className="pr-8 text-right text-sm tabular-nums">{formatInt(user.betCount)}</span>
      <div className="flex flex-col gap-0.5">
        <span className={cn("text-sm font-medium tabular-nums", TONE_TEXT[access.tone])}>{access.label}</span>
        <span className="text-xs text-muted">{user.hasTelegram ? "Telegram vinculado" : "Telegram não vinculado"}</span>
      </div>
      <div className="flex justify-end">
        <UserMenu row={row} actions={actions} onOpen={onOpen} />
      </div>
    </div>
  );
}

/**
 * Painel lateral do detalhe. Não-modal de propósito: o modal do Radix desliga
 * o clique fora dele, e o "Desfazer" do toast (que mora fora) ficaria morto.
 * O fundo escuro é um div comum — clicar nele conta como clique fora e fecha.
 */
function UserSidePanel({ row, actions, onClose }: { row?: UserRow; actions: AdminUserActions; onClose: () => void }) {
  // Segura o último usuário durante a animação de saída: a URL já não tem o id.
  const last = useRef(row);
  if (row) last.current = row;
  const shown = row ?? last.current;

  return (
    <DialogPrimitive.Root open={!!row} modal={false} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <div aria-hidden className="fixed inset-0 z-50 bg-black/45 animate-in fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onInteractOutside={(e) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("[data-sonner-toaster], [role='alertdialog']")) e.preventDefault();
          }}
          className="fixed inset-y-0 right-0 z-50 w-[440px] max-w-full flex flex-col border-l border-border bg-card outline-none duration-200 data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right"
          style={{ boxShadow: "-20px 0 40px rgb(0 0 0 / 0.4)" }}
        >
          {shown && (
            <>
              <DialogPrimitive.Title className="sr-only">{displayName(shown.user)}</DialogPrimitive.Title>
              <AdminUserDetail key={shown.user.id} row={shown} actions={actions} variant="panel" onClose={onClose} />
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function FiltersPopover({ view }: { view: AdminUsersView }) {
  const [open, setOpen] = useState(false);
  const n = view.secondaryCount;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FilterChip active={open || n > 0} icon={SlidersHorizontal} opensSheet>
          {n ? `Filtros · ${n}` : "Filtros"}
        </FilterChip>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[440px] p-0 rounded-xl">
        <div className="px-4 pt-3.5 pb-1.5 flex flex-col gap-3.5">
          <UserFilterGroups filters={view.filters} onChange={view.setFilters} />
        </div>
        <div className="mt-2.5 py-2.5 pl-4 pr-3 border-t border-border flex items-center gap-2">
          <span className="text-[12.5px] text-zinc-400 tabular-nums">
            {view.visible.length} de {view.rows.length} usuários
          </span>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={view.clearFilters}>
            Limpar
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            Pronto
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PromoteDialog({ view }: { view: AdminUsersView }) {
  const user = view.promoting;
  return (
    <ConfirmDialog
      open={!!user}
      onOpenChange={(open) => !open && view.cancelPromote()}
      title={`Tornar ${user ? displayName(user) : ""} administrador?`}
      description="Admin vê e altera todos os usuários, casas e o pipeline de tips. Dá pra desfazer depois, mudando o papel de volta."
      confirmLabel="Tornar admin"
      onConfirm={view.confirmPromote}
    />
  );
}

/**
 * Admin · Usuários. Lista pra consultar, detalhe pra administrar: a linha só
 * mostra o estado, e toda ação mora no ••• ou no detalhe.
 */
export function AdminUsers() {
  const view = useAdminUsersView();
  const isMobile = useIsMobile();
  const { users, isPending, isError, refetch, visible, panel, actions } = view;

  if (isMobile) {
    return (
      <>
        <AdminUsersMobile view={view} />
        <PromoteDialog view={view} />
      </>
    );
  }

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
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          Tentar de novo
        </Button>
      }
    />
  ) : (
    <div className="min-w-[760px]">
      <div className={cn(GRID, COLUMN_HEAD, "h-10 pl-5 pr-3 border-b border-border")}>
        <span>Usuário</span>
        <span>Papel</span>
        <span className="pr-8 text-right">Apostas</span>
        <span>Acesso</span>
        <span />
      </div>
      {visible.length === 0 ? (
        <EmptyState
          bare
          title="Nenhum usuário encontrado"
          description="Nada bate com a busca e os filtros atuais."
          action={
            <Button variant="secondary" size="sm" onClick={view.clearAll}>
              Limpar busca e filtros
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-border">
          {visible.map((row) => (
            <UserTableRow key={row.user.id} row={row} actions={actions} onOpen={() => panel.open(row.user.id)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-[18px]">
      <div className="flex items-start gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">Usuários</span>
          <span className="text-xl font-semibold tracking-tight">{users ? accountsHeadline(users.length, view.admins) : "Usuários"}</span>
        </div>
        <div className="relative w-[300px] shrink-0">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={view.search} onChange={(e) => view.setSearch(e.target.value)} placeholder="Buscar usuário ou e-mail" className="pl-9" />
        </div>
      </div>

      {users && (
        <div className="flex flex-wrap items-center gap-2">
          {view.tabs.map((t) => (
            <FilterChip key={t.id} active={view.tab === t.id} count={t.count} onClick={() => view.setTab(t.id)}>
              {t.label}
            </FilterChip>
          ))}
          <FiltersPopover view={view} />
        </div>
      )}

      {view.problems && view.tab !== "problems" && <ProblemsBanner text={view.problems} onOpen={() => view.setTab("problems")} />}

      <section className="rounded-xl border border-border bg-card shadow-card overflow-x-auto">{body}</section>

      <UserSidePanel row={view.selected} actions={actions} onClose={panel.close} />
      <PromoteDialog view={view} />
    </div>
  );
}
