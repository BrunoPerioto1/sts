import type React from "react";
import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/**
 * Marcador da seleção sob demanda (Tips, Conferência, Liquidar na mão): círculo
 * no accent, não o checkbox verde — verde na tela já quer dizer lucro.
 * Só visual; quem marca é o toque no item inteiro. `indeterminate` é o
 * "algumas marcadas" do selecionar todas.
 */
export function SelectCheck({
  checked,
  indeterminate = false,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  className?: string;
}) {
  const on = checked || indeterminate;
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        on ? "border-accent bg-accent text-white" : "border-foreground/25",
        className,
      )}
    >
      {checked ? <Check size={12} weight="bold" /> : indeterminate && <span className="h-0.5 w-2 rounded-full bg-white" />}
    </span>
  );
}

/** O círculo como alvo de toque próprio: "selecionar todas", cabeçalho de grupo, linha do desktop. */
export function SelectCheckButton({
  checked,
  indeterminate = false,
  label,
  onClick,
  className,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? "mixed" : checked}
      aria-label={label}
      onClick={onClick}
      className={cn("press flex shrink-0 items-center justify-center rounded-full", className)}
    >
      <SelectCheck checked={checked} indeterminate={indeterminate} />
    </button>
  );
}
