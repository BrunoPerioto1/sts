import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] sm:text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-[var(--color-light)] text-[var(--color-onlight)] hover:bg-white active:opacity-90",
        destructive:
          "border border-negative text-negative bg-transparent hover:bg-negative/10",
        outline:
          "border border-input bg-transparent hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
        secondary:
          "border border-input bg-transparent hover:bg-foreground/[0.07] active:bg-foreground/[0.14]",
        ghost: "text-accent hover:bg-accent/10 active:bg-accent/[0.18]",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-2 sm:h-10 sm:px-4",
        sm: "h-8 rounded-md px-2.5 sm:h-9 sm:px-3",
        lg: "h-10 rounded-md px-6 sm:h-11 sm:px-8",
        icon: "h-8 w-8 sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
