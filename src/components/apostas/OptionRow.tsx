import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface OptionRowProps {
  leading?: React.ReactNode;
  label: string;
  subtitle?: string;
  selected: boolean;
  onToggle: () => void;
  /** Contagem à direita, antes do marcador. */
  count?: number;
  /** Multi-seleção: marcador quadrado (checkbox) em vez de circular. */
  multi?: boolean;
  className?: string;
}

// Linha de opção com checkbox circular, reaproveitada pelo StatusSheet (barra
// colorida como leading) e pelo CasaSheet (avatar como leading + subtítulo).
export function OptionRow({ leading, label, subtitle, selected, onToggle, count, multi, className }: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "press flex w-full items-center gap-3 rounded-lg border px-3 py-2 min-h-[48px] text-left",
        // Linha inteira marcada (fundo + borda), não só o círculo.
        selected ? "border-accent/35 bg-accent/[0.14]" : "border-transparent hover:bg-foreground/[0.04]",
        className
      )}
    >
      {leading}
      <span className="flex-1 min-w-0">
        <span className={cn("block text-sm text-foreground truncate", selected && "font-medium")}>{label}</span>
        {subtitle && <span className="block text-xs text-zinc-500 truncate">{subtitle}</span>}
      </span>
      {count != null && (
        <span className={cn("shrink-0 text-sm tabular-nums", selected ? "text-zinc-200" : "text-zinc-400")}>
          {count}
        </span>
      )}
      <span
        className={cn(
          "h-5 w-5 shrink-0 border flex items-center justify-center transition-colors",
          multi ? "rounded-[5px]" : "rounded-full",
          selected ? "bg-accent border-accent" : "border-foreground/30"
        )}
      >
        {selected && <Check size={12} weight="bold" className="text-foreground" />}
      </span>
    </button>
  );
}

export function OptionBar({ color }: { color: string }) {
  return <span className="w-1 h-7 rounded-full shrink-0" style={{ background: color }} />;
}
