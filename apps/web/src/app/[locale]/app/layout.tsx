import { auth } from "@/lib/auth"
import { isDemoUser } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { MobileNav } from "@/components/layout/MobileNav"
import DemoOnboarding from "@/components/ui/DemoOnboarding"
import OnboardingGuard from "@/components/ui/OnboardingGuard"

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const session = await auth()
  // 重定向保留语言前缀（localePrefix 为 always），否则中文用户会被跳到英文登录页
  if (!session?.user) redirect(`/${locale}/login`)

  const onboardingCompleted = session.user.onboardingCompleted ?? false
  // 体验态判断统一走 auth-helpers.isDemoUser（按 id/email 白名单精确匹配）。
  // 原先的 id.startsWith("demo") 口径过宽：任何以 demo 开头的真实 id 都会被误判成体验用户，
  // 导致侧边栏/移动端导航按体验模式渲染。onboarding-preview 的守卫已下移到页面自身。
  const demoUser = isDemoUser(session.user)

  // 管理员判定（服务端）：复用 shared/admin-auth 的 isAdminEmail（ADMIN_EMAILS 白名单）
  const { isAdminEmail } = await import("@/lib/admin-auth")
  const isAdmin = isAdminEmail(session.user.email)

  return (
    <div className="min-h-screen bg-bg-brand flex">
      <OnboardingGuard onboardingCompleted={onboardingCompleted} isDemoUser={demoUser} locale={locale} />
      <Sidebar name={session.user.name} isDemoUser={demoUser} isAdmin={isAdmin} />
      <MobileNav isDemoUser={demoUser} isAdmin={isAdmin} />
      {demoUser && <DemoOnboarding />}
      <main className="flex-1 md:ml-0 pt-16 md:pt-4 px-4 md:px-8 pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
