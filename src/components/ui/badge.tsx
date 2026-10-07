import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-[10px] py-[3px] text-xs tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent-800 text-accent-100",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-danger/[0.16] text-danger",
        outline: "border-accent text-accent bg-transparent",
        won: "border-transparent bg-success/[0.16] text-success",
        lost: "border-transparent bg-danger/[0.16] text-danger",
        pending: "border-transparent bg-pending/[0.16] text-pending",
        canceled: "border-transparent bg-muted/[0.16] text-muted",
        halfWon: "border-transparent bg-success/[0.10] text-success",
        halfLost: "border-transparent bg-danger/[0.10] text-danger",
        cashout: "border-transparent bg-cashout/20 text-cashout",
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

export { Badge }
