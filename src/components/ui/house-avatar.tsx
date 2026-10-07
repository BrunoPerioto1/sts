import { cn } from "@/lib/utils";
import { houseColor, houseInitials } from "@/lib/format";

const SIZES = {
  sm: "h-6 w-6 rounded-md text-[10px]",
  md: "h-8 w-8 rounded-[9px] text-xs",
  lg: "h-10 w-10 rounded-[11px] text-sm",
} as const;

/**
 * Avatar da casa: duas letras do nome sobre uma cor derivada do próprio nome
 * (hash — a mesma casa tem a mesma cor em todas as telas, sem sorteio).
 * Sem favicon de propósito: buscar ícone num serviço externo entregaria a lista
 * de casas a terceiros e não funcionaria offline no PWA.
 */
export function HouseAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("shrink-0 flex items-center justify-center font-semibold text-white tracking-tight", SIZES[size], className)}
      style={{ background: houseColor(name) }}
    >
      {houseInitials(name)}
    </span>
  );
}
