import { type HTMLAttributes, type ReactNode } from "react"
import { cn } from "@cookmate/shared/utils"

const variantStyles = {
  default: "bg-surface text-text-primary",
  success: "bg-green-100 text-success",
  warning: "bg-yellow-100 text-yellow-700",
  danger: "bg-red-100 text-red-700",
  brand: "bg-[#FFF0E6] text-accent",
} as const

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles
  children: ReactNode
}

export default function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}