'use client'

import { useEffect } from 'react'
import { WORKER_URL } from '../constants'

export function useVisitTracking(project: string, page?: string | null, tool?: string) {
  useEffect(() => {
    const payload = JSON.stringify({
      project,
      page: page === null ? undefined : page || window.location.pathname,
      tool: tool || null,
      type: tool ? 'tool' : 'page',
    })

    navigator.sendBeacon(`${WORKER_URL}/track`, payload)
  }, [project, page, tool])
}