import { useEffect, useState } from 'react'

export interface HealthStatus {
  status: 'loading' | 'ok' | 'degraded'
  openai: boolean
  ghl: boolean
  ghlLocation: boolean
  ghlUser: boolean
}

const POLL_INTERVAL_MS = 30_000

export function useHealthCheck(): HealthStatus {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'loading',
    openai: false,
    ghl: false,
    ghlLocation: false,
    ghlUser: false,
  })

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) throw new Error()
        const data = await res.json()
        const allOk = data.openai && data.ghl && data.ghlLocation && data.ghlUser
        setHealth({
          status: allOk ? 'ok' : 'degraded',
          openai: !!data.openai,
          ghl: !!data.ghl,
          ghlLocation: !!data.ghlLocation,
          ghlUser: !!data.ghlUser,
        })
      } catch {
        setHealth((prev) => ({ ...prev, status: 'degraded' }))
      }
    }

    check()
    const id = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return health
}
