import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar, MobileNav } from "./NavClient"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      <Sidebar email={session.user.email} />
      <MobileNav />
      <main className="flex-1 md:ml-0 pt-16 md:pt-4 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}