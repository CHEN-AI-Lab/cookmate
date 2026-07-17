import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import DemoOnboarding from "@/components/ui/DemoOnboarding"
import OnboardingGuard from "@/components/ui/OnboardingGuard"

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { locale } = await params

  const onboardingCompleted = session.user.onboardingCompleted ?? false
  const isDemoUser = session.user.id.startsWith("demo")

  // Server-side guard: redirect demo users away from onboarding-preview
  if (isDemoUser) {
    const headersList = await headers()
    const pathname = headersList.get("x-invoke-path") || ""
    if (pathname.includes("onboarding-preview")) {
      redirect(`/${locale}/app/dashboard`)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      <OnboardingGuard onboardingCompleted={onboardingCompleted} isDemoUser={isDemoUser} locale={locale} />
      <Sidebar name={session.user.name} isDemoUser={isDemoUser} />
      <MobileNav isDemoUser={isDemoUser} />
      {isDemoUser && <DemoOnboarding />}
      <main className="flex-1 md:ml-0 pt-16 md:pt-4 px-4 md:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}