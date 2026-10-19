import { useEffect, useState } from "react";
import { CaretRight, SlidersHorizontal } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchField } from "@/components/ui/search-field";
import { FilterChip } from "@/components/ui/filter-chips";
import { AdminUserDetail } from "@/components/admin/AdminUserDetail";
import { ProblemsBanner, UserAvatar, UserBadges, UserFilterGroups } from "@/components/admin/AdminUserParts";
import type { AdminUsersView, UserRow } from "@/hooks/admin/use-admin-users-view";
import { accessLabel, displayName, TONE_TEXT } from "@/lib/admin-users";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";

function UserListRow({ row: { user, state }, isMe, onOpen }: { row: UserRow; isMe: boolean; onOpen: () => void }) {
  const name = displayName(user);
  const access = accessLabel(user, state);

  return (
    <button type="button" onClick={onOpen} className="w-full p-3.5 flex items-start gap-3 text-left active:bg-foreground/[0.03]">
      <UserAvatar name={name} active={state.active} />
      <span className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="min-w-0 flex items-center gap-1.5">
          <span className={cn("min-w-0 truncate text-[15px] font-semibold", !state.active && "text-zinc-400")}>{name}</span>
          <UserBadges state={state} isMe={isMe} />
        </span>
        <span className="truncate text-[12.5px] text-muted">{user.email}</span>
        <span className="pt-[3px] text-xs text-zinc-400 tabular-nums">
          {formatInt(user.betCount)} apostas · Telegram {user.hasTelegram ? "✓" : "—"}
        </span>
      </span>
      <span className="self-center shrink-0 flex items-center gap-1.5">
        <span className={cn("whitespace-nowrap text-[13px] font-medium tabular-nums", TONE_TEXT[access.tone])}>{access.label}</span>
        <CaretRight size={13} className="text-zinc-600" />
      </span>
    </button>
  );
}

/**
 * Celular: a lista só consulta; tocar no usuário abre o detalhe em tela cheia
 * (o cabeçalho com o voltar fica no AdminUsersPage, que lê o mesmo ?user=).
 */
export function AdminUsersMobile({ view }: { view: AdminUsersView }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { users, isPending, isError, refetch, visible, selected, panel, actions } = view;
  const n = view.secondaryCount;
  const selectedId = selected?.user.id;

  // Tela empilhada: abre do topo, e não na altura em que a lista estava.
  useEffect(() => {
    if (selectedId) window.scrollTo(0, 0);
  }, [selectedId]);

  if (selected) {
    return <AdminUserDetail key={selected.user.id} row={selected} actions={actions} variant="page" />;
  }

  return (
    <div className="space-y-3">
      <SearchField value={view.search} onChange={view.setSearch} placeholder="Buscar usuário ou e-mail" />

      {users && (
        <div className="flex items-center gap-1.5">
          {/* px-2.5: as três abas e o filtro cabem lado a lado em 390px. Abaixo
              disso as abas rolam de lado, e o botão de filtros fica parado. */}
          <div className="flex-1 min-w-0 -my-1 py-1 flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {view.tabs.map((t) => (
              <FilterChip key={t.id} active={view.tab === t.id} count={t.count} onClick={() => view.setTab(t.id)} className="px-2.5">
                {t.label}
              </FilterChip>
            ))}
          </div>
          <FilterChip
            active={n > 0}
            icon={SlidersHorizontal}
            aria-label={n ? `Filtros, ${n} ativos` : "Filtros"}
            onClick={() => setFiltersOpen(true)}
            className="min-w-11 justify-center"
          >
            {n || null}
          </FilterChip>
        </div>
      )}

      {view.problems && view.tab !== "problems" && <ProblemsBanner compact text={view.problems} onOpen={() => view.setTab("problems")} />}

      {isPending ? (
        <div className="space-y-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar os usuários"
          action={
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nenhum usuário encontrado"
          description="Nada bate com a busca e os filtros."
          action={
            <Button variant="secondary" className="min-h-[44px]" onClick={view.clearAll}>
              Limpar busca e filtros
            </Button>
          }
        />
      ) : (
        <div className="rounded-[14px] border border-border bg-card shadow-card overflow-hidden divide-y divide-border">
          {visible.map((row) => (
            <UserListRow key={row.user.id} row={row} isMe={row.user.id === actions.meId} onOpen={() => panel.open(row.user.id)} />
          ))}
        </div>
      )}

      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtros"
        titleExtra={
          n > 0 && (
            <span className="h-5 min-w-[20px] px-1 rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center">
              {n}
            </span>
          )
        }
        footer={
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="min-h-[44px] px-4" onClick={view.clearFilters}>
              Limpar
            </Button>
            <Button className="flex-1 min-h-[44px]" onClick={() => setFiltersOpen(false)}>
              Ver {visible.length} {visible.length === 1 ? "usuário" : "usuários"}
            </Button>
          </div>
        }
      >
        <div className="py-2 flex flex-col gap-[18px]">
          <UserFilterGroups filters={view.filters} onChange={view.setFilters} size="lg" />
        </div>
      </BottomSheet>
    </div>
  );
}
