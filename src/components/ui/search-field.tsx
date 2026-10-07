import { forwardRef, type KeyboardEvent } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Chamado no X (padrão: só limpa o texto). */
  onClear?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Campo de busca do app: lupa à esquerda, X pra limpar quando há texto.
 * Aberto logo abaixo do header nas telas em que buscar é a ação principal;
 * nas outras, aparece quando o botão de busca do header é tocado.
 * O ref vai pro <input> — quem abre a busca precisa focar dentro do próprio
 * toque, senão o iOS não abre o teclado.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, placeholder, onClear, onKeyDown, autoFocus, className },
  ref,
) {
  return (
    <div
      className={cn(
        "relative flex items-center h-11 rounded-xl border border-input bg-card transition-colors focus-within:border-accent",
        className,
      )}
    >
      <MagnifyingGlass size={16} className="absolute left-3 text-zinc-500 pointer-events-none" />
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") (onClear ?? (() => onChange("")))();
          onKeyDown?.(e);
        }}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-full bg-transparent pl-9 pr-10 text-base text-foreground placeholder:text-zinc-600 outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={onClear ?? (() => onChange(""))}
          aria-label="Limpar busca"
          className="absolute right-1 h-9 w-9 flex items-center justify-center text-zinc-500 hover:text-foreground"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
});
