import { useEffect, useMemo, useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { OptionRow } from "./OptionRow";
import { Button } from "@/components/ui/button";
import { HouseAvatar } from "@/components/ui/house-avatar";
import { SearchField } from "@/components/ui/search-field";
import { SectionLabel } from "@/components/ui/section-label";
import { useHouseBalances } from "@/hooks/queries/use-houses";
import { formatInt, houseDisplayName } from "@/lib/format";

const RECENT_HOUSES_KEY = "apostas:recent-houses";

function readRecentHouseIds(): number[] {
  try {
    const raw = localStorage.getItem(RECENT_HOUSES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "number") : [];
  } catch {
    return [];
  }
}

// Preferência por dispositivo: não existe "última vez usada" na API, então
// guardamos localmente as casas selecionadas ao aplicar (mais recente primeiro).
function pushRecentHouseIds(ids: number[]) {
  if (ids.length === 0) return;
  try {
    const current = readRecentHouseIds();
    const next = [...ids, ...current.filter((id) => !ids.includes(id))].slice(0, 5);
    localStorage.setItem(RECENT_HOUSES_KEY, JSON.stringify(next));
  } catch {
    // localStorage indisponível (aba anônima etc.) — sem recentes, sem drama
  }
}

interface CasaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: { id: number; name: string }[];
  houseIds: number[];
  onChange: (next: number[]) => void;
  // false quando o sheet abre direto da tela, sem outro sheet por baixo:
  // NestedRoot do vaul estoura se não houver drawer pai.
  nested?: boolean;
  // false = seleção única (usado no form de aposta): tocar já seleciona e
  // fecha o sheet, sem rodapé de Aplicar. Default true preserva o
  // comportamento de filtro (multi-seleção + Aplicar).
  multiple?: boolean;
}

export function CasaSheet({
  open,
  onOpenChange,
  houses,
  houseIds,
  onChange,
  multiple = true,
  nested = true,
}: CasaSheetProps) {
  const [search, setSearch] = useState("");
  const [recentIds, setRecentIds] = useState<number[]>([]);

  // Compartilhado com a tela de Casas: abrir o sheet nao refaz a requisicao se
  // ela ja estiver no cache.
  const { data: balanceRows } = useHouseBalances();
  const balances = useMemo(() => {
    const map: Record<number, number> = {};
    for (const r of balanceRows ?? []) map[r.houseId] = Number(r.totalBets);
    return map;
  }, [balanceRows]);

  useEffect(() => {
    if (!open) return;
    setRecentIds(readRecentHouseIds());
    // Sem autofocus na busca de proposito: no mobile o teclado subia junto com
    // o sheet e comia metade da lista — pra escolher uma casa o toque na lista
    // resolve. Quem quer filtrar toca no campo e ai sim abre o teclado.
  }, [open]);

  const toggle = (id: number) => {
    if (!multiple) {
      onChange([id]);
      pushRecentHouseIds([id]);
      onOpenChange(false);
      return;
    }
    onChange(houseIds.includes(id) ? houseIds.filter((v) => v !== id) : [...houseIds, id]);
  };

  const term = search.trim().toLowerCase();
  const filtered = term ? houses.filter((h) => h.name.toLowerCase().includes(term)) : houses;

  const recentHouses = recentIds.map((id) => houses.find((h) => h.id === id)).filter((h): h is { id: number; name: string } => !!h);
  const fallbackRecent =
    recentHouses.length > 0 ? recentHouses : [...houses].sort((a, b) => (balances[b.id] ?? 0) - (balances[a.id] ?? 0)).slice(0, 5);

  const handleApply = () => {
    pushRecentHouseIds(houseIds);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      nested={nested}
      open={open}
      onOpenChange={onOpenChange}
      title="Casa"
      subHeader={<SearchField value={search} onChange={setSearch} placeholder="Buscar casa" />}
      footer={
        multiple ? (
          <Button className="w-full min-h-[44px]" onClick={handleApply}>
            {houseIds.length > 0 ? `Aplicar · ${houseIds.length} casas` : "Aplicar"}
          </Button>
        ) : undefined
      }
    >
      {!term && fallbackRecent.length > 0 && (
        <div className="pb-2 space-y-1">
          <SectionLabel as="h3">Usadas recentemente</SectionLabel>
          <div className="flex flex-col gap-1">
            {fallbackRecent.map((h) => (
              <OptionRow
                key={h.id}
                leading={<HouseAvatar name={h.name} />}
                label={houseDisplayName(h.name)}
                subtitle={balances[h.id] != null ? `${formatInt(balances[h.id])} apostas` : undefined}
                selected={houseIds.includes(h.id)}
                onToggle={() => toggle(h.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pb-4 space-y-1">
        <SectionLabel as="h3">{term ? `Todas · "${search}"` : "Todas"}</SectionLabel>
        <div className="flex flex-col gap-1">
          {filtered.map((h) => (
            <OptionRow
              key={h.id}
              leading={<HouseAvatar name={h.name} />}
              label={houseDisplayName(h.name)}
              subtitle={balances[h.id] != null ? `${formatInt(balances[h.id])} apostas` : undefined}
              selected={houseIds.includes(h.id)}
              onToggle={() => toggle(h.id)}
            />
          ))}
          {filtered.length === 0 && <p className="text-center py-6 text-sm text-zinc-500">Nenhuma casa encontrada.</p>}
        </div>
      </div>
    </BottomSheet>
  );
}
