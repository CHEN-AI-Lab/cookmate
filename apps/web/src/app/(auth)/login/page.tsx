import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginClient from "./login-client"

export default async function LoginPage() {
  // 不自动跳转，让用户自己选择登录方式
  return <LoginClient isLoggedIn={false} />
}