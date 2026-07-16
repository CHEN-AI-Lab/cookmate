"use client"

import { useEffect } from "react"
import { cn } from "@cookmate/shared/utils"

type ToastType = "success" | "error" | "info"

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  type?: ToastType
  duration?: number
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-green-800 border-green-600",
  error: "bg-red-800 border-red-600",
  info: "bg-gray-900 border-gray-700",
}

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
}

export default function Toast({
  message,
  visible,
  onClose,
  type = "info",
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => onClose(), duration)
    return () => clearTimeout(timer)
  }, [visible, duration, onClose])

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 transition-all duration-200",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 pointer-events-none",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg",
          "text-sm text-white",
          typeStyles[type],
        )}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          {typeIcons[type]}
        </span>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          className="ml-1 rounded-full p-0.5 text-white/70 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}