import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  text?: string
  fullPage?: boolean
  className?: string
}

export default function LoadingSpinner({
  text,
  fullPage = false,
  className,
}: LoadingSpinnerProps) {
  // Full-page loading state with bounce emoji
  if (fullPage) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col items-center justify-center",
          "bg-[#FFF8F0]",
          className,
        )}
      >
        <span className="animate-bounce text-5xl">🍳</span>
        {text && (
          <p className="mt-4 text-sm text-gray-500 font-medium">{text}</p>
        )}
      </div>
    )
  }

  // Inline spinner
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <svg
        className="h-6 w-6 animate-spin text-[#FF6B35]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  )
}