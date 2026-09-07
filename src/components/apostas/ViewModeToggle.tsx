import { Stack, Table } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/hooks/apostas/use-apostas-filters";

// Agrupado x Tabela — só desktop; no mobile o Agrupado é a única visão.
export function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="hidden md:flex items-center gap-1 rounded-lg bg-white/[0.04] p-1">
      <button
        type="button"
        onClick={() => onChange("agrupado")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          value === "agrupado" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        <Stack className="h-3.5 w-3.5" /> Agrupado
      </button>
      <button
        type="button"
        onClick={() => onChange("tabela")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
          value === "tabela" ? "bg-white text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
        )}
      >
        <Table className="h-3.5 w-3.5" /> Tabela
      </button>
    </div>
  );
}
