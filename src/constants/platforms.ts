import type { PlatformConfig } from '../types'

export const PLATFORMS: PlatformConfig[] = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', charLimit: 3000, defaultHour: 8 },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', charLimit: 63206, defaultHour: 9 },
  { id: 'google_business', name: 'Google Business', color: '#4285F4', charLimit: 1500, defaultHour: 10 },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', charLimit: 2200, defaultHour: 11 },
]

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<string, PlatformConfig>
