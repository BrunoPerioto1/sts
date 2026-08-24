import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-[10px] py-[3px] text-[11px] tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent-800 text-accent-100",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-negative/[0.16] text-negative",
        outline: "border-accent text-accent bg-transparent",
        won: "border-transparent bg-positive/[0.16] text-positive",
        lost: "border-transparent bg-negative/[0.16] text-negative",
        pending: "border-transparent bg-accent-800 text-accent-100",
        canceled: "border-transparent bg-neutral-800 text-neutral-300",
        halfWon: "border-transparent bg-positive/[0.10] text-positive",
        halfLost: "border-transparent bg-negative/[0.10] text-negative",
        cashout: "border-transparent bg-accent-700 text-accent-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
