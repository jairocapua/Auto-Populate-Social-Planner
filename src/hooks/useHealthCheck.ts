import { useEffect, useState } from 'react'

export interface ServiceHealth {
  ok: boolean
  reason?: 'key_missing' | 'error'
  message?: string
  at?: number
  lastSuccess?: number | null
}

export interface GhlAccountHealth {
  platform: string
  name: string
  isExpired: boolean
  expire: string | null
  daysUntilExpiry: number | null
}

export interface HealthStatus {
  status: 'loading' | 'ok' | 'warning' | 'degraded'
  anthropic: ServiceHealth
  ghl: ServiceHealth
  ghlLocation: boolean
  ghlUser: boolean
  ghlAccounts: GhlAccountHealth[] | null
}

const POLL_INTERVAL_MS = 30_000
const LOADING: HealthStatus = {
  status: 'loading',
  anthropic: { ok: false },
  ghl: { ok: false },
  ghlLocation: false,
  ghlUser: false,
  ghlAccounts: null,
}

export function useHealthCheck(): HealthStatus {
  const [health, setHealth] = useState<HealthStatus>(LOADING)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/health')
        if (!res.ok) throw new Error()
        const data = (await res.json()) as HealthStatus
        setHealth(data)
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
