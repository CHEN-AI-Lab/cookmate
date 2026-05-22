"use client"

import OnboardingWizard from "@/components/OnboardingWizard"

export default function OnboardingPreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      <OnboardingWizard onComplete={() => window.location.href = "/app/dashboard"} />
    </div>
  )
}