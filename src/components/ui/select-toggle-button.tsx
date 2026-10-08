import { cn } from "@/lib/utils";

/**
 * "Selecionar" / "Cancelar" do header: liga e desliga o modo de seleção. O
 * mesmo em Tips, Conferência e Liquidar na mão — fora do modo não há checkbox.
 */
export function SelectToggleButton({ selecting, onToggle }: { selecting: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "press h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition-colors",
        selecting
          ? "bg-foreground/[0.08] text-foreground"
          : "border border-foreground/10 text-zinc-300 hover:text-foreground",
      )}
    >
      {selecting ? "Cancelar" : "Selecionar"}
    </button>
  );
}
