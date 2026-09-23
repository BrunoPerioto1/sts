import { Desktop, Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "light", label: "Claro", icon: Sun },
  { value: "system", label: "Sistema", icon: Desktop },
] as const;

// Três botões e não um select: são poucas opções e a troca é imediata, sem
// "Salvar" — o next-themes guarda a escolha no localStorage deste aparelho.
export function ThemeSelect({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className={cn("inline-flex overflow-hidden rounded-md border border-border", className)} role="radiogroup" aria-label="Tema">
      {OPTIONS.map((o, i) => {
        const active = (theme ?? "dark") === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(o.value)}
            className={cn(
              "press flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap transition-colors",
              i > 0 && "border-l border-border",
              active ? "bg-accent text-white" : "text-zinc-400 hover:bg-foreground/[0.04]"
            )}
          >
            <o.icon size={14} /> {o.label}
          </button>
        );
      })}
    </div>
  );
}
