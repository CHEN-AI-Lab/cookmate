import Link from "next/link"

export default function PublicNavbar({
  ctaHref,
  session,
}: {
  ctaHref?: string
  session?: boolean
}) {
  const link = ctaHref || (session ? "/app/dashboard" : "/register")

  return (
    <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🍳</span>
          <span className="text-xl font-bold text-[#2D3436]">CookMate</span>
        </Link>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
          <Link href="/#how" className="hover:text-[#FF6B35]">
            使用流程
          </Link>
          <Link href="/pricing" className="hover:text-[#FF6B35]">
            定价
          </Link>
          <Link href="/about" className="hover:text-[#FF6B35]">
            关于
          </Link>
          <Link
            href="/login"
            className="text-[#FF6B35] font-medium hover:text-orange-600"
          >
            登录
          </Link>
        </nav>
        <Link
          href={link}
          className="bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          免费开始
        </Link>
      </div>
    </header>
  )
}