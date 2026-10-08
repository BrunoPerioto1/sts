import { useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, FormSheet } from "@/components/ui/form-sheet";
import { SearchField } from "@/components/ui/search-field";
import { FilterChips } from "@/components/ui/filter-chips";
import { SortSelect, type SortOption } from "@/components/ui/sort-select";
import { ListGroup, ListRow } from "@/components/ui/list-group";
import { HouseAvatar } from "@/components/ui/house-avatar";
import { HouseLogoPicker } from "@/components/admin/HouseLogoPicker";
import { adminLogoUrl } from "@/lib/house-logo";
import { useAdminHouses, useCreateAdminHouse, useUpdateAdminHouse } from "@/hooks/queries/use-admin";
import { useHouseCatalog, type CatalogSort } from "@/hooks/admin/use-admin-houses-view";
import { siteLabel } from "@/lib/house-url";
import { formatInt, houseDisplayName } from "@/lib/format";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import type { AdminHouse } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

const PAGE = 10;

// "Todas" primeiro: a faixa de chips abre no começo, e o padrão é o que se vê.
const FILTERS = [
  { id: "all", label: "Todas", test: () => true },
  { id: "noAlias", label: "Sem apelido", test: (h: AdminHouse) => h.aliases.length === 0 },
  { id: "alias", label: "Com apelido", test: (h: AdminHouse) => h.aliases.length > 0 },
  { id: "noSite", label: "Sem site", test: (h: AdminHouse) => h.isActive && !h.websiteUrl },
  { id: "inactive", label: "Inativas", test: (h: AdminHouse) => !h.isActive },
] as const;

const SORTS: SortOption<CatalogSort>[] = [
  { value: "bets", label: "Mais apostas", hint: "mais usadas primeiro" },
  { value: "name", label: "Nome", hint: "A → Z" },
];

// "https://www.betano.bet.br/x" → "betano.bet.br": o campo guarda só o domínio
// (o servidor põe o https:// de volta e valida o .bet.br).
function siteDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/[/?#].*$/, "");
}

// Folha de edição/cadastro: um campo por linha, com rótulo. `house` null = nova.
function HouseSheet({ house, onClose }: { house: AdminHouse | null; onClose: () => void }) {
  const create = useCreateAdminHouse();
  const update = useUpdateAdminHouse();
  const [name, setName] = useState(house?.name ?? "");
  const [aliases, setAliases] = useState<string[]>(house?.aliases ?? []);
  const [draft, setDraft] = useState("");
  const [site, setSite] = useState(house?.websiteUrl ?? "");
  const [active, setActive] = useState(house?.isActive ?? true);
  const pending = create.isPending || update.isPending;
  // `house` é a foto de quando a folha abriu; o logo é salvo na hora, então
  // o seletor lê a linha atual da lista.
  const { data: houses } = useAdminHouses();
  const live = house ? (houses?.find((h) => h.id === house.id) ?? house) : null;

  const addAlias = () => {
    const alias = draft.trim();
    if (alias && !aliases.includes(alias)) setAliases([...aliases, alias]);
    setDraft("");
  };

  const save = () => {
    if (!name.trim()) return;
    // Apelido digitado e não confirmado com Enter também entra.
    const all = draft.trim() && !aliases.includes(draft.trim()) ? [...aliases, draft.trim()] : aliases;
    const params = { name: name.trim(), aliases: all, websiteUrl: site.trim() || null };
    // O 400 aqui é informativo — nome repetido com outra grafia, apelido que
    // já aponta pra outra casa. A mensagem do servidor diz qual.
    const onError = (err: unknown) => actionToast.error({ description: getErrorMessage(err, "Não foi possível salvar a casa.") });
    if (house) {
      update.mutate(
        { id: house.id, ...params, ...(active !== house.isActive ? { isActive: active } : {}) },
        {
          onSuccess: () => {
            actionToast.success({ title: "Casa salva" });
            onClose();
          },
          onError,
        },
      );
    } else {
      create.mutate(params, {
        onSuccess: (created) => {
          actionToast.success({ title: `${houseDisplayName(created.name)} cadastrada` });
          onClose();
        },
        onError,
      });
    }
  };

  return (
    <FormSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={house ? "Editar casa" : "Nova casa"}
      onSubmit={save}
      submitting={pending}
      submitDisabled={!name.trim()}
    >
      {/* Logo salva sozinho, sem esperar o "Salvar" da folha. Casa nova ainda
          não tem id: o logo entra depois de cadastrada. */}
      {live && (
        <FormField label="Logo">
          <HouseLogoPicker house={live} withLabel />
        </FormField>
      )}

      <FormField label="Nome" htmlFor="house-name">
        <Input id="house-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Betano" className="h-[46px] rounded-xl" />
      </FormField>

      {/* O apelido é o que faz a tip achar a casa: `matchHouseIdByName` compara
          por igualdade exata (depois de normalizar) antes de tentar semelhança. */}
      <FormField
        label="Apelidos"
        htmlFor="house-alias"
        help="Apelido é como a casa aparece escrita na tip. Exemplo: “Superbet Brasil” aponta para Superbet."
      >
        <div className="min-h-[46px] rounded-xl border border-input bg-card px-2 py-1.5 flex flex-wrap items-center gap-1.5 focus-within:border-accent">
          {aliases.map((alias) => (
            <span key={alias} className="h-[30px] pl-2.5 pr-1 rounded-lg bg-foreground/[0.07] text-[13px] flex items-center gap-1">
              {alias}
              <button
                type="button"
                aria-label={`Remover ${alias}`}
                onClick={() => setAliases(aliases.filter((a) => a !== alias))}
                className="w-6 h-6 flex items-center justify-center text-zinc-500"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            id="house-alias"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addAlias();
              }
            }}
            onBlur={addAlias}
            enterKeyHint="done"
            placeholder={aliases.length ? "Outro apelido" : "Novo apelido"}
            className="flex-1 min-w-[120px] h-[30px] bg-transparent px-1 text-base outline-none placeholder:text-zinc-600"
          />
          {/* Botão visível em vez de "aperte Enter": no teclado do celular o
              Enter é escondido. Também vale sair do campo ou salvar direto. */}
          {draft.trim() && (
            <button
              type="button"
              // mousedown sem foco: o campo segue aberto pra digitar o próximo.
              onMouseDown={(e) => e.preventDefault()}
              onClick={addAlias}
              className="h-[30px] px-2.5 rounded-lg bg-accent/15 text-accent-text text-[13px] flex items-center gap-1"
            >
              <Plus size={12} /> Adicionar
            </button>
          )}
        </div>
      </FormField>

      <FormField
        label="Site"
        htmlFor="house-site"
        help="Só domínio .bet.br ou casa com liminar (ex.: Zeroum). Vira o botão “Abrir casa”."
      >
        <Input
          id="house-site"
          value={site}
          onChange={(e) => setSite(e.target.value)}
          onBlur={() => setSite((s) => siteDomain(s))}
          placeholder="casa.bet.br"
          inputMode="url"
          autoCapitalize="none"
          className="h-[46px] rounded-xl"
        />
      </FormField>

      {/* Cadastro novo já nasce ativo: o POST não aceita isActive. */}
      {house && (
        <div className="flex items-center gap-3 pt-0.5">
          <div className="flex-1">
            <p className="text-sm font-medium">Ativa</p>
            <p className="text-xs text-muted">Se desligar, a casa some das tips novas</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Ativa"
            onClick={() => setActive((v) => !v)}
            className={cn(
              "shrink-0 w-[46px] h-7 rounded-full border px-[3px] flex items-center transition-colors",
              active ? "justify-end bg-accent border-accent" : "justify-start bg-background border-border",
            )}
          >
            <span className={cn("w-5 h-5 rounded-full", active ? "bg-white" : "bg-foreground/35")} />
          </button>
        </div>
      )}
    </FormSheet>
  );
}

function HouseRow({ house, onEdit }: { house: AdminHouse; onEdit: () => void }) {
  // Site e apelidos na mesma linha de subtítulo: a linha não cresce quando a
  // casa tem apelido.
  const site = house.websiteUrl ? siteLabel(house.websiteUrl) : null;
  return (
    <ListRow
      onClick={onEdit}
      dimmed={!house.isActive}
      leading={<HouseAvatar name={house.name} logoUrl={adminLogoUrl(house)} className={cn(!house.isActive && "opacity-50")} />}
      title={
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="truncate">{houseDisplayName(house.name)}</span>
          {!house.isActive && (
            <span className="shrink-0 rounded-full bg-foreground/[0.08] px-1.5 py-px text-[10.5px] font-medium text-zinc-400">Inativa</span>
          )}
        </span>
      }
      subtitle={
        <>
          {site ?? <span className="text-warning">sem site</span>}
          {house.aliases.length > 0 && ` · ${house.aliases.join(", ")}`}
        </>
      }
      trailing={<span className="text-sm tabular-nums text-foreground/85">{formatInt(house.betCount)}</span>}
      chevron
    />
  );
}

/**
 * Catálogo de casas no celular: busca, filtros numa faixa, linhas que abrem a
 * edição numa folha. `editing` sobe pro page pra o "Nova" do cabeçalho abrir
 * a mesma folha.
 */
export function AdminHousesMobile({
  editing,
  setEditing,
}: {
  editing: AdminHouse | "new" | null;
  setEditing: (value: AdminHouse | "new" | null) => void;
}) {
  const { data: houses, isPending, isError, refetch } = useAdminHouses();
  const { search, setSearch, term, filter, setFilter, setShowAll, sort, setSort, filtered, visible, hidden } = useHouseCatalog(
    houses,
    FILTERS,
    "all",
    PAGE,
  );

  return (
    <div className="space-y-3">
      <SearchField value={search} onChange={setSearch} placeholder="Casa ou apelido" />
      {houses && (
        <FilterChips
          options={FILTERS.map((f) => ({ value: f.id, label: f.label, count: houses.filter(f.test).length }))}
          value={filter}
          onChange={setFilter}
        />
      )}

      {isPending ? (
        <div className="space-y-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[60px] rounded-xl" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar as casas"
          action={
            <Button variant="secondary" size="sm" onClick={() => void refetch()}>
              Tentar de novo
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nenhuma casa encontrada"
          description={term ? `Nada bate com "${search}" — nem no nome, nem nos apelidos.` : "Nenhuma casa neste filtro."}
        />
      ) : (
        <>
          <ListGroup
            title="Casas"
            count={filtered.length}
            titleAction={<SortSelect options={SORTS} value={sort} onChange={setSort} />}
          >
            {visible.map((house) => (
              <HouseRow key={house.id} house={house} onEdit={() => setEditing(house)} />
            ))}
          </ListGroup>
          <div className="pt-1.5 space-y-2">
            {hidden > 0 && (
              <Button variant="secondary" className="w-full h-[42px] rounded-xl" onClick={() => setShowAll(true)}>
                Carregar mais
              </Button>
            )}
            <p className="text-center text-xs text-muted">
              {formatInt(visible.length)} de {formatInt(filtered.length)}
            </p>
          </div>
        </>
      )}

      {editing && (
        <HouseSheet
          key={editing === "new" ? "new" : editing.id}
          house={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
