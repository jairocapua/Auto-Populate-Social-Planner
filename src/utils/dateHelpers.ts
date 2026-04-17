import type { Platform } from '../types'
import { PLATFORM_MAP } from '../constants/platforms'

/**
 * Returns the next business day (Mon-Fri) from today.
 */
export function getNextBusinessDay(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const day = tomorrow.getDay()
  if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1) // Sunday → Monday
  if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2) // Saturday → Monday

  return tomorrow
}

/**
 * Returns an ISO datetime-local string (YYYY-MM-DDTHH:MM) for the next business day
 * at the platform's default posting hour.
 */
export function getStaggeredSchedule(platform: Platform): string {
  const config = PLATFORM_MAP[platform]
  const date = getNextBusinessDay()

  date.setHours(config.defaultHour, 0, 0, 0)

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')

  return `${yyyy}-${mm}-${dd}T${hh}:00`
}
