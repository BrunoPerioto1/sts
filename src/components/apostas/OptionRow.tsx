import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface OptionRowProps {
  leading?: React.ReactNode;
  label: string;
  subtitle?: string;
  selected: boolean;
  onToggle: () => void;
  className?: string;
}

// Linha de opção com checkbox circular, reaproveitada pelo StatusSheet (barra
// colorida como leading) e pelo CasaSheet (avatar como leading + subtítulo).
export function OptionRow({ leading, label, subtitle, selected, onToggle, className }: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "press flex w-full items-center gap-3 rounded-lg px-3 py-2.5 min-h-[52px] text-left",
        selected ? "bg-accent/[0.14]" : "hover:bg-white/[0.04]",
        className
      )}
    >
      {leading}
      <span className="flex-1 min-w-0">
        <span className="block text-sm text-white truncate">{label}</span>
        {subtitle && <span className="block text-xs text-zinc-500 truncate">{subtitle}</span>}
      </span>
      <span
        className={cn(
          "h-5 w-5 shrink-0 rounded-full border flex items-center justify-center transition-colors",
          selected ? "bg-accent border-accent" : "border-white/20"
        )}
      >
        {selected && <Check size={12} weight="bold" className="text-white" />}
      </span>
    </button>
  );
}

export function OptionBar({ color }: { color: string }) {
  return <span className="w-1 h-7 rounded-full shrink-0" style={{ background: color }} />;
}
