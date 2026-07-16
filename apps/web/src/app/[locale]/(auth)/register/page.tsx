import { auth } from "@/lib/auth"
import RegisterClient from "./register-client"

export default async function RegisterPage() {
  const session = await auth()

  return (
    <RegisterClient
      isLoggedIn={!!session?.user}
      userName={session?.user?.name || undefined}
    />
  )
}