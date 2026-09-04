import { useEffect, useRef, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface MobileSearchToggleProps {
  expanded: boolean;
  onToggle: () => void;
}

// Botão fixo no cluster de ícones do header (junto de seleção/reload/filtro)
// — o header nunca muda de layout, só esse ícone alterna estado.
export function MobileSearchToggle({ expanded, onToggle }: MobileSearchToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={expanded ? "Fechar busca" : "Buscar apostas"}
      className={cn("p-2 hover:text-white", expanded ? "text-accent" : "text-zinc-400")}
    >
      <MagnifyingGlass size={19} />
    </button>
  );
}

interface MobileSearchBarProps {
  value: string;
  onChange: (term: string) => void;
  resultsCount: number;
  open: boolean;
  onClose: () => void;
}

// Linha de busca renderizada no corpo da página (não no header) — aparece
// logo abaixo dele, acima dos chips rápidos de status. Não faz fetch nenhum:
// só controla o mesmo `searchTerm`/onSearch que já dirige fetchFilteredBets
// em ApostasPage — os resultados aparecem porque a listagem principal já
// reage ao `q`.
export function MobileSearchBar({ value, onChange, resultsCount, open, onClose }: MobileSearchBarProps) {
  const [pinned, setPinned] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPinned(false);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const handleClear = () => {
    onChange("");
    setPinned(false);
    onClose();
  };

  return (
    <div className="pb-3">
      <div
        className={cn(
          "relative flex items-center h-10 rounded-md border bg-white/[0.03] transition-colors",
          focused ? "border-accent" : "border-white/10"
        )}
      >
        <MagnifyingGlass className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setPinned(false);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              inputRef.current?.blur();
              setPinned(true);
            } else if (e.key === "Escape") {
              handleClear();
            }
          }}
          placeholder="Buscar apostas..."
          className="flex-1 min-w-0 h-full bg-transparent pl-9 pr-9 text-sm text-white placeholder:text-zinc-500 outline-none"
        />
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar busca"
          className="absolute right-1.5 h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {value && (
        <p className="mt-1.5 pl-1 text-[11.5px] text-zinc-500 truncate">
          {pinned
            ? `Busca fixada: "${value}" · ${resultsCount} resultado${resultsCount === 1 ? "" : "s"}`
            : `${resultsCount} resultado${resultsCount === 1 ? "" : "s"} · toque em Enter para fixar a busca`}
        </p>
      )}
    </div>
  );
}
