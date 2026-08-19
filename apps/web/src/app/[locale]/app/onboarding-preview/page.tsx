"use client"

import OnboardingWizard from "@/components/OnboardingWizard"

export default function OnboardingPreview() {
  return (
    <div className="min-h-screen bg-surface">
      <OnboardingWizard onComplete={() => window.location.href = "/app/dashboard"} />
    </div>
  )
}