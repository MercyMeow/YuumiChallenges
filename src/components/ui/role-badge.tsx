import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Crown, Shield, User } from "lucide-react"

import { cn } from "@/lib/utils"

const roleBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 shadow-sm hover:shadow-md backdrop-blur-sm",
  {
    variants: {
      role: {
        owner: [
          "bg-gradient-to-r from-amber-500/10 to-yellow-500/10",
          "border-amber-500/30 text-amber-300",
          "hover:from-amber-500/20 hover:to-yellow-500/20 hover:border-amber-400/50",
          "shadow-amber-500/10 hover:shadow-amber-500/20"
        ],
        admin: [
          "bg-gradient-to-r from-red-500/10 to-rose-500/10", 
          "border-red-500/30 text-red-300",
          "hover:from-red-500/20 hover:to-rose-500/20 hover:border-red-400/50",
          "shadow-red-500/10 hover:shadow-red-500/20"
        ],
        member: [
          "bg-gradient-to-r from-slate-500/10 to-gray-500/10",
          "border-slate-500/30 text-slate-300",
          "hover:from-slate-500/20 hover:to-gray-500/20 hover:border-slate-400/50", 
          "shadow-slate-500/10 hover:shadow-slate-500/20"
        ]
      },
      size: {
        sm: "px-2 py-1 text-xs gap-1",
        default: "px-3 py-1.5 text-xs gap-1.5",
        lg: "px-4 py-2 text-sm gap-2"
      }
    },
    defaultVariants: {
      role: "member",
      size: "default",
    },
  }
)

const roleIcons = {
  owner: Crown,
  admin: Shield, 
  member: User
} as const

const roleDisplayNames = {
  owner: "Owner",
  admin: "Admin",
 
  member: "Member"
} as const

export interface RoleBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof roleBadgeVariants> {
  role: keyof typeof roleIcons
  showIcon?: boolean
  showLabel?: boolean
}

function RoleBadge({ 
  className, 
  role = "member", 
  size, 
  showIcon = true, 
  showLabel = true,
  ...props 
}: RoleBadgeProps) {
  const Icon = roleIcons[role]
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-4 w-4" : "h-3.5 w-3.5"
  
  return (
    <div className={cn(roleBadgeVariants({ role, size }), className)} {...props}>
      {showIcon && <Icon className={iconSize} />}
      {showLabel && (
        <span className="capitalize">
          {roleDisplayNames[role]}
        </span>
      )}
    </div>
  )
}

export { RoleBadge, roleBadgeVariants }
