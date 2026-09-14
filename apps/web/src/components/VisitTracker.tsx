'use client'

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useVisitTracking } from "@cookmate/shared/hooks/useVisitTracking"

// 内层组件：session 查询完成后再挂载，保证每次页面加载只上报一次（且带上 userId）
function Tracker({ userId, enabled }: { userId: string | null; enabled: boolean }) {
  useVisitTracking("cookmate", undefined, undefined, userId, enabled)
  return null
}

export default function VisitTracker() {
  const pathname = usePathname()
  const segments = pathname?.split("/") ?? []
  // /admin 管理后台只有管理员使用，不计入访问统计
  //（/app/billing 是所有用户的账单/付款页，必须照常统计）
  const isAdminPage = segments.includes("admin")
  // undefined = session 还没查完；null = 未登录；string = 登录用户 ID
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    if (isAdminPage) return
    let cancelled = false
    // NextAuth 自带的 session REST 端点：拿到当前登录用户 ID（登录用户数 / UV 去重靠它）
    fetch("/api/auth/session", { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
      .then((s) => { if (!cancelled) setUserId(s?.user?.id ?? null) })
      .catch(() => { if (!cancelled) setUserId(null) })
    return () => { cancelled = true }
  }, [isAdminPage])

  // session 查询完成前不上报（避免「无 ID 报一次、拿到 ID 再报一次」重复计数）
  if (userId === undefined) return null
  return <Tracker userId={userId} enabled={!isAdminPage} />
}
