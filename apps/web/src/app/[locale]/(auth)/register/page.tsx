import { auth } from "@/lib/auth"
import RegisterClient from "./register-client"

export default async function RegisterPage() {
  const session = await auth()
  const isLoggedIn = !!session?.user
  const userName = session?.user?.name || ""

  return <RegisterClient isLoggedIn={isLoggedIn} userName={userName} />
}