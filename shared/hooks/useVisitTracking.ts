'use client'

import { useEffect } from 'react'
import { WORKER_URL, FALLBACK_URL } from '../constants'

// Environment is exposed via next.config.ts env (maps VERCEL_ENV → NEXT_PUBLIC_VERCEL_ENV)
const ENV =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_VERCEL_ENV) || 'development'

export function useVisitTracking(project: string, page?: string | null, tool?: string) {
  useEffect(() => {
    const payload = JSON.stringify({
      project,
      page: page === null ? undefined : page || window.location.pathname,
      tool: tool || null,
      type: tool ? 'tool' : 'page',
      env: ENV,
      platform: 'web',
    })

    // Try Worker first (foreign users), fallback to insights API (Chinese users)
    const track = async () => {
      try {
        await fetch(`${WORKER_URL}/track`, {
          method: 'POST',
          body: payload,
          signal: AbortSignal.timeout(3000),
        })
      } catch {
        navigator.sendBeacon(FALLBACK_URL, payload)
      }
    }
    track()
  }, [project, page, tool])
}
