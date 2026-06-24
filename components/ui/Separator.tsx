import { cn } from "@/lib/utils"

interface SeparatorProps {
  label?: string
  className?: string
  orientation?: "horizontal" | "vertical"
}

export default function Separator({
  label,
  className,
  orientation = "horizontal",
}: SeparatorProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={cn(
          "mx-2 inline-block h-full w-px self-stretch bg-gray-200",
          className,
        )}
        aria-orientation="vertical"
        role="separator"
      />
    )
  }

  if (label) {
    return (
      <div
        className={cn("flex items-center gap-3", className)}
        role="separator"
        aria-orientation="horizontal"
      >
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs font-medium text-gray-400 whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 border-t border-gray-200" />
      </div>
    )
  }

  return (
    <div
      className={cn("h-px w-full bg-gray-200", className)}
      role="separator"
      aria-orientation="horizontal"
    />
  )
}