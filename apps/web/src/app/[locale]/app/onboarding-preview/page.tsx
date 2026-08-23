"use client"

import OnboardingWizard from "@/components/OnboardingWizard"
import { useRouter } from "@/i18n/navigation"

export default function OnboardingPreview() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-surface">
      <OnboardingWizard
        onComplete={() => router.replace("/app/dashboard")}
      />
    </div>
  )
}