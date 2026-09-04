import { useEffect, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { BottomSheet } from "./BottomSheet";
import { OptionRow } from "./OptionRow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getHouseBalances } from "@/api/routes/get-houses";

const RECENT_HOUSES_KEY = "apostas:recent-houses";
const AVATAR_PALETTE = ["#5b7fff", "#f2555c", "#3ddc84", "#f5a623", "#a78bfa", "#22d3ee", "#fb7185", "#facc15"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function colorForHouse(id: number) {
  return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

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

function HouseAvatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="h-8 w-8 shrink-0 rounded-[8px] flex items-center justify-center text-xs font-semibold text-white"
      style={{ background: color }}
    >
      {initialsOf(name)}
    </span>
  );
}

interface CasaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  houses: { id: number; name: string }[];
  houseIds: number[];
  onChange: (next: number[]) => void;
  // false = seleção única (usado no form de aposta): tocar já seleciona e
  // fecha o sheet, sem rodapé de Aplicar. Default true preserva o
  // comportamento de filtro (multi-seleção + Aplicar).
  multiple?: boolean;
}

export function CasaSheet({ open, onOpenChange, houses, houseIds, onChange, multiple = true }: CasaSheetProps) {
  const [search, setSearch] = useState("");
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [recentIds, setRecentIds] = useState<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setRecentIds(readRecentHouseIds());
    getHouseBalances()
      .then((rows) => {
        const map: Record<number, number> = {};
        for (const r of rows) map[r.houseId] = Number(r.totalBets);
        setBalances(map);
      })
      .catch(() => undefined);
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
      nested
      open={open}
      onOpenChange={onOpenChange}
      title="Casa"
      subHeader={
        <div className="relative">
          <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Buscar casa"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9 min-h-[44px]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar busca"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      }
      footer={
        multiple ? (
          <Button className="w-full min-h-[44px]" onClick={handleApply}>
            {houseIds.length > 0 ? `Aplicar · ${houseIds.length} casas` : "Aplicar"}
          </Button>
        ) : undefined
      }
    >
      {!term && fallbackRecent.length > 0 && (
        <div className="pb-2">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1">Usadas recentemente</p>
          <div className="flex flex-col gap-1">
            {fallbackRecent.map((h) => (
              <OptionRow
                key={h.id}
                leading={<HouseAvatar name={h.name} color={colorForHouse(h.id)} />}
                label={h.name}
                subtitle={balances[h.id] != null ? `${balances[h.id]} apostas` : undefined}
                selected={houseIds.includes(h.id)}
                onToggle={() => toggle(h.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pb-4">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 px-1 pb-1">
          {term ? `Todas · "${search}"` : "Todas"}
        </p>
        <div className="flex flex-col gap-1">
          {filtered.map((h) => (
            <OptionRow
              key={h.id}
              leading={<HouseAvatar name={h.name} color={colorForHouse(h.id)} />}
              label={h.name}
              subtitle={balances[h.id] != null ? `${balances[h.id]} apostas` : undefined}
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
