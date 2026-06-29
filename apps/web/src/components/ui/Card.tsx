import { type HTMLAttributes, type ReactNode } from "react"
import { cn } from "@cookmate/shared/utils"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn("px-5 pt-5 pb-3", className)} {...props}>
      {children}
    </div>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn("px-5 py-3", className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn("px-5 pt-3 pb-5 flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardContent, CardFooter }