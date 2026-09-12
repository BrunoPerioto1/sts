import { useMemo, useState } from "react";
import { CaretDown, MagnifyingGlass } from "@phosphor-icons/react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface FilterOption {
  id: number;
  name: string;
}

interface OptionMultiSelectProps {
  options: FilterOption[];
  selected: number[];
  onChange: (next: number[]) => void;
  /** Rótulo fixo à esquerda do resumo ("Casas", "Esporte"). */
  label: string;
  /** Plural usado no resumo a partir de 2 seleções ("3 casas"). */
  countLabel?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  className?: string;
  disabled?: boolean;
}

// Multi-seleção das barras de filtro do desktop (casas em Apostas/Tips/Casas,
// esportes em Apostas/Tips). Popover e não DropdownMenu por causa da busca: o
// typeahead do DropdownMenu rouba as teclas do campo. O mobile usa sheets.
export function OptionMultiSelect({
  options,
  selected,
  onChange,
  label,
  countLabel,
  searchPlaceholder = "Buscar",
  emptyLabel = "Nada encontrado.",
  className,
  disabled,
}: OptionMultiSelectProps) {
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const filtered = useMemo(
    () => (term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options),
    [options, term]
  );

  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((v) => v !== id) : [...selected, id]);

  // Um nome só cabe na barra; a partir de dois o número é mais legível que a
  // lista truncada — as chips embaixo dizem quais são.
  const summary =
    selected.length === 0
      ? null
      : selected.length === 1
        ? (options.find((o) => o.id === selected[0])?.name ?? `1 ${countLabel ?? label}`)
        : `${selected.length} ${countLabel ?? label.toLowerCase()}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 text-sm disabled:opacity-45 disabled:cursor-not-allowed",
            className
          )}
        >
          <span className="text-zinc-500 shrink-0">{label}</span>
          <span className={cn("truncate", summary ? "text-white" : "text-zinc-400")}>
            {summary ?? "Todos"}
          </span>
          <CaretDown className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[260px] p-2">
        <div className="relative mb-2">
          <MagnifyingGlass className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="max-h-[260px] overflow-y-auto">
          {filtered.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-zinc-200 hover:bg-white/[0.04]"
            >
              <Checkbox checked={selected.includes(o.id)} onCheckedChange={() => toggle(o.id)} />
              <span className="truncate">{o.name}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">{emptyLabel}</p>
          )}
        </div>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="mt-2 w-full border-t border-white/10 pt-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            Limpar seleção
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
