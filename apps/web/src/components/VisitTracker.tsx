'use client'

import { usePathname } from 'next/navigation'
import { useVisitTracking } from '@cookmate/shared/hooks/useVisitTracking'

export default function VisitTracker() {
  const pathname = usePathname()
  const segments = pathname?.split('/') ?? []
  // 后台管理页（/admin 管理后台、/app/billing 支付后台）只有管理员使用，不计入访问统计
  const isAdminPage = segments.includes('admin') || segments.includes('billing')
  useVisitTracking('cookmate', undefined, undefined, !isAdminPage)
  return null
}