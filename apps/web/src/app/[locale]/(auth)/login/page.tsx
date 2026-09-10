import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginClient from "./login-client"

export default async function LoginPage() {
  const session = await auth()
  // 同上：体验用户留在登录页，不能被当成已登录弹回仪表盘
  const isDemo = session?.user?.provider === "demo"

  // 已登录的用户直接跳转到仪表盘
  if (session?.user && !isDemo) {
    redirect("/app/dashboard")
  }

  return <LoginClient isLoggedIn={false} isDemo={isDemo} />
}