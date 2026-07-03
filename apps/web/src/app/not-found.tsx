import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center">
      <div className="text-center">
        <span className="text-6xl">🔍</span>
        <h1 className="text-2xl font-bold text-[#2D3436] mt-4">页面不存在</h1>
        <p className="text-gray-500 mt-2">你访问的页面不存在或已被移除</p>
        <Link href="/" className="inline-block mt-6 bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  )
}