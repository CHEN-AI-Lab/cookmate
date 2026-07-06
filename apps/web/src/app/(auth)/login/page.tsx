import { auth } from "@/lib/auth"
import LoginClient from "./login-client"

export default async function LoginPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const userName = session?.user?.name || ""

  return <LoginClient isLoggedIn={isLoggedIn} userName={userName} />
}