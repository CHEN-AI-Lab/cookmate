import { auth } from "@/lib/auth"
import LoginClient from "./login-client"

export default async function LoginPage() {
  const session = await auth()

  return (
    <LoginClient
      isLoggedIn={!!session?.user}
      userName={session?.user?.name || undefined}
    />
  )
}