import { forwardRef, type ButtonHTMLAttributes } from "react";
import { DotsThreeOutline } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface RowMenuButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Obrigatório: o ícone sozinho não diz de quem são as ações. */
  "aria-label": string;
}

/**
 * O "•••" de uma linha (aposta, casa, movimentação, usuário): mesmo ícone,
 * tamanho e estado aberto em todas as telas. Vai dentro de
 * <DropdownMenuTrigger asChild>, que passa o ref e o data-state.
 */
export const RowMenuButton = forwardRef<HTMLButtonElement, RowMenuButtonProps>(function RowMenuButton(
  { className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      {...props}
      className={cn(
        // 36px no toque, 32px nas tabelas do desktop (cabe na coluna de ação).
        "press size-9 sm:size-8 shrink-0 flex items-center justify-center rounded-lg text-foreground/55 transition-colors hover:text-foreground hover:bg-foreground/[0.07] data-[state=open]:text-foreground data-[state=open]:bg-foreground/[0.07]",
        className,
      )}
    >
      <DotsThreeOutline size={18} weight="fill" />
    </button>
  );
});
