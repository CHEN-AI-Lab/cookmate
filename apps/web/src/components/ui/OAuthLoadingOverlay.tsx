"use client"

export default function OAuthLoadingOverlay({
  provider,
}: {
  provider: string | null
}) {
  if (!provider) return null

  const providerNames: Record<string, string> = {
    google: "Google",
    github: "GitHub",
    wechat: "微信",
    alipay: "支付宝",
    demo: "演示版",
  }

  const displayName = providerNames[provider] || provider

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
        <p className="text-sm font-medium text-gray-700">
          正在跳转到 {displayName} 登录...
        </p>
      </div>
    </div>
  )
}
