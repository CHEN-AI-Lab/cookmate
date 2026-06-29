"use client"

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { cn } from "@cookmate/shared/utils"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={cn(
              "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2",
              "text-sm text-gray-900 placeholder:text-gray-400",
              "transition-colors duration-150",
              "focus:border-[#FF6B35] focus:outline-none focus:ring-0",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-400 focus:border-red-500",
              icon && "pl-10",
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = "Input"

export { Input }
export default Input