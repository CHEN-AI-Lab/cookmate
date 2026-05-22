"use client"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-8 max-w-md w-full text-center">
        <span className="text-5xl">😵</span>
        <h2 className="text-lg font-bold text-[#2D3436] mt-4">加载失败</h2>
        <p className="text-gray-500 mt-2 text-sm">
          该区域遇到了错误，请刷新重试
        </p>
        <button
          onClick={reset}
          className="mt-4 bg-[#FF6B35] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  )
}