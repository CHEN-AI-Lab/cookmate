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
  // 原先的 id.startsWith("demo") 口径过宽：任何以 demo 开头的真实 id 都会被误判成体验用户。
  // ⚠️ 必须传整个 session —— isDemoUser 内部读的是 session.user.id，
  //    传 session.user 会因取不到 .user 而恒返回 false，整个体验态会静默失效
  //    （表现为：语言下拉不筛选成两种、切换语言不给提示、体验引导不出现）。
  const demoUser = isDemoUser(session)

  // 管理员判定（服务端）：复用 shared/admin-auth 的 isAdminEmail（ADMIN_EMAILS 白名单）
  const { isAdminEmail } = await import("@/lib/admin-auth")
  const isAdmin = isAdminEmail(session.user.email)

  return (
    <div className="min-h-screen bg-bg-brand flex">
      <OnboardingGuard onboardingCompleted={onboardingCompleted} isDemoUser={demoUser} locale={locale} />
      <Sidebar name={session.user.name} isDemoUser={demoUser} isAdmin={isAdmin} />
      <MobileNav name={session.user.name} isDemoUser={demoUser} isAdmin={isAdmin} />
      {demoUser && <DemoOnboarding />}
      {/* pb-24：给移动端底部标签栏（62px）留位，否则正文最后一段会被底栏盖住；桌面端无底栏，恢复 pb-8
          min-w-0：main 是 flex 子项，默认 min-width:auto 会被「不允许换行」的内容（如菜谱卡的 truncate 标题）
            顶到内容最小宽度，把整页横向撑开 —— 实测 390px 视口被撑到 607px，固定底栏随之被推到布局视口外
            （底栏 bottom 从 844 变 1249），表现为「页面比手机宽 + 右侧露白 + 底栏看不见」。
          pt-20：移动端顶栏 h-16(64px) 与 pt-16(64px) 等值，页面标题紧贴页眉分割线，这里留 16px 空隙。 */}
      <main className="flex-1 min-w-0 md:ml-0 pt-20 md:pt-4 px-4 md:px-8 pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
