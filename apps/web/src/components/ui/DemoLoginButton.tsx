"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function DemoLoginButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      onClick={async () => {
        if (loading) return
        setLoading(true)
        try {
          await signIn("demo", { callbackUrl: "/app/dashboard" })
        } catch {
          setLoading(false)
        }
      }}
      className={`${className} relative`}
    >
      <span className={loading ? "opacity-0" : ""}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 text-accent" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      )}
    </button>
  )
}