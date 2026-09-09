"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function OnboardingGuard({
  onboardingCompleted,
  isDemoUser,
  locale,
}: {
  onboardingCompleted: boolean
  isDemoUser: boolean
  locale: string
}) {
  const router = useRouter()

  useEffect(() => {
    if (onboardingCompleted || isDemoUser) return
    const path = window.location.pathname
    if (!path.includes("onboarding-preview")) {
      router.replace(`/${locale}/app/onboarding-preview`)
    }
  }, [onboardingCompleted, isDemoUser, locale, router])

  return null
}