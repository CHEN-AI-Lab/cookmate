import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import RegisterClient from "./register-client"

export default async function RegisterPage() {
  const session = await auth()
  // 体验用户是 cookie 态（provider=demo），auth() 也会返回 session。
  // 若不区分，体验用户点「免费注册」会被判定已登录而弹回仪表盘。
  const isDemo = session?.user?.provider === "demo"

  // 已登录的真实用户直接跳转到仪表盘
  if (session?.user && !isDemo) {
    redirect("/app/dashboard")
  }

  return <RegisterClient isLoggedIn={false} isDemo={isDemo} />
}