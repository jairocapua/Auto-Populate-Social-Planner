import type { CaptionData, ScheduledPost, UploadedFile } from '../types'
import { authFetch } from './auth'

async function fetchWithRetry(url: string, init: RequestInit, retries = 2, delayMs = 500): Promise<Response> {
  let lastRes: Response | undefined
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await authFetch(url, init)
    if (res.status < 500) return res
    lastRes = res
    if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs))
  }
  return lastRes!
}

export type ScheduleResult =
  | { ok: true; postId?: string }
  | { ok: false; error: 'upload_failed' | 'schedule_failed'; details?: string }

async function uploadImage(file: UploadedFile): Promise<string | null> {
  if (file.isVideo || !file.base64) return null

  try {
    const res = await authFetch('/api/upload', {
      method: 'POST',
      body: JSON.stringify({
        base64: file.base64,
        fileName: file.file.name,
        mediaType: file.mediaType,
      }),
    })

    if (!res.ok) return null

    const data = await res.json()
    return data.url || null
  } catch {
    return null
  }
}

export async function schedulePost(
  caption: CaptionData,
  files: UploadedFile[]
): Promise<ScheduleResult> {
  const firstFile = files[0]

  let imageUrl: string | null = null
  let imageType: string | undefined
  if (firstFile && !firstFile.isVideo) {
    imageUrl = await uploadImage(firstFile)
    if (!imageUrl) return { ok: false, error: 'upload_failed' }
    imageType = firstFile.mediaType
  }

  try {
    const res = await fetchWithRetry('/api/schedule', {
      method: 'POST',
      body: JSON.stringify({
        platform: caption.platform,
        caption: caption.caption,
        scheduleDate: new Date(caption.scheduleDate).toISOString(),
        imageUrl,
        imageType,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, error: 'schedule_failed', details: data.error || data.details }
    return { ok: true, postId: data.postId }
  } catch (err) {
    return {
      ok: false,
      error: 'schedule_failed',
      details: err instanceof Error ? err.message : 'unknown',
    }
  }
}

export async function fetchScheduledPosts(): Promise<ScheduledPost[]> {
  const res = await authFetch('/api/scheduled-posts', { method: 'GET' })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  }
  const data = (await res.json()) as { posts: ScheduledPost[] }
  return data.posts
}
