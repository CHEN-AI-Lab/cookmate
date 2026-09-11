'use client'

import { usePathname } from 'next/navigation'
import { useVisitTracking } from '@cookmate/shared/hooks/useVisitTracking'

export default function VisitTracker() {
  const pathname = usePathname()
  const segments = pathname?.split('/') ?? []
  // /admin 管理后台只有管理员使用，不计入访问统计
  //（/app/billing 是所有用户的账单/付款页，必须照常统计）
  const isAdminPage = segments.includes('admin')
  useVisitTracking('cookmate', undefined, undefined, !isAdminPage)
  return null
}