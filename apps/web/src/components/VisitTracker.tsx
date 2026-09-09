'use client'

import { useVisitTracking } from '@cookmate/shared/hooks/useVisitTracking'

export default function VisitTracker() {
  useVisitTracking('cookmate')
  return null
}