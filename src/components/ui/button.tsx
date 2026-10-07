import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Variantes do app (todas com o mesmo `disabled:opacity-50`, sem um cinza
 * próprio pra desabilitado):
 *
 * - `primary` (padrão): azul cheio, rótulo branco. A ação principal da tela —
 *   Salvar, Nova aposta, FAB.
 * - `secondary`: contorno neutro. Ação ao lado da principal (Editar, Tentar de
 *   novo, Limpar filtros).
 * - `ghost`: só texto azul, fundo no hover. Ação terciária.
 * - `destructive`: texto vermelho, sem caixa (padrão de action sheet). Sair,
 *   Excluir, Desvincular.
 * - `icon`: botão redondo de 44px com ícone, neutro (busca e filtros do header).
 *   Use com `aria-label`.
 * - `link`: texto azul sublinhado no hover.
 */
const buttonVariants = cva(
  // `press` da o afundar no toque — no mobile o dedo cobre o botao e so a
  // mudanca de cor nao chega a ser percebida como resposta.
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border border-transparent bg-accent text-white hover:bg-accent/90 active:bg-accent/90",
        secondary:
          "border border-input bg-transparent hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
        ghost: "text-accent hover:bg-accent/10 active:bg-accent/[0.18]",
        destructive: "text-danger hover:bg-danger/10 active:bg-danger/[0.16]",
        icon:
          "relative rounded-full border border-foreground/10 bg-foreground/[0.04] text-zinc-300 hover:text-foreground hover:bg-foreground/[0.07] [&_svg]:size-[19px]",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-2 sm:h-10 sm:px-4",
        sm: "h-8 rounded-md px-2.5 sm:h-9 sm:px-3",
        lg: "h-12 rounded-lg px-6 text-[15px] font-semibold",
        icon: "h-8 w-8 sm:h-9 sm:w-9",
      },
    },
    // O botão redondo tem tamanho próprio (alvo de toque de 44px), seja qual
    // for o `size` passado.
    compoundVariants: [{ variant: "icon", className: "h-11 w-11 sm:h-11 sm:w-11 p-0 sm:px-0" }],
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  /** Só na variante `icon`: contador no canto (ex.: filtros ativos). 0 esconde. */
  badge?: number
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, badge, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    // Slot exige um filho só: com asChild o badge não entra.
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }
    return (
      <button className={classes} ref={ref} {...props}>
        {children}
        {!!badge && (
          <span className="absolute top-0.5 right-0.5 h-[15px] min-w-[15px] px-[3px] rounded-full bg-accent text-white text-xs font-medium flex items-center justify-center tabular-nums">
            {badge}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
