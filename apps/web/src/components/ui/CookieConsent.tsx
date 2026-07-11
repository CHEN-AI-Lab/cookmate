"use client"

import { useState, useEffect } from "react"

const COOKIE_CONSENT_KEY = "cookmate_cookie_consent"

export default function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consented = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consented) {
      setShow(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted")
    setShow(false)
  }

  const reject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "rejected")
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 shadow-2xl p-4 sm:p-5">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-600 flex-1">
          🍪 本站使用必要的 Cookie 来维持正常运行。继续使用即表示您同意我们的{" "}
          <a href="/privacy" className="text-[#FF6B35] hover:underline">隐私政策</a>
          {" "}和{" "}
          <a href="/terms" className="text-[#FF6B35] hover:underline">服务条款</a>。
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={reject}
            className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
          >
            拒绝
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm text-white bg-[#FF6B35] rounded-full hover:bg-orange-600 transition-colors"
          >
            同意
          </button>
        </div>
      </div>
    </div>
  )
}