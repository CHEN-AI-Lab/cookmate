"use client"

export default function RootError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string }
  reset: () => void
}) {
  void _error
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-8 max-w-md w-full text-center">
        <span className="text-6xl">😵</span>
        <h2 className="text-xl font-bold text-[#2D3436] mt-4">出错了</h2>
        <p className="text-gray-500 mt-2 text-sm">
          页面遇到了一个意外错误，请刷新重试
        </p>
        <button
          onClick={reset}
          className="mt-6 bg-[#FF6B35] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
  )
}