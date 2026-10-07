import { useEffect, useState } from "react";
import { SearchField } from "@/components/ui/search-field";

interface MobileSearchBarProps {
  value: string;
  onChange: (term: string) => void;
  resultsCount: number;
  open: boolean;
  onClose: () => void;
  // Ref vem de fora: quem abre a busca precisa focar o input DENTRO do próprio
  // gesto de toque (ver ApostasPage), senão o iOS não abre o teclado.
  inputRef: React.RefObject<HTMLInputElement>;
  placeholder?: string;
}

// Linha de busca renderizada no corpo da página (não no header) — aparece
// logo abaixo dele, acima dos chips rápidos de status. Não faz fetch nenhum:
// só controla o mesmo `searchTerm`/onSearch que já dirige fetchFilteredBets
// em ApostasPage — os resultados aparecem porque a listagem principal já
// reage ao `q`.
export function MobileSearchBar({ value, onChange, resultsCount, open, onClose, inputRef, placeholder = "Buscar apostas..." }: MobileSearchBarProps) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (!open) setPinned(false);
  }, [open]);

  if (!open) return null;

  // Sem texto não há o que limpar; fechar a busca fica com o botão do header.
  const handleClear = () => {
    onChange("");
    setPinned(false);
    onClose();
  };

  return (
    <div className="pb-3">
      <SearchField
        ref={inputRef}
        value={value}
        onChange={(term) => {
          onChange(term);
          setPinned(false);
        }}
        onClear={handleClear}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            inputRef.current?.blur();
            setPinned(true);
          }
        }}
        placeholder={placeholder}
      />
      {value && (
        <p className="mt-1.5 pl-1 text-xs text-zinc-500 truncate">
          {pinned
            ? `Busca fixada: "${value}" · ${resultsCount} resultado${resultsCount === 1 ? "" : "s"}`
            : `${resultsCount} resultado${resultsCount === 1 ? "" : "s"} · toque em Enter para fixar a busca`}
        </p>
      )}
    </div>
  );
}
