import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-primary to-primary to-opacity-80 text-primary-foreground shadow-primary shadow-opacity-20 [a&]:hover:shadow-md [a&]:hover:shadow-primary [a&]:hover:shadow-opacity-30 [a&]:hover:scale-105",
        secondary:
          "border-secondary border-opacity-30 bg-secondary bg-opacity-20 backdrop-blur-sm text-secondary-foreground [a&]:hover:bg-secondary [a&]:hover:bg-opacity-30 [a&]:hover:border-secondary [a&]:hover:border-opacity-50",
        destructive:
          "border-transparent bg-gradient-to-r from-destructive to-destructive to-opacity-80 text-destructive-foreground shadow-destructive shadow-opacity-20 [a&]:hover:shadow-md [a&]:hover:shadow-destructive [a&]:hover:shadow-opacity-30 [a&]:hover:scale-105",
        outline:
          "border-input border-opacity-50 bg-background bg-opacity-50 backdrop-blur-sm text-foreground [a&]:hover:bg-accent [a&]:hover:bg-opacity-30 [a&]:hover:text-accent-foreground [a&]:hover:border-primary [a&]:hover:border-opacity-50",
        success:
          "border-transparent bg-gradient-to-r from-green-600 to-green-500 text-white shadow-green-500 shadow-opacity-20 [a&]:hover:shadow-md [a&]:hover:shadow-green-500 [a&]:hover:shadow-opacity-30 [a&]:hover:scale-105",
        warning:
          "border-transparent bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-yellow-500 shadow-opacity-20 [a&]:hover:shadow-md [a&]:hover:shadow-yellow-500 [a&]:hover:shadow-opacity-30 [a&]:hover:scale-105",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
