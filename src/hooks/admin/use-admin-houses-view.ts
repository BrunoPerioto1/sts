import { useState } from "react";
import { useUpdateAdminHouse } from "@/hooks/queries/use-admin";
import { actionToast } from "@/lib/action-toast";
import { getErrorMessage } from "@/lib/api-error";
import type { AdminHouse } from "@/api/routes/get-admin";

// Apelidos entram num campo de texto separados por vírgula. Um editor de chips
// seria mais bonito e resolveria o mesmo: são três nomes por casa, digitados
// uma vez por ano.
export const splitAliases = (raw: string) =>
  raw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

/** Edição de uma linha do catálogo: formulário completo, apelido rápido e (des)ativar. */
export function useHouseRowEditor(house: AdminHouse) {
  const update = useUpdateAdminHouse();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(house.name);
  const [aliases, setAliases] = useState(house.aliases.join(", "));
  const [site, setSite] = useState(house.websiteUrl ?? "");
  const [adding, setAdding] = useState(false);
  const [newAlias, setNewAlias] = useState("");

  const save = (params: { name?: string; aliases: string[]; websiteUrl?: string | null }, done: () => void) =>
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
    save(
      { name: name.trim() || house.name, aliases: splitAliases(aliases), websiteUrl: site.trim() || null },
      () => setEditing(false),
    );

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
    setSite(house.websiteUrl ?? "");
    setEditing(false);
  };

  return {
    pending: update.isPending,
    editing,
    startEdit: () => setEditing(true),
    cancelEdit,
    saveEdit,
    name,
    setName,
    aliases,
    setAliases,
    site,
    setSite,
    adding,
    setAdding,
    newAlias,
    setNewAlias,
    addAlias,
    toggleActive,
  };
}

/**
 * Busca, filtro e corte do catálogo. Sem busca, a tela abre nas `pageSize`
 * casas de maior volume — são as que alguém mexe; a busca mostra tudo que
 * bate, porque cortar esconderia justamente o que foi procurado.
 */
export function useHouseCatalog<F extends { id: string; test: (h: AdminHouse) => boolean }>(
  houses: AdminHouse[] | undefined,
  filters: readonly F[],
  initialFilter: F["id"],
  pageSize: number,
) {
  const [search, setSearch] = useState("");
  const [filter, setFilterState] = useState<F["id"]>(initialFilter);
  const [showAll, setShowAll] = useState(false);

  const all = [...(houses ?? [])].sort((a, b) => b.betCount - a.betCount);
  const term = search.trim().toLowerCase();
  const test = filters.find((f) => f.id === filter)?.test ?? (() => true);
  const filtered = all.filter(
    (h) =>
      test(h) &&
      (!term || h.name.toLowerCase().includes(term) || h.aliases.some((a) => a.toLowerCase().includes(term))),
  );
  const visible = showAll || term ? filtered : filtered.slice(0, pageSize);

  return {
    search,
    setSearch,
    term,
    filter,
    setFilter: (id: F["id"]) => {
      setFilterState(id);
      setShowAll(false);
    },
    showAll,
    setShowAll,
    filtered,
    visible,
    hidden: filtered.length - visible.length,
  };
}
