import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import RegisterClient from "./register-client"

export default async function RegisterPage() {
  const session = await auth()

  // 已登录的用户直接跳转到仪表盘
  if (session?.user) {
    redirect("/app/dashboard")
  }

  return <RegisterClient isLoggedIn={false} />
}