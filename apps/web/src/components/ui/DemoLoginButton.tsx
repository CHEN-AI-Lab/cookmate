"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export default function DemoLoginButton({ children, className }: { children: React.ReactNode; className?: string }) {
  const [loading, setLoading] = useState(false)

  return (
    <button
      onClick={async () => {
        setLoading(true)
        try {
          await signIn("demo", { callbackUrl: "/app/dashboard" })
        } catch {
          setLoading(false)
        }
      }}
      disabled={loading}
      className={className}
    >
      {loading ? "..." : children}
    </button>
  )
}