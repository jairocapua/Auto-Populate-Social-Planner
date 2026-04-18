import type { PlatformConfig } from '../types'

export const PLATFORMS: PlatformConfig[] = [
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2', charLimit: 3000, defaultHour: 8, logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/linkedin-app-icon.png' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2', charLimit: 63206, defaultHour: 9, logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/facebook-round-color-icon.png' },
  { id: 'google_business', name: 'Google Business', color: '#4285F4', charLimit: 1500, defaultHour: 10, logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/google-my-business-icon.png' },
  { id: 'instagram', name: 'Instagram', color: '#E4405F', charLimit: 2200, defaultHour: 11, logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/ig-instagram-icon.png' },
]

export const PLATFORM_MAP = Object.fromEntries(
  PLATFORMS.map((p) => [p.id, p])
) as Record<string, PlatformConfig>
