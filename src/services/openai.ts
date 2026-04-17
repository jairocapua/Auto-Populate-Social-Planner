import type { UploadedFile, CaptionData, Platform } from '../types'

export async function reviseCaption(platform: string, currentCaption: string, instruction: string): Promise<string> {
  const res = await fetch('/api/revise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, currentCaption, instruction }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }))
    throw new Error(err.error || `Server error (${res.status})`)
  }
  const { caption } = await res.json()
  return caption
}
import { PLATFORMS } from '../constants/platforms'
import { getStaggeredSchedule } from '../utils/dateHelpers'

/**
 * Calls our backend /api/generate endpoint.
 * The server holds the OpenAI key and proxies the request — nothing is exposed in the browser.
 */
export async function generateCaptions(files: UploadedFile[], customPrompt?: string): Promise<CaptionData[]> {
  const imagesWithBase64 = files.filter((f) => !f.isVideo && f.base64)
  const hasOnlyVideos = imagesWithBase64.length === 0

  const body = {
    images: imagesWithBase64.map((f) => ({
      base64: f.base64,
      mediaType: f.mediaType,
    })),
    hasOnlyVideos,
    customPrompt: customPrompt?.trim() || undefined,
  }

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }))
    throw new Error(err.error || `Server error (${res.status})`)
  }

  const { captions } = (await res.json()) as { captions: Record<Platform, string> }

  return PLATFORMS.map((platform) => ({
    platform: platform.id,
    caption: captions[platform.id] || '',
    scheduleDate: getStaggeredSchedule(platform.id),
    scheduled: false,
  }))
}
