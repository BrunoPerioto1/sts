import { format } from "date-fns";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RefreshButtonProps {
  onRefresh: () => void;
  isFetching: boolean;
  /** `dataUpdatedAt` do React Query: quem sabe quando o dado chegou é o cache. */
  updatedAt: number;
  /** O que é atualizado, pro leitor de tela: "Atualizar tips". */
  label: string;
  className?: string;
}

/**
 * Atualizar do header no desktop, onde não há puxar pra baixo. Texto discreto
 * com a hora da última busca, não um botão competindo com o conteúdo — no
 * celular quem atualiza é o gesto.
 */
export function RefreshButton({ onRefresh, isFetching, updatedAt, label, className }: RefreshButtonProps) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      aria-label={label}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-foreground/[0.04] hover:text-zinc-300 disabled:opacity-60",
        className,
      )}
    >
      <ArrowsClockwise size={13} className={cn(isFetching && "animate-spin")} />
      {isFetching ? "atualizando…" : updatedAt ? `atualizado ${format(updatedAt, "HH:mm")}` : "atualizar"}
    </button>
  );
}
