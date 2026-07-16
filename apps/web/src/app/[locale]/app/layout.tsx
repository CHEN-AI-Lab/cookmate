import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { locale } = await params

  // 新用户未完成 onboarding 时重定向
  if (!session.user.onboardingCompleted && !session.user.id.startsWith("demo")) {
    redirect(`/${locale}/app/onboarding-preview`)
  }

  const isDemoUser = session.user.id.startsWith("demo")

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      <Sidebar name={session.user.name} isDemoUser={isDemoUser} />
      <MobileNav isDemoUser={isDemoUser} />
      <main className="flex-1 md:ml-0 pt-16 md:pt-4 px-4 md:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}