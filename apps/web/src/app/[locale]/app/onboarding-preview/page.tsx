import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { isDemoUser } from "@/lib/auth-helpers"
import OnboardingPreviewContent from "./preview-content"

/**
 * 引导流程预览页。
 *
 * 体验态守卫必须放在页面自身：此前用 middleware 注入的 `x-invoke-path` 判断当前路径，
 * 但 Next.js App Router 不保证提供该请求头，守卫实际从未生效。
 * 体验用户只应看到只读示例，故在此直接跳回仪表盘。
 */
export default async function OnboardingPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const session = await auth()
  if (isDemoUser(session)) redirect(`/${locale}/app/dashboard`)

  return <OnboardingPreviewContent />
}
