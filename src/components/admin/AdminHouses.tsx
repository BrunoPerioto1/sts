import { useState } from "react";
import { ArrowCounterClockwise, ArrowRight, MagnifyingGlass, PencilSimple, Plus, Prohibit, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminPanel, COLUMN_HEAD, FilterChip } from "@/components/admin/AdminPanel";
import { useAdminHouses, useCreateAdminHouse, useUpdateAdminHouse } from "@/hooks/queries/use-admin";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import type { AdminHouse } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

// Apelidos entram num campo de texto separados por vírgula. Um editor de chips
// seria mais bonito e resolveria o mesmo: são três nomes por casa, digitados
// uma vez por ano.
const splitAliases = (raw: string) =>
  raw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

const GRID = "sm:grid sm:items-center sm:gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_90px_64px]";

// Sem busca, a tela abre nas casas de maior volume — são as que alguém mexe.
const PAGE = 10;

const FILTERS = [
  { id: "noAlias", label: "Sem apelido", test: (h: AdminHouse) => h.aliases.length === 0 },
  { id: "alias", label: "Com apelido", test: (h: AdminHouse) => h.aliases.length > 0 },
  { id: "inactive", label: "Inativas", test: (h: AdminHouse) => !h.isActive },
  { id: "all", label: "Todas", test: () => true },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const iconButton =
  "w-7 h-7 flex items-center justify-center rounded-md opacity-45 hover:opacity-100 hover:bg-foreground/[0.07] transition disabled:opacity-20";

function HouseRow({ house }: { house: AdminHouse }) {
  const update = useUpdateAdminHouse();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(house.name);
  const [aliases, setAliases] = useState(house.aliases.join(", "));
  const [adding, setAdding] = useState(false);
  const [newAlias, setNewAlias] = useState("");

  const save = (params: { name?: string; aliases: string[] }, done: () => void) =>
    update.mutate(
      { id: house.id, ...params },
      {
        onSuccess: () => {
          done();
          actionToast.success({ title: "Casa salva" });
        },
        onError: (err) =>
          actionToast.error({ description: getErrorMessage(err, "Não foi possível salvar a casa.") }),
      },
    );

  const saveEdit = () =>
    save({ name: name.trim() || house.name, aliases: splitAliases(aliases) }, () => setEditing(false));

  const addAlias = () => {
    const alias = newAlias.trim();
    if (!alias) return setAdding(false);
    save({ aliases: [...house.aliases, alias] }, () => {
      setNewAlias("");
      setAdding(false);
    });
  };

  const toggleActive = () =>
    update.mutate(
      { id: house.id, isActive: !house.isActive },
      {
        onSuccess: () => actionToast.success({ title: house.isActive ? "Casa desativada" : "Casa reativada" }),
        onError: (err) => actionToast.error({ description: getErrorMessage(err, "Não foi possível mudar a casa.") }),
      },
    );

  const cancelEdit = () => {
    setName(house.name);
    setAliases(house.aliases.join(", "));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn(GRID, "px-4 sm:px-6 py-3 border-b border-border last:border-b-0 flex flex-col gap-2")}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da casa" autoFocus />
        <Input
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
          placeholder="Apelidos separados por vírgula"
        />
        <div className="flex gap-2 sm:col-span-2 sm:justify-end">
          <Button size="sm" disabled={update.isPending} onClick={saveEdit}>
            Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={cancelEdit}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        GRID,
        "px-4 sm:px-6 py-2.5 border-b border-border last:border-b-0 flex flex-col gap-2 min-h-[46px]",
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn("text-sm font-medium truncate", !house.isActive && "opacity-40")}>{house.name}</span>
        {!house.isActive && (
          <span className="text-[10px] font-medium tracking-wider px-1.5 py-0.5 rounded bg-foreground/[0.07] opacity-50">
            INATIVA
          </span>
        )}
        {/* No celular a coluna de apostas não existe: o número vem pro lado do nome. */}
        <span className="sm:hidden ml-auto text-sm tabular-nums opacity-55">{house.betCount}</span>
      </div>

      <div className={cn("flex flex-wrap items-center gap-1.5 min-w-0", !house.isActive && "opacity-50")}>
        {house.aliases.length === 0 && !adding && <span className="text-sm opacity-40">sem apelido</span>}
        {house.aliases.map((alias) => (
          <span key={alias} className="text-xs px-2 py-1 rounded-md border border-border">
            {alias}
          </span>
        ))}
        {adding ? (
          <Input
            value={newAlias}
            onChange={(e) => setNewAlias(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addAlias();
              if (e.key === "Escape") setAdding(false);
            }}
            onBlur={() => !newAlias.trim() && setAdding(false)}
            disabled={update.isPending}
            placeholder="Novo apelido ↵"
            className="h-7 w-40 text-xs"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 text-sm opacity-55 hover:opacity-100 hover:text-accent-text transition"
          >
            <Plus size={12} className="text-accent-text" />
            {house.aliases.length ? "apelido" : "cadastrar apelido"}
          </button>
        )}
      </div>

      <span className={cn("hidden sm:block text-sm tabular-nums text-right", !house.isActive && "opacity-40")}>
        {house.betCount}
      </span>

      <div className="flex justify-end gap-1 -mr-1.5">
        <button type="button" className={iconButton} onClick={() => setEditing(true)} aria-label="Editar casa" title="Editar">
          <PencilSimple size={15} />
        </button>
        <button
          type="button"
          className={iconButton}
          disabled={update.isPending}
          onClick={toggleActive}
          aria-label={house.isActive ? "Desativar casa" : "Reativar casa"}
          title={house.isActive ? "Desativar" : "Reativar"}
        >
          {house.isActive ? <Prohibit size={15} /> : <ArrowCounterClockwise size={15} />}
        </button>
      </div>
    </div>
  );
}

function NewHouseForm({ onDone }: { onDone: () => void }) {
  const create = useCreateAdminHouse();
  const [name, setName] = useState("");
  const [aliases, setAliases] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    create.mutate(
      { name: name.trim(), aliases: splitAliases(aliases) },
      {
        onSuccess: (house) => {
          actionToast.success({ title: `${house.name} cadastrada` });
          onDone();
        },
        // O 400 aqui é informativo — nome repetido com outra grafia, apelido
        // que já aponta pra outra casa. A mensagem do servidor diz qual.
        onError: (err) =>
          actionToast.error({ description: getErrorMessage(err, "Não foi possível cadastrar a casa.") }),
      },
    );
  };

  return (
    <form onSubmit={submit} className={cn(GRID, "px-4 sm:px-6 py-3 border-b border-border flex flex-col gap-2 bg-accent/[0.04]")}>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da casa" autoFocus />
      <Input
        value={aliases}
        onChange={(e) => setAliases(e.target.value)}
        placeholder="Apelidos separados por vírgula (opcional)"
      />
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <Button type="submit" size="sm" disabled={create.isPending || !name.trim()}>
          Cadastrar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDone} aria-label="Cancelar">
          <X size={14} />
        </Button>
      </div>
    </form>
  );
}

export function AdminHouses() {
  const { data: houses, isPending, isError, refetch } = useAdminHouses();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [showAll, setShowAll] = useState(false);

  const all = [...(houses ?? [])].sort((a, b) => b.betCount - a.betCount);
  const term = search.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const filtered = all.filter(
    (h) =>
      test(h) &&
      (!term || h.name.toLowerCase().includes(term) || h.aliases.some((a) => a.toLowerCase().includes(term))),
  );
  // Busca mostra tudo que bate: cortar em 10 esconderia justamente o que foi procurado.
  const visible = showAll || term ? filtered : filtered.slice(0, PAGE);
  const hidden = filtered.length - visible.length;

  const actions = (
    <>
      <div className="relative flex-1 sm:w-60">
        <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-35" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar casa ou apelido"
          className="pl-9"
        />
      </div>
      <Button onClick={() => setAdding(true)} disabled={adding} className="shrink-0">
        <Plus size={14} /> Nova casa
      </Button>
    </>
  );

  return (
    <AdminPanel
      eyebrow="Casas de aposta"
      title={houses ? `${houses.length} casas no catálogo` : "Casas no catálogo"}
      // O apelido é o que faz a tip achar a casa: `matchHouseIdByName` compara
      // por igualdade exata (depois de normalizar) antes de tentar semelhança.
      description={
        <>
          O apelido é a grafia que aparece na tip — “Superbet Brasil” aponta para{" "}
          <span className="font-medium text-foreground">SUPERBET</span>.
          <br />
          Cadastro global: vale para todos os usuários.
        </>
      }
      actions={actions}
      filters={
        houses &&
        FILTERS.map((f) => (
          <FilterChip
            key={f.id}
            active={filter === f.id}
            count={houses.filter(f.test).length}
            onClick={() => {
              setFilter(f.id);
              setShowAll(false);
            }}
          >
            {f.label}
          </FilterChip>
        ))
      }
      footer={
        houses &&
        !isError && (
          <>
            <span className="opacity-45">
              {visible.length} de {filtered.length} · ordenado por volume
            </span>
            {hidden > 0 ? (
              <button type="button" onClick={() => setShowAll(true)} className="flex items-center gap-1 text-accent-text hover:underline">
                Ver todas as {filtered.length} casas <ArrowRight size={13} />
              </button>
            ) : (
              showAll &&
              filtered.length > PAGE && (
                <button type="button" onClick={() => setShowAll(false)} className="text-accent-text hover:underline">
                  Mostrar só as {PAGE} maiores
                </button>
              )
            )}
          </>
        )
      }
    >
      {isPending ? (
        <div className="p-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          bare
          title="Não foi possível carregar as casas"
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : (
        <>
          <div className={cn(GRID, "hidden px-6 py-2.5 border-b border-border bg-foreground/[0.02]")}>
            <span className={COLUMN_HEAD}>Casa</span>
            <span className={COLUMN_HEAD}>Apelidos cadastrados</span>
            <span className={cn(COLUMN_HEAD, "text-right opacity-70")}>Apostas ▾</span>
            <span />
          </div>
          {adding && <NewHouseForm onDone={() => setAdding(false)} />}
          {visible.length === 0 ? (
            <EmptyState
              bare
              title="Nenhuma casa encontrada"
              description={term ? `Nada bate com "${search}" — nem no nome, nem nos apelidos.` : "Nenhuma casa neste filtro."}
            />
          ) : (
            visible.map((house) => <HouseRow key={house.id} house={house} />)
          )}
        </>
      )}
    </AdminPanel>
  );
}
