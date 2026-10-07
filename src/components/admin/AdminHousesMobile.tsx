import { useState } from "react";
import { CaretRight, Info, Plus, X } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/apostas/BottomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MobileChip, MobileChips, MobileSearch } from "@/components/admin/AdminPanel";
import { useAdminHouses, useCreateAdminHouse, useUpdateAdminHouse } from "@/hooks/queries/use-admin";
import { useHouseCatalog } from "@/hooks/admin/use-admin-houses-view";
import { siteLabel } from "@/lib/house-url";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import type { AdminHouse } from "@/api/routes/get-admin";
import { cn } from "@/lib/utils";

const PAGE = 10;

const FILTERS = [
  { id: "noAlias", label: "Sem apelido", test: (h: AdminHouse) => h.aliases.length === 0 },
  { id: "alias", label: "Com apelido", test: (h: AdminHouse) => h.aliases.length > 0 },
  { id: "noSite", label: "Sem site", test: (h: AdminHouse) => h.isActive && !h.websiteUrl },
  { id: "inactive", label: "Inativas", test: (h: AdminHouse) => !h.isActive },
  { id: "all", label: "Todas", test: () => true },
] as const;

const fieldLabel = "text-xs text-zinc-500";

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
          actionToast.success({ title: `${created.name} cadastrada` });
          onClose();
        },
        onError,
      });
    }
  };

  return (
    <BottomSheet
      open
      onOpenChange={(open) => !open && onClose()}
      title={house?.name || "Nova casa"}
      footer={
        <div className="flex gap-2.5">
          <Button className="flex-1 h-12 text-[15px]" disabled={pending || !name.trim()} onClick={save}>
            {pending ? "Salvando…" : "Salvar"}
          </Button>
          <Button variant="ghost" className="w-[100px] h-12 text-zinc-400" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 pb-4">
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Nome</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Betano" className="h-[46px] rounded-xl" />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Apelidos</span>
          <div className="min-h-[46px] rounded-xl border border-input bg-card px-2 py-1.5 flex flex-wrap items-center gap-1.5">
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
              className="flex-1 min-w-[120px] h-[30px] bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground"
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
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>Site</span>
          <Input
            value={site}
            onChange={(e) => setSite(e.target.value)}
            placeholder="casa.bet.br"
            inputMode="url"
            className="h-[46px] rounded-xl"
          />
          <span className="text-[11.5px] leading-snug text-zinc-500">
            Só domínio .bet.br ou casa com liminar (ex.: Zeroum). Vira o botão “Abrir casa”.
          </span>
        </label>

        {/* Cadastro novo já nasce ativo: o POST não aceita isActive. */}
        {house && (
          <div className="flex items-center gap-3 pt-0.5">
            <div className="flex-1">
              <p className="text-[14.5px]">Ativa</p>
              <p className="text-[11.5px] text-zinc-500">Se desligar, a casa some das tips novas</p>
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
      </div>
    </BottomSheet>
  );
}

function HouseRow({ house, onEdit }: { house: AdminHouse; onEdit: () => void }) {
  return (
    <button type="button" onClick={onEdit} className="w-full py-3 pl-3.5 pr-3 flex items-center gap-3 text-left hover:bg-foreground/[0.03]">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("text-[14.5px] font-medium truncate", !house.isActive && "text-zinc-500")}>{house.name}</span>
          {!house.isActive && (
            <span className="shrink-0 text-[10.5px] px-1.5 rounded-[5px] border border-border text-zinc-500">inativa</span>
          )}
        </div>
        {house.aliases.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {house.aliases.map((alias) => (
              <span key={alias} className="text-[11.5px] px-[7px] py-0.5 rounded-md bg-foreground/[0.07] text-foreground/75">
                {alias}
              </span>
            ))}
          </div>
        )}
        <p className={cn("text-[11.5px] truncate", house.websiteUrl ? "text-zinc-500" : "text-[var(--dashboard-orange)]")}>
          {house.websiteUrl ? siteLabel(house.websiteUrl) : "sem site"}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end">
        <span className="text-sm tabular-nums text-foreground/85">{house.betCount.toLocaleString("pt-BR")}</span>
        <span className="text-[10.5px] text-zinc-500">apostas</span>
      </div>
      <CaretRight size={13} className="shrink-0 text-zinc-600" />
    </button>
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
  const { search, setSearch, term, filter, setFilter, setShowAll, filtered, visible, hidden } = useHouseCatalog(
    houses,
    FILTERS,
    "all",
    PAGE,
  );

  return (
    <div className="space-y-2.5">
      <MobileSearch value={search} onChange={setSearch} placeholder="Casa ou apelido" />
      {houses && (
        <MobileChips>
          {FILTERS.map((f) => (
            <MobileChip key={f.id} active={filter === f.id} count={houses.filter(f.test).length} onClick={() => setFilter(f.id)}>
              {f.label}
            </MobileChip>
          ))}
        </MobileChips>
      )}
      {/* O apelido é o que faz a tip achar a casa: `matchHouseIdByName` compara
          por igualdade exata (depois de normalizar) antes de tentar semelhança. */}
      <p className="flex gap-2 px-0.5 text-[11.5px] leading-snug text-zinc-500">
        <Info size={13} className="shrink-0 mt-px" />
        Apelido é como a casa aparece escrita na tip. Exemplo: “Superbet Brasil” aponta para Superbet.
      </p>

      {isPending ? (
        <div className="space-y-2 pt-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-xl" delay={i * 60} />
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          title="Não foi possível carregar as casas"
          action={
            <Button variant="outline" size="sm" onClick={() => void refetch()}>
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
          <div className="mt-1 rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {visible.map((house) => (
              <HouseRow key={house.id} house={house} onEdit={() => setEditing(house)} />
            ))}
          </div>
          <div className="pt-1.5 space-y-2">
            {hidden > 0 && (
              <Button variant="outline" className="w-full h-[42px] rounded-xl text-zinc-300" onClick={() => setShowAll(true)}>
                Carregar mais
              </Button>
            )}
            <p className="text-center text-[11.5px] text-zinc-500">
              {visible.length} de {filtered.length} · mais apostas primeiro
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
