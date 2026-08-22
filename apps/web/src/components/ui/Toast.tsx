"use client"

import { createContext, useCallback, useContext, useState, useRef, ReactNode } from "react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* 固定定位在视口居中偏上 1/3，脱离文档流，不会引起页面抖动 */}
      <div className="fixed left-1/2 top-[33vh] -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-xl shadow-lg text-sm font-medium max-w-[90vw] text-center animate-toast-in ${
              t.type === "success"
                ? "bg-success/95 text-white"
                : t.type === "error"
                  ? "bg-error/95 text-white"
                  : "bg-card text-text-primary border border-border"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // 兜底：未在 Provider 内时提供空实现，避免崩溃
    return { showToast: (_m: string, _t?: ToastType) => {} }
  }
  return ctx
}
