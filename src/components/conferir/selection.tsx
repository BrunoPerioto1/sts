import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Barra do lote da Conferência e do "Liquidar na mão". O botão que liga o modo
// é o mesmo de Tips (ui/select-toggle-button).

/** Barra do lote: flutua acima da borda no celular, rodapé largo no desktop. */
export function SelectionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="toolbar"
      aria-label="Ações das selecionadas"
      className={cn(
        "fixed z-50 flex flex-col gap-2.5 rounded-2xl border border-foreground/10 bg-zinc-900/95 p-3 backdrop-blur-md",
        "animate-in slide-in-from-bottom-4 duration-200",
        "inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))]",
        "md:inset-x-auto md:bottom-6 md:left-1/2 md:w-[calc(100%-3rem)] md:max-w-[960px] md:-translate-x-1/2 md:flex-row md:items-center md:gap-3 md:py-2.5 md:pl-5 md:pr-2.5",
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
    >
      <span aria-live="polite" className="px-1 text-[13px] tabular-nums text-zinc-300 md:mr-auto md:px-0 md:text-[13.5px]">
        {label}
      </span>
      {children}
    </div>
  );
}
