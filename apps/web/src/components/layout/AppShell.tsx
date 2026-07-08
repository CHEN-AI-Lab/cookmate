import { Sidebar } from "./Sidebar"
import { MobileNav } from "./MobileNav"

export default function AppShell({
  children,
  name,
}: {
  children: React.ReactNode
  name?: string | null
}) {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex">
      <Sidebar name={name} />
      <MobileNav />
      <main className="flex-1 md:ml-0 pt-16 md:pt-4 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}