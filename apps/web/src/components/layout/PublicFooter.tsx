import Link from "next/link"

export default function PublicFooter() {
  return (
    <footer className="py-10 bg-[#2D3436] text-gray-400 text-sm">
      <div className="max-w-[1400px] mx-auto px-8 text-center">
        <p className="text-white font-bold text-lg">🍳 CookMate</p>
        <p className="mt-2">AI 智能食谱 &amp; 餐食规划平台</p>
        <div className="mt-4 flex justify-center gap-6 text-sm">
          <Link href="/#how" className="hover:text-white transition-colors">
            使用流程
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            关于
          </Link>
          <Link href="/pricing" className="hover:text-white transition-colors">
            定价
          </Link>
        </div>
        <p className="mt-6">&copy; 2026 CookMate. All rights reserved.</p>
      </div>
    </footer>
  )
}